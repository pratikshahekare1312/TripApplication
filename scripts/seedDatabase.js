const fs = require('fs');
const path = require('path');

function getModule(name) {
  const candidates = [
    name,
    path.join(__dirname, '../backend/node_modules', name),
    path.join(__dirname, 'node_modules', name),
    path.join(process.cwd(), 'backend/node_modules', name)
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch (e) {
      // continue
    }
  }
  return require(name);
}

const csv = getModule('csv-parser');
const mysql = getModule('mysql2/promise');
const dotenv = getModule('dotenv');

// 1. Locate .env file
const envPathCandidates = [
  path.join(__dirname, '../backend/.env'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '.env'),
  path.join(process.cwd(), 'backend/.env')
];

let envPath = envPathCandidates.find(p => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

// 2. Locate CSV file
const csvPathCandidates = [
  path.join(__dirname, '../data/enriched_dataset.csv'),
  path.join(__dirname, 'data/enriched_dataset.csv'),
  path.join(process.cwd(), 'data/enriched_dataset.csv')
];

const csvPath = csvPathCandidates.find(p => fs.existsSync(p));
if (!csvPath) {
  console.error('[Error] Could not find enriched_dataset.csv in expected locations.');
  process.exit(1);
}

// Helper to parse Python-like list strings: "['item1', 'item2']" -> Array
function parseList(value) {
  if (!value || typeof value !== 'string') return [];
  const trimmed = value.trim();
  if (!trimmed || trimmed === '[]' || trimmed === 'nan' || trimmed === 'None') return [];

  try {
    const jsonStr = trimmed.replace(/'/g, '"');
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map(v => String(v).trim()).filter(Boolean);
    }
  } catch (e) {
    // Fallback for manual splitting
  }

  const cleaned = trimmed.replace(/^\[|\]$/g, '');
  return cleaned
    .split(',')
    .map(s => s.trim().replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
}

const cleanString = (val) => {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return (s === '' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'none') ? null : s;
};

const cleanFloat = (val) => {
  if (val === undefined || val === null) return null;
  const n = parseFloat(String(val).trim());
  return Number.isFinite(n) ? n : null;
};

const cleanInt = (val) => {
  if (val === undefined || val === null) return null;
  const n = parseInt(String(val).trim(), 10);
  return Number.isFinite(n) ? n : null;
};

// Extract coordinates from SQL dump if present
function loadCoordinatesFromSql() {
  const sqlCandidates = [
    path.join(__dirname, '../database/travel_planner_data.sql'),
    path.join(__dirname, 'database/travel_planner_data.sql'),
    path.join(process.cwd(), 'database/travel_planner_data.sql')
  ];
  const sqlPath = sqlCandidates.find(p => fs.existsSync(p));
  const coordsMap = new Map();
  if (!sqlPath) return coordsMap;

  try {
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const startMarker = 'INSERT INTO `places` VALUES ';
    const startIndex = sql.indexOf(startMarker);
    if (startIndex !== -1) {
      const endIndex = sql.indexOf(';', startIndex);
      const valuesStr = sql.slice(startIndex + startMarker.length, endIndex);
      const regex = /\((\d+),'((?:[^'\\]|\\.)*)','((?:[^'\\]|\\.)*)',.*?(-?\d+\.\d+),(-?\d+\.\d+)\)/g;
      let m;
      while ((m = regex.exec(valuesStr)) !== null) {
        const name = m[2].replace(/\\'/g, "'").trim().toLowerCase();
        const city = m[3].replace(/\\'/g, "'").trim().toLowerCase();
        const lat = parseFloat(m[4]);
        const lon = parseFloat(m[5]);
        coordsMap.set(`${name}|${city}`, { lat, lon });
        if (!coordsMap.has(name)) {
          coordsMap.set(name, { lat, lon });
        }
      }
    }
  } catch (err) {
    console.warn('[Warning] Could not extract coordinates from SQL dump:', err.message);
  }
  return coordsMap;
}

async function seed() {
  console.log('--- Starting Database Seeding ---');
  console.log(`Using CSV source: ${csvPath}`);

  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
  const database = process.env.DB_NAME || 'travel_planner';
  const port = Number(process.env.DB_PORT) || 3306;
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  console.log(`Connecting to MySQL on ${host}:${port} as ${user} (SSL: ${process.env.DB_SSL === 'true'})...`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host,
      user,
      password,
      database,
      port,
      ssl,
      multipleStatements: true
    });
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.log(`Database "${database}" not found, attempting to create...`);
      const serverConn = await mysql.createConnection({
        host,
        user,
        password,
        port,
        ssl
      });
      await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await serverConn.end();

      conn = await mysql.createConnection({
        host,
        user,
        password,
        database,
        port,
        ssl,
        multipleStatements: true
      });
    } else {
      throw err;
    }
  }

  console.log(`[DB] Connected to database: "${database}"`);

  // Ensure states table exists
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`states\` (
      \`state_id\` int NOT NULL AUTO_INCREMENT,
      \`state_name\` varchar(100) NOT NULL,
      PRIMARY KEY (\`state_id\`),
      UNIQUE KEY \`state_name\` (\`state_name\`)
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Ensure constraint_rules table exists & is populated
  await conn.query(`
    CREATE TABLE IF NOT EXISTS \`constraint_rules\` (
      \`rule_id\` int NOT NULL AUTO_INCREMENT,
      \`condition_field\` varchar(100) NOT NULL,
      \`condition_value\` varchar(100) NOT NULL,
      \`excluded_attribute\` varchar(100) NOT NULL,
      \`excluded_value\` varchar(100) NOT NULL,
      \`applies_when\` varchar(50) DEFAULT 'always',
      \`description\` varchar(255) DEFAULT NULL,
      PRIMARY KEY (\`rule_id\`)
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  const [ruleCount] = await conn.query('SELECT COUNT(*) AS total FROM `constraint_rules`');
  if (ruleCount[0].total === 0) {
    console.log('Populating default constraint_rules...');
    await conn.query(`
      INSERT INTO \`constraint_rules\` (rule_id, condition_field, condition_value, excluded_attribute, excluded_value, applies_when, description) VALUES
      (1,'group_type','family','nightlife','yes','night_slot','Exclude high-nightlife places for family groups at night'),
      (2,'solo_female','yes','solo_female_safe','no','always','Exclude unsafe places for solo female travellers'),
      (3,'group_composition','kids','kids_friendly','no','always','Exclude non-kid-friendly places if kids are in group'),
      (4,'group_composition','seniors','senior_citizen_friendly','no','always','Exclude non-senior-friendly places if seniors are in group'),
      (5,'accessibility_needed','yes','specially_abled_accessible','no','always','Exclude non-accessible places if wheelchair access needed'),
      (6,'budget_level','budget','budget_level','luxury','always','Exclude luxury places for budget travellers');
    `);
  }

  // Drop and recreate places and junction tables
  console.log('Dropping existing places and junction tables...');
  await conn.query(`
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS \`place_activities\`;
    DROP TABLE IF EXISTS \`place_best_for\`;
    DROP TABLE IF EXISTS \`place_age_group\`;
    DROP TABLE IF EXISTS \`place_trip_purpose\`;
    DROP TABLE IF EXISTS \`place_transport_modes\`;
    DROP TABLE IF EXISTS \`places\`;
    SET FOREIGN_KEY_CHECKS = 1;
  `);

  console.log('Creating places table schema...');
  await conn.query(`
    CREATE TABLE \`places\` (
      \`place_id\` int NOT NULL AUTO_INCREMENT,
      \`name\` varchar(255) NOT NULL,
      \`city\` varchar(100) DEFAULT NULL,
      \`state\` varchar(100) DEFAULT NULL,
      \`state_id\` int DEFAULT NULL,
      \`zone\` varchar(50) DEFAULT NULL,
      \`type\` varchar(100) DEFAULT NULL,
      \`significance\` varchar(100) DEFAULT NULL,
      \`google_rating\` float DEFAULT NULL,
      \`entrance_fee_inr\` int DEFAULT NULL,
      \`best_time\` varchar(100) DEFAULT NULL,
      \`time_to_visit_hrs\` float DEFAULT NULL,
      \`airport_nearby\` varchar(10) DEFAULT NULL,
      \`weekly_off\` varchar(50) DEFAULT NULL,
      \`dslr_allowed\` varchar(10) DEFAULT NULL,
      \`review_count_lakhs\` float DEFAULT NULL,
      \`vibe\` varchar(50) DEFAULT NULL,
      \`crowd_level\` varchar(20) DEFAULT NULL,
      \`noise_level\` varchar(20) DEFAULT NULL,
      \`cleanliness\` varchar(20) DEFAULT NULL,
      \`trip_purpose\` text,
      \`trip_vibe_tags\` text,
      \`best_for\` text,
      \`age_group\` text,
      \`solo_female_safe\` varchar(20) DEFAULT NULL,
      \`senior_citizen_friendly\` varchar(20) DEFAULT NULL,
      \`kids_friendly\` varchar(10) DEFAULT NULL,
      \`specially_abled_accessible\` varchar(20) DEFAULT NULL,
      \`budget_level\` varchar(20) DEFAULT NULL,
      \`avg_cost_per_day_inr\` varchar(50) DEFAULT NULL,
      \`budget_stay_per_night_inr\` varchar(50) DEFAULT NULL,
      \`mid_stay_per_night_inr\` varchar(50) DEFAULT NULL,
      \`luxury_stay_per_night_inr\` varchar(50) DEFAULT NULL,
      \`free_attractions_available\` varchar(10) DEFAULT NULL,
      \`street_food_available\` varchar(10) DEFAULT NULL,
      \`avg_meal_cost_inr\` varchar(50) DEFAULT NULL,
      \`activities\` text,
      \`adventure_sports\` varchar(10) DEFAULT NULL,
      \`water_activities\` varchar(10) DEFAULT NULL,
      \`trekking\` varchar(10) DEFAULT NULL,
      \`photography_spot\` varchar(10) DEFAULT NULL,
      \`nightlife\` varchar(10) DEFAULT NULL,
      \`shopping_nearby\` varchar(10) DEFAULT NULL,
      \`local_cuisine_must_try\` text,
      \`religious_significance\` varchar(10) DEFAULT NULL,
      \`deity_or_religion\` varchar(100) DEFAULT NULL,
      \`temple_mosque_church\` varchar(50) DEFAULT NULL,
      \`dress_code_required\` varchar(10) DEFAULT NULL,
      \`photography_allowed_inside\` varchar(20) DEFAULT NULL,
      \`aarti_or_special_ceremony\` varchar(10) DEFAULT NULL,
      \`pilgrimage_circuit\` varchar(100) DEFAULT NULL,
      \`nearest_railway_station\` varchar(150) DEFAULT NULL,
      \`railway_distance_km\` float DEFAULT NULL,
      \`nearest_airport\` varchar(150) DEFAULT NULL,
      \`airport_distance_km\` float DEFAULT NULL,
      \`road_accessible\` varchar(10) DEFAULT NULL,
      \`available_transport_modes\` text,
      \`best_season\` varchar(50) DEFAULT NULL,
      \`avoid_season\` varchar(50) DEFAULT NULL,
      \`ideal_trip_duration_days\` float DEFAULT NULL,
      \`accessibility\` varchar(20) DEFAULT NULL,
      \`offbeat\` varchar(10) DEFAULT NULL,
      \`medical_facilities_nearby\` varchar(10) DEFAULT NULL,
      \`language_spoken\` text,
      \`internet_connectivity\` varchar(20) DEFAULT NULL,
      \`tags\` text,
      \`avoid_if\` text,
      \`best_nearby_places\` text,
      \`latitude\` decimal(10,7) DEFAULT NULL,
      \`longitude\` decimal(10,7) DEFAULT NULL,
      PRIMARY KEY (\`place_id\`),
      KEY \`state_id\` (\`state_id\`),
      CONSTRAINT \`places_ibfk_1\` FOREIGN KEY (\`state_id\`) REFERENCES \`states\` (\`state_id\`) ON DELETE SET NULL
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  console.log('Creating junction tables schema...');
  await conn.query(`
    CREATE TABLE \`place_activities\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`place_id\` int DEFAULT NULL,
      \`value\` varchar(100) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`place_id\` (\`place_id\`),
      CONSTRAINT \`place_activities_ibfk_1\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    CREATE TABLE \`place_best_for\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`place_id\` int DEFAULT NULL,
      \`value\` varchar(100) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`place_id\` (\`place_id\`),
      CONSTRAINT \`place_best_for_ibfk_1\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    CREATE TABLE \`place_age_group\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`place_id\` int DEFAULT NULL,
      \`value\` varchar(100) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`place_id\` (\`place_id\`),
      CONSTRAINT \`place_age_group_ibfk_1\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    CREATE TABLE \`place_trip_purpose\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`place_id\` int DEFAULT NULL,
      \`value\` varchar(100) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`place_id\` (\`place_id\`),
      CONSTRAINT \`place_trip_purpose_ibfk_1\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

    CREATE TABLE \`place_transport_modes\` (
      \`id\` int NOT NULL AUTO_INCREMENT,
      \`place_id\` int DEFAULT NULL,
      \`value\` varchar(100) DEFAULT NULL,
      PRIMARY KEY (\`id\`),
      KEY \`place_id\` (\`place_id\`),
      CONSTRAINT \`place_transport_modes_ibfk_1\` FOREIGN KEY (\`place_id\`) REFERENCES \`places\` (\`place_id\`) ON DELETE CASCADE
    ) ENGINE=InnoDB ROW_FORMAT=DYNAMIC DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Load coordinates
  const coordsMap = loadCoordinatesFromSql();
  console.log(`Loaded ${coordsMap.size} coordinate mappings from SQL dump.`);

  // Read CSV
  console.log('Parsing CSV rows...');
  const records = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', row => records.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Read ${records.length} total rows from CSV.`);

  // Insert states
  const uniqueStates = [...new Set(records.map(r => r.state && r.state.trim()).filter(Boolean))];
  for (const st of uniqueStates) {
    await conn.query(
      'INSERT INTO `states` (`state_name`) VALUES (?) ON DUPLICATE KEY UPDATE `state_name`=`state_name`',
      [st]
    );
  }

  const [stateRows] = await conn.query('SELECT `state_id`, `state_name` FROM `states`');
  const stateIdMap = new Map(stateRows.map(s => [s.state_name, s.state_id]));
  console.log(`States populated: ${stateIdMap.size} states ready.`);

  // Insert places in batches
  const BATCH_SIZE = 50;
  const insertColumns = [
    'name', 'city', 'state', 'state_id', 'zone', 'type', 'significance',
    'google_rating', 'entrance_fee_inr', 'best_time', 'time_to_visit_hrs',
    'airport_nearby', 'weekly_off', 'dslr_allowed', 'review_count_lakhs',
    'vibe', 'crowd_level', 'noise_level', 'cleanliness', 'trip_purpose',
    'trip_vibe_tags', 'best_for', 'age_group', 'solo_female_safe',
    'senior_citizen_friendly', 'kids_friendly', 'specially_abled_accessible',
    'budget_level', 'avg_cost_per_day_inr', 'budget_stay_per_night_inr',
    'mid_stay_per_night_inr', 'luxury_stay_per_night_inr',
    'free_attractions_available', 'street_food_available', 'avg_meal_cost_inr',
    'activities', 'adventure_sports', 'water_activities', 'trekking',
    'photography_spot', 'nightlife', 'shopping_nearby', 'local_cuisine_must_try',
    'religious_significance', 'deity_or_religion', 'temple_mosque_church',
    'dress_code_required', 'photography_allowed_inside', 'aarti_or_special_ceremony',
    'pilgrimage_circuit', 'nearest_railway_station', 'railway_distance_km',
    'nearest_airport', 'airport_distance_km', 'road_accessible',
    'available_transport_modes', 'best_season', 'avoid_season',
    'ideal_trip_duration_days', 'accessibility', 'offbeat',
    'medical_facilities_nearby', 'language_spoken', 'internet_connectivity',
    'tags', 'avoid_if', 'best_nearby_places', 'latitude', 'longitude'
  ];

  const insertSql = `
    INSERT INTO \`places\` (${insertColumns.map(c => `\`${c}\``).join(', ')})
    VALUES ?
  `;

  const rowsToInsert = [];
  const junctionData = {
    activities: [],
    best_for: [],
    age_group: [],
    trip_purpose: [],
    transport_modes: []
  };

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const name = cleanString(r.name);
    const city = cleanString(r.city);
    const state = cleanString(r.state);
    const stateId = state ? stateIdMap.get(state) || null : null;

    // Check coordinates
    const nameKey = name ? name.toLowerCase() : '';
    const cityKey = city ? city.toLowerCase() : '';
    const coordLookup = coordsMap.get(`${nameKey}|${cityKey}`) || coordsMap.get(nameKey) || null;
    const lat = coordLookup ? coordLookup.lat : null;
    const lon = coordLookup ? coordLookup.lon : null;

    // Parse list columns to JSON strings for places table
    const tripPurposeList = parseList(r.trip_purpose);
    const tripVibeList = parseList(r.trip_vibe_tags);
    const bestForList = parseList(r.best_for);
    const ageGroupList = parseList(r.age_group);
    const activitiesList = parseList(r.activities);
    const cuisineList = parseList(r.local_cuisine_must_try);
    const transportList = parseList(r.available_transport_modes);
    const langList = parseList(r.language_spoken);
    const tagsList = parseList(r.tags);
    const nearbyList = parseList(r.best_nearby_places);

    const rowValues = [
      name,
      city,
      state,
      stateId,
      cleanString(r.zone),
      cleanString(r.type),
      cleanString(r.significance),
      cleanFloat(r.google_rating),
      cleanInt(r.entrance_fee_inr),
      cleanString(r.best_time),
      cleanFloat(r.time_to_visit_hrs),
      cleanString(r.airport_nearby),
      cleanString(r.weekly_off),
      cleanString(r.dslr_allowed),
      cleanFloat(r.review_count_lakhs),
      cleanString(r.vibe),
      cleanString(r.crowd_level),
      cleanString(r.noise_level),
      cleanString(r.cleanliness),
      JSON.stringify(tripPurposeList),
      JSON.stringify(tripVibeList),
      JSON.stringify(bestForList),
      JSON.stringify(ageGroupList),
      cleanString(r.solo_female_safe),
      cleanString(r.senior_citizen_friendly),
      cleanString(r.kids_friendly),
      cleanString(r.specially_abled_accessible),
      cleanString(r.budget_level),
      cleanString(r.avg_cost_per_day_inr),
      cleanString(r.budget_stay_per_night_inr),
      cleanString(r.mid_stay_per_night_inr),
      cleanString(r.luxury_stay_per_night_inr),
      cleanString(r.free_attractions_available),
      cleanString(r.street_food_available),
      cleanString(r.avg_meal_cost_inr),
      JSON.stringify(activitiesList),
      cleanString(r.adventure_sports),
      cleanString(r.water_activities),
      cleanString(r.trekking),
      cleanString(r.photography_spot),
      cleanString(r.nightlife),
      cleanString(r.shopping_nearby),
      JSON.stringify(cuisineList),
      cleanString(r.religious_significance),
      cleanString(r.deity_or_religion),
      cleanString(r.temple_mosque_church),
      cleanString(r.dress_code_required),
      cleanString(r.photography_allowed_inside),
      cleanString(r.aarti_or_special_ceremony),
      cleanString(r.pilgrimage_circuit),
      cleanString(r.nearest_railway_station),
      cleanFloat(r.railway_distance_km),
      cleanString(r.nearest_airport),
      cleanFloat(r.airport_distance_km),
      cleanString(r.road_accessible),
      JSON.stringify(transportList),
      cleanString(r.best_season),
      cleanString(r.avoid_season),
      cleanFloat(r.ideal_trip_duration_days),
      cleanString(r.accessibility),
      cleanString(r.offbeat),
      cleanString(r.medical_facilities_nearby),
      JSON.stringify(langList),
      cleanString(r.internet_connectivity),
      JSON.stringify(tagsList),
      cleanString(r.avoid_if),
      JSON.stringify(nearbyList),
      lat,
      lon
    ];

    rowsToInsert.push(rowValues);
  }

  // Insert places in chunks
  console.log(`Inserting ${rowsToInsert.length} places in batches of ${BATCH_SIZE}...`);
  for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
    const chunk = rowsToInsert.slice(i, i + BATCH_SIZE);
    await conn.query(insertSql, [chunk]);
  }
  console.log(`Successfully batch inserted ${rowsToInsert.length} places.`);

  // Build place_id mapping for junction tables
  const [insertedPlaces] = await conn.query('SELECT `place_id`, `name`, `city` FROM `places` ORDER BY `place_id` ASC');
  const placeMap = new Map();
  insertedPlaces.forEach(p => {
    const key = `${p.name.trim().toLowerCase()}|${(p.city || '').trim().toLowerCase()}`;
    placeMap.set(key, p.place_id);
    if (!placeMap.has(p.name.trim().toLowerCase())) {
      placeMap.set(p.name.trim().toLowerCase(), p.place_id);
    }
  });

  // Prepare junction records
  for (const r of records) {
    const name = (r.name || '').trim();
    const city = (r.city || '').trim();
    const placeId = placeMap.get(`${name.toLowerCase()}|${city.toLowerCase()}`) || placeMap.get(name.toLowerCase());
    if (!placeId) continue;

    for (const val of parseList(r.activities)) {
      junctionData.activities.push([placeId, val]);
    }
    for (const val of parseList(r.best_for)) {
      junctionData.best_for.push([placeId, val]);
    }
    for (const val of parseList(r.age_group)) {
      junctionData.age_group.push([placeId, val]);
    }
    for (const val of parseList(r.trip_purpose)) {
      junctionData.trip_purpose.push([placeId, val]);
    }
    for (const val of parseList(r.available_transport_modes)) {
      junctionData.transport_modes.push([placeId, val]);
    }
  }

  // Batch insert junction records helper
  const insertJunction = async (table, data) => {
    if (data.length === 0) return;
    const CHUNK = 500;
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK);
      await conn.query(`INSERT INTO \`${table}\` (\`place_id\`, \`value\`) VALUES ?`, [chunk]);
    }
    console.log(`Populated ${table} with ${data.length} records.`);
  };

  console.log('Populating junction tables...');
  await insertJunction('place_activities', junctionData.activities);
  await insertJunction('place_best_for', junctionData.best_for);
  await insertJunction('place_age_group', junctionData.age_group);
  await insertJunction('place_trip_purpose', junctionData.trip_purpose);
  await insertJunction('place_transport_modes', junctionData.transport_modes);

  // Verification queries
  const [placesCount] = await conn.query('SELECT COUNT(*) AS count FROM `places`');
  const [actCount] = await conn.query('SELECT COUNT(*) AS count FROM `place_activities`');
  const [coordsCount] = await conn.query('SELECT COUNT(*) AS count FROM `places` WHERE `latitude` IS NOT NULL');

  console.log('\n--- Seeding Completed Successfully ---');
  console.log(`Total places in DB: ${placesCount[0].count}`);
  console.log(`Places with coordinates: ${coordsCount[0].count}`);
  console.log(`Total place activities: ${actCount[0].count}`);

  await conn.end();
}

seed().catch(err => {
  console.error('[Error] Seeding failed:', err);
  process.exit(1);
});
