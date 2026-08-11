import pandas as pd
import mysql.connector
import ast
import json
from config import CSV_OUTPUT, MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

conn = mysql.connector.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)
cursor = conn.cursor()

print("Loading CSV...")
df = pd.read_csv(CSV_OUTPUT)
print(f"Total rows: {len(df)}")

def parse_list(value):
    if pd.isna(value):
        return []
    if isinstance(value, list):
        return value
    try:
        parsed = ast.literal_eval(value)
        return parsed if isinstance(parsed, list) else [str(parsed)]
    except (ValueError, SyntaxError):
        return [v.strip() for v in str(value).split(",") if v.strip()]

# Ye columns places table mein TEXT hain but list data rakhte hain
# Inhe proper JSON string bana ke save karenge taaki Node mein JSON.parse() ho sake
LIST_TEXT_COLUMNS = {
    "trip_vibe_tags",
    "local_cuisine_must_try",
    "tags",
    "best_nearby_places",
    "language_spoken"
}

def clean(col, value):
    if col in LIST_TEXT_COLUMNS:
        return json.dumps(parse_list(value))
    return None if pd.isna(value) else value

# ---------------------------------------
# STEP 1: Insert unique states
# ---------------------------------------
print("\nInserting states...")
unique_states = df["state"].dropna().unique()
state_id_map = {}

for state_name in unique_states:
    cursor.execute(
        "INSERT INTO states (state_name) VALUES (%s) ON DUPLICATE KEY UPDATE state_id=LAST_INSERT_ID(state_id)",
        (state_name,)
    )
    state_id_map[state_name] = cursor.lastrowid

conn.commit()
print(f"✓ {len(state_id_map)} states ready")

# ---------------------------------------
# STEP 2: Skip places already migrated (safe to re-run later)
# ---------------------------------------
cursor.execute("SELECT name, city FROM places")
already_migrated = set(cursor.fetchall())
print(f"Already in database: {len(already_migrated)} places\n")

# ---------------------------------------
# STEP 3: Insert places + junction table data
# ---------------------------------------
places_columns = [
    "name", "city", "state_id", "zone", "type", "significance", "google_rating",
    "entrance_fee_inr", "best_time", "time_to_visit_hrs", "airport_nearby",
    "weekly_off", "dslr_allowed", "review_count_lakhs",
    "vibe", "crowd_level", "noise_level", "cleanliness", "trip_vibe_tags",
    "solo_female_safe", "senior_citizen_friendly", "kids_friendly", "specially_abled_accessible",
    "budget_level", "avg_cost_per_day_inr", "budget_stay_per_night_inr",
    "mid_stay_per_night_inr", "luxury_stay_per_night_inr", "free_attractions_available",
    "street_food_available", "avg_meal_cost_inr",
    "adventure_sports", "water_activities", "trekking", "photography_spot",
    "nightlife", "shopping_nearby", "local_cuisine_must_try",
    "religious_significance", "deity_or_religion", "temple_mosque_church",
    "dress_code_required", "photography_allowed_inside", "aarti_or_special_ceremony",
    "pilgrimage_circuit",
    "nearest_railway_station", "railway_distance_km", "nearest_airport",
    "airport_distance_km", "road_accessible",
    "best_season", "avoid_season", "ideal_trip_duration_days", "accessibility",
    "offbeat", "medical_facilities_nearby", "language_spoken", "internet_connectivity",
    "tags", "avoid_if", "best_nearby_places"
]

insert_places_sql = f"""
INSERT INTO places ({", ".join(places_columns)})
VALUES ({", ".join(["%s"] * len(places_columns))})
"""

junction_map = {
    "best_for": "place_best_for",
    "age_group": "place_age_group",
    "activities": "place_activities",
    "trip_purpose": "place_trip_purpose",
    "available_transport_modes": "place_transport_modes"
}

inserted = 0
skipped = 0

for index, row in df.iterrows():
    name, city = row.get("name"), row.get("city")

    if (name, city) in already_migrated:
        skipped += 1
        continue

    state_id = state_id_map.get(row.get("state"))
    if state_id is None:
        skipped += 1
        continue

    values = [state_id if col == "state_id" else clean(col, row.get(col)) for col in places_columns]

    try:
        cursor.execute(insert_places_sql, values)
        place_id = cursor.lastrowid
    except Exception as e:
        print(f"  Error inserting {name}: {e}")
        skipped += 1
        continue

    for source_col, table_name in junction_map.items():
        for item in parse_list(row.get(source_col)):
            item = str(item).strip()
            if item:
                cursor.execute(f"INSERT INTO {table_name} (place_id, value) VALUES (%s, %s)", (place_id, item))

    inserted += 1
    if inserted % 25 == 0:
        conn.commit()
        print(f"  {inserted} new places inserted so far...")

conn.commit()
print(f"\n✓ Done! {inserted} new places inserted, {skipped} skipped (already done/errors).")

cursor.close()
conn.close()