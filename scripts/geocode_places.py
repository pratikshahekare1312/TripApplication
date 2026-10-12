import mysql.connector
import requests
import time

from config import (
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE
)


conn = mysql.connector.connect(
    host=MYSQL_HOST,
    user=MYSQL_USER,
    password=MYSQL_PASSWORD,
    database=MYSQL_DATABASE
)

cursor = conn.cursor(dictionary=True)

# Fetch only places that do not have coordinates yet.
cursor.execute(
    "SELECT place_id, name, city, state_id FROM places WHERE latitude IS NULL"
)

places = cursor.fetchall()

print(
    f"Total places to geocode: {len(places)}"
)

# Build a mapping from state_id to state_name.
cursor.execute(
    "SELECT state_id, state_name FROM states"
)

state_map = {
    row["state_id"]: row["state_name"]
    for row in cursor.fetchall()
}

update_cursor = conn.cursor()

HEADERS = {
    "User-Agent": "TravelPlannerCollegeProject/1.0"
}

success = 0
failed = 0


for idx, place in enumerate(places):

    state_name = state_map.get(
        place["state_id"],
        ""
    )

    query = (
        f"{place['name']}, "
        f"{place['city']}, "
        f"{state_name}, India"
    )

    try:

        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": query,
                "format": "json",
                "limit": 1
            },
            headers=HEADERS,
            timeout=10
        )

        results = response.json()

        if results:

            lat = float(results[0]["lat"])
            lon = float(results[0]["lon"])

            update_cursor.execute(
                """
                UPDATE places
                SET latitude=%s, longitude=%s
                WHERE place_id=%s
                """,
                (
                    lat,
                    lon,
                    place["place_id"]
                )
            )

            success += 1

            print(
                f"[{idx + 1}/{len(places)}] "
                f"Found: {place['name']} -> ({lat}, {lon})"
            )

        else:

            # If the exact place cannot be found,
            # try using the city and state as a fallback.
            fallback_query = (
                f"{place['city']}, "
                f"{state_name}, India"
            )

            fallback_resp = requests.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": fallback_query,
                    "format": "json",
                    "limit": 1
                },
                headers=HEADERS,
                timeout=10
            )

            fallback_results = fallback_resp.json()

            if fallback_results:

                lat = float(
                    fallback_results[0]["lat"]
                )

                lon = float(
                    fallback_results[0]["lon"]
                )

                update_cursor.execute(
                    """
                    UPDATE places
                    SET latitude=%s, longitude=%s
                    WHERE place_id=%s
                    """,
                    (
                        lat,
                        lon,
                        place["place_id"]
                    )
                )

                success += 1

                print(
                    f"[{idx + 1}/{len(places)}] "
                    f"City-level fallback: "
                    f"{place['name']} -> ({lat}, {lon})"
                )

            else:

                failed += 1

                print(
                    f"[{idx + 1}/{len(places)}] "
                    f"Location not found: {place['name']}"
                )

    except Exception as e:

        failed += 1

        print(
            f"[{idx + 1}/{len(places)}] "
            f"Error processing {place['name']}: {e}"
        )

    # Commit every 20 records.
    if (idx + 1) % 20 == 0:
        conn.commit()

    # Respect Nominatim's rate limit.
    time.sleep(1.1)


conn.commit()

print()
print(
    f"Completed. {success} places geocoded, "
    f"{failed} places failed."
)

cursor.close()
update_cursor.close()
conn.close()