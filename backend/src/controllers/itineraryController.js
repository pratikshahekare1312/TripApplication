const pool = require('../config/db');

const {
  applyConstraints
} = require('../services/constraintFilterService');

const {
  matchPlaces
} = require('../services/matchingService');

const {
  knapsack
} = require('../services/knapsackService');

const {
  buildRoute,
  calculateCost
} = require('../services/routeService');

const {
  getCityCoordinates,
  calculateTravelCost
} = require('../services/travelCostService');

// ---------------------------------------------------------
// Scoring thresholds
// ---------------------------------------------------------

const MATCH_THRESHOLD      = 50.0;
const OPTIONAL_LOWER_BOUND = 25.0;

function parseJsonField(value) {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

async function generateItinerary(req, res) {
  try {
    const {
      destination_state,
      days = 3,
      group_type = 'friends',
      group_composition = [],
      budget_level = 'mid',
      vibe = 'chill',
      crowd_preference = 'medium',
      interests,
      solo_female,
      wheelchair_needed,
      medical_important,
      wants_adventure_sports,
      wants_water_activities,
      wants_trekking,
      wants_nightlife,
      wants_shopping,
      wants_photography,
      religious_interest,
      prefers_offbeat = 'No preference',
      carrying_dslr,
      internet_important,
      origin_city,

      // Avoid preferences
      avoid_adventure_sports,
      avoid_water_activities,
      avoid_trekking,
      avoid_nightlife,
      avoid_shopping,
      avoid_photography,
      avoid_religious
    } = req.body || {};

    if (!destination_state) {
      return res.status(400).json({
        status: 'error',
        message: 'destination_state is required'
      });
    }

    const numDays = Math.max(1, Number(days) || 3);

    // -----------------------------------------------------
    // Get places for destination state
    // -----------------------------------------------------

    const query = `
      SELECT p.*
      FROM places p
      JOIN states s
        ON p.state_id = s.state_id
      WHERE s.state_name = ?
    `;

    const [places] = await pool.query(query, [destination_state]);

    if (places.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `No places found for ${destination_state}`
      });
    }

    // -----------------------------------------------------
    // Get activities
    // -----------------------------------------------------

    const placeIds = places.map(p => p.place_id);

    const [activityRows] = await pool.query(
      `
        SELECT place_id, value
        FROM place_activities
        WHERE place_id IN (?)
      `,
      [placeIds]
    );

    const activitiesMap = {};
    for (const row of activityRows) {
      if (!activitiesMap[row.place_id]) {
        activitiesMap[row.place_id] = [];
      }
      activitiesMap[row.place_id].push(row.value);
    }

    // -----------------------------------------------------
    // Parse JSON fields
    // -----------------------------------------------------

    places.forEach(place => {
      place.activities = activitiesMap[place.place_id] || [];
      place.local_cuisine_must_try = parseJsonField(place.local_cuisine_must_try);
      place.trip_vibe_tags = parseJsonField(place.trip_vibe_tags);
      place.tags = parseJsonField(place.tags);
      place.best_nearby_places = parseJsonField(place.best_nearby_places);
      place.language_spoken = parseJsonField(place.language_spoken);
    });

    // -----------------------------------------------------
    // Hard constraints & Safety rules
    // -----------------------------------------------------

    const userConstraints = {
      hasSoloFemale: Boolean(solo_female),
      hasKids: group_composition?.includes('Kids'),
      hasSeniors: group_composition?.includes('Seniors'),
      needsWheelchairAccess: Boolean(wheelchair_needed),
      budgetLevel: budget_level,
      isFamily: group_type === 'family',
      carryingDslr: Boolean(carrying_dslr),
      medicalImportant: Boolean(medical_important),
      internetImportant: Boolean(internet_important),
      avoidAdventureSports: Boolean(avoid_adventure_sports),
      avoidWaterActivities: Boolean(avoid_water_activities),
      avoidTrekking: Boolean(avoid_trekking),
      avoidNightlife: Boolean(avoid_nightlife),
      avoidShopping: Boolean(avoid_shopping),
      avoidPhotography: Boolean(avoid_photography),
      avoidReligious: Boolean(avoid_religious)
    };

    const filteredPlaces = await applyConstraints(places, userConstraints);

    if (filteredPlaces.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: `No places in ${destination_state} match your safety or mandatory constraints. Try relaxing some restrictions.`
      });
    }

    // -----------------------------------------------------
    // User preferences for ranking
    // -----------------------------------------------------

    const userPrefs = {
      vibe: Array.isArray(vibe) ? vibe[0] : vibe,
      budget: budget_level,
      crowd: crowd_preference,
      prefers_offbeat,
      wantsAdventureSports: Boolean(wants_adventure_sports),
      wantsWaterActivities: Boolean(wants_water_activities),
      wantsTrekking: Boolean(wants_trekking),
      wantsNightlife: Boolean(wants_nightlife),
      wantsShopping: Boolean(wants_shopping),
      wantsPhotography: Boolean(wants_photography),
      religious_interest: Boolean(religious_interest || vibe === 'spiritual')
    };

    // -----------------------------------------------------
    // Match and rank places
    // -----------------------------------------------------

    const matchedPlaces = await matchPlaces(userPrefs, filteredPlaces);

    // Split matched places into main and optional lower match places
    const mainCandidates = matchedPlaces.filter(
      p => p.matchScore >= MATCH_THRESHOLD
    );

    const optionalLowMatchPlaces = matchedPlaces
      .filter(
        p =>
          p.matchScore >= OPTIONAL_LOWER_BOUND &&
          p.matchScore < MATCH_THRESHOLD
      )
      .map(p => ({
        name: p.name,
        city: p.city,
        type: p.type,
        vibe: p.vibe,
        entrance_fee_inr: p.entrance_fee_inr,
        time_to_visit_hrs: p.time_to_visit_hrs,
        activities: p.activities || [],
        match_score: p.matchScore,
        match_breakdown: p.match_breakdown
      }));

    // Knapsack candidate pool: use main candidates if sufficient to cover days,
    // otherwise fallback to all matched places so no days are left empty unnecessarily.
    const knapsackInput =
      mainCandidates.length >= numDays
        ? mainCandidates
        : matchedPlaces;

    const selectedPlaces = knapsack(
      knapsackInput,
      numDays,
      budget_level
    );

    if (selectedPlaces.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No suitable places found matching your preferences'
      });
    }

    // -----------------------------------------------------
    // Get origin city coordinates
    // -----------------------------------------------------

    let originCoordinates = null;

    if (origin_city) {
      originCoordinates = await getCityCoordinates(origin_city);
    }

    // -----------------------------------------------------
    // Build optimized route
    // -----------------------------------------------------

    const {
      itinerary,
      totalLocalDistanceKm
    } = buildRoute(
      selectedPlaces,
      numDays,
      originCoordinates
    );

    // -----------------------------------------------------
    // Check if enough places were found
    // -----------------------------------------------------

    const insufficientData = selectedPlaces.length < numDays * 3;

    const dataNote =
      insufficientData
        ? `Selected ${selectedPlaces.length} matching places for your preferences. Some days may have fewer places than usual — try relaxing a filter for more options.`
        : null;

    // -----------------------------------------------------
    // Calculate destination travel cost
    // -----------------------------------------------------

    let travelInfo = null;

    const validCoords = selectedPlaces
      .map(p => ({
        ...p,
        latitude: Number(p.latitude),
        longitude: Number(p.longitude)
      }))
      .filter(
        p =>
          Number.isFinite(p.latitude) &&
          Number.isFinite(p.longitude)
      );

    if (
      origin_city &&
      originCoordinates &&
      validCoords.length > 0
    ) {
      const avgLat =
        validCoords.reduce((sum, p) => sum + Number(p.latitude), 0) /
        validCoords.length;

      const avgLon =
        validCoords.reduce((sum, p) => sum + Number(p.longitude), 0) /
        validCoords.length;

      travelInfo = await calculateTravelCost(
        origin_city,
        {
          latitude: avgLat,
          longitude: avgLon
        },
        budget_level,
        originCoordinates
      );
    }

    // -----------------------------------------------------
    // Calculate total cost
    // -----------------------------------------------------

    const travelCost =
      travelInfo && Number.isFinite(Number(travelInfo.cost_inr))
        ? Number(travelInfo.cost_inr)
        : 0;

    const cost = calculateCost(
      selectedPlaces,
      numDays,
      budget_level,
      totalLocalDistanceKm,
      travelCost
    );

    // -----------------------------------------------------
    // Final response
    // -----------------------------------------------------

    return res.json({
      status: 'success',
      destination: destination_state,
      total_days: numDays,
      group_type,
      budget_level,
      estimated_cost: cost,
      travel_details: travelInfo,
      itinerary,
      total_places_selected: selectedPlaces.length,
      note: dataNote,
      optional_low_match_places: optionalLowMatchPlaces
    });

  } catch (error) {
    console.error('Error generating itinerary:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}

module.exports = {
  generateItinerary
};