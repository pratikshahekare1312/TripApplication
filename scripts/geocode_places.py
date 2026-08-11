import mysql.connector
import requests
import time
from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

conn = mysql.connector.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)
cursor = conn.cursor(dictionary=True)

# Only fetch places that don't have coordinates yet
cursor.execute("SELECT place_id, name, city, state_id FROM places WHERE latitude IS NULL")
places = cursor.fetchall()
print(f"Total places to geocode: {len(places)}")

# Build state_id -> state_name map
cursor.execute("SELECT state_id, state_name FROM states")
state_map = {row['state_id']: row['state_name'] for row in cursor.fetchall()}

update_cursor = conn.cursor()

HEADERS = {"User-Agent": "TravelPlannerCollegeProject/1.0"}

success = 0
failed = 0

for idx, place in enumerate(places):
    state_name = state_map.get(place['state_id'], "")
    query = f"{place['name']}, {place['city']}, {state_name}, India"

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers=HEADERS,
            timeout=10
        )
        results = response.json()

        if results:
            lat = float(results[0]['lat'])
            lon = float(results[0]['lon'])
            update_cursor.execute(
                "UPDATE places SET latitude=%s, longitude=%s WHERE place_id=%s",
                (lat, lon, place['place_id'])
            )
            success += 1
            print(f"  [{idx+1}/{len(places)}] Found: {place['name']} -> ({lat}, {lon})")
        else:
            # Fallback — try city+state level if exact place not found
            fallback_query = f"{place['city']}, {state_name}, India"
            fallback_resp = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": fallback_query, "format": "json", "limit": 1},
                headers=HEADERS,
                timeout=10
            )
            fallback_results = fallback_resp.json()
            if fallback_results:
                lat = float(fallback_results[0]['lat'])
                lon = float(fallback_results[0]['lon'])
                update_cursor.execute(
                    "UPDATE places SET latitude=%s, longitude=%s WHERE place_id=%s",
                    (lat, lon, place['place_id'])
                )
                success += 1
                print(f"  [{idx+1}/{len(places)}] City-level fallback: {place['name']} -> ({lat}, {lon})")
            else:
                failed += 1
                print(f"  [{idx+1}/{len(places)}] Not found: {place['name']}")

    except Exception as e:
        failed += 1
        print(f"  [{idx+1}/{len(places)}] Error: {place['name']} -> {e}")

    if (idx + 1) % 20 == 0:
        conn.commit()

    time.sleep(1.1)  # Nominatim rate limit — max 1 request per second

conn.commit()
print(f"\nDone! {success} geocoded, {failed} failed.")

cursor.close()
update_cursor.close()
conn.close()