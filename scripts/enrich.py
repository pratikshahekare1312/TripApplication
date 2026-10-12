import pandas as pd
import json
import time
import os
from groq import Groq
from config import GROQ_API_KEY, CSV_INPUT, CSV_OUTPUT

client = Groq(api_key=GROQ_API_KEY)

STATE = "Puducherry"


def get_attributes(
    place_name,
    place_type,
    significance,
    state,
    city,
    rating,
    best_time,
    entrance_fee
):
    prompt = f"""
You are an expert travel analyst for India with deep knowledge of all Indian tourist destinations.

Place details:
- Name: {place_name}
- City: {city}
- State: {state}
- Type: {place_type}
- Significance: {significance}
- Google Rating: {rating}
- Best Time to Visit: {best_time}
- Entrance Fee: {entrance_fee} INR

Based on your knowledge, return ONLY a valid JSON object with exactly these fields. No extra text, no markdown.

{{
  "vibe": "one of: chill/adventure/party/spiritual/romantic/family/cultural/offbeat",
  "crowd_level": "one of: low/medium/high",
  "noise_level": "one of: quiet/moderate/loud",
  "cleanliness": "one of: low/medium/high",

  "trip_purpose": ["list from: leisure/pilgrimage/adventure/romantic/family_vacation/solo_backpacking/party/cultural_exploration/wildlife/offbeat"],
  "trip_vibe_tags": ["4 tags from: peaceful/spiritual/exciting/romantic/thrilling/serene/rustic/historic/scenic/vibrant"],

  "best_for": ["list from: solo/couple/family/group/friends/senior_citizens/kids"],
  "age_group": ["list from: kids/teens/adults/seniors"],
  "solo_female_safe": "one of: yes/no/moderate",
  "senior_citizen_friendly": "one of: yes/no/moderate",
  "kids_friendly": "one of: yes/no",
  "specially_abled_accessible": "one of: yes/no/partial",

  "budget_level": "one of: budget/mid/luxury",
  "avg_cost_per_day_inr": "one of: 500-1000/1000-3000/3000-8000/8000+",
  "budget_stay_per_night_inr": "range like 300-800",
  "mid_stay_per_night_inr": "range like 1500-4000",
  "luxury_stay_per_night_inr": "range like 6000-20000",
  "free_attractions_available": "one of: yes/no",
  "street_food_available": "one of: yes/no",
  "avg_meal_cost_inr": "one of: 50-150/150-400/400-1000/1000+",

  "activities": ["6 actual activities to do here"],
  "adventure_sports": "one of: yes/no",
  "water_activities": "one of: yes/no",
  "trekking": "one of: yes/no",
  "photography_spot": "one of: yes/no",
  "nightlife": "one of: yes/no",
  "shopping_nearby": "one of: yes/no",
  "local_cuisine_must_try": ["3 local dishes or foods"],

  "religious_significance": "one of: yes/no",
  "deity_or_religion": "name of deity/religion or none",
  "temple_mosque_church": "one of: temple/mosque/church/gurudwara/monastery/none",
  "dress_code_required": "one of: yes/no",
  "photography_allowed_inside": "one of: yes/no/partial",
  "aarti_or_special_ceremony": "one of: yes/no",
  "pilgrimage_circuit": "name of circuit like Char Dham or none",

  "nearest_railway_station": "station name",
  "railway_distance_km": 0,
  "nearest_airport": "airport name",
  "airport_distance_km": 0,
  "road_accessible": "one of: yes/no",
  "available_transport_modes": ["list from: flight/train/bus/road"],

  "best_season": "one of: winter/summer/monsoon/all-year",
  "avoid_season": "one of: winter/summer/monsoon/none",
  "ideal_trip_duration_days": 1,
  "accessibility": "one of: easy/moderate/difficult",
  "offbeat": "one of: yes/no",
  "medical_facilities_nearby": "one of: yes/no",
  "language_spoken": ["list like: Hindi/English/Gujarati"],
  "internet_connectivity": "one of: good/moderate/poor",

  "tags": ["5 tags like: sunset point/instagrammable/hidden gem/pilgrimage/honeymoon/backpacker friendly/family picnic/wildlife/heritage"],
  "avoid_if": "one line about who should NOT visit",
  "best_nearby_places": ["3 nearby places worth visiting"]
}}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3
        )

        text = response.choices[0].message.content.strip()

        text = text.replace("```json", "")
        text = text.replace("```", "")
        text = text.strip()

        return json.loads(text)

    except Exception as e:
        print(f"Error processing {place_name}: {e}")
        return {}


# ----------------------------------------
# MAIN PROCESS
# ----------------------------------------

print("Loading CSV file...")

df = pd.read_csv(CSV_INPUT)

df["State"] = df["State"].replace(
    "Maharastra",
    "Maharashtra"
)

df_state = df[df["State"] == STATE].copy()

print(f"Processing {STATE} - {len(df_state)} places")
print()

already_done = set()

if os.path.exists(CSV_OUTPUT):

    existing = pd.read_csv(CSV_OUTPUT)

    completed = existing[
        existing["vibe"].notna()
    ]

    already_done = set(
        completed["name"].tolist()
    )

    print(
        f"Already completed: {len(already_done)} places. Skipping them."
    )
    print()

all_rows = []

for index, row in df_state.iterrows():

    place_name = row["Name"]

    if place_name in already_done:

        print(
            f"Skipping already completed place: {place_name}"
        )

        continue

    print(
        f"Processing: {place_name}..."
    )

    attributes = get_attributes(
        place_name=place_name,
        place_type=row["Type"],
        significance=row["Significance"],
        state=row["State"],
        city=row["City"],
        rating=row["Google review rating"],
        best_time=row["Best Time to visit"],
        entrance_fee=row["Entrance Fee in INR"]
    )

    final_row = {
        "name": place_name,
        "city": row["City"],
        "state": row["State"],
        "zone": row["Zone"],
        "type": row["Type"],
        "significance": row["Significance"],
        "google_rating": row["Google review rating"],
        "entrance_fee_inr": row["Entrance Fee in INR"],
        "best_time": row["Best Time to visit"],
        "time_to_visit_hrs": row["time needed to visit in hrs"],
        "airport_nearby": row["Airport with 50km Radius"],
        "weekly_off": row["Weekly Off"],
        "dslr_allowed": row["DSLR Allowed"],
        "review_count_lakhs": row["Number of google review in lakhs"],
        **attributes
    }

    all_rows.append(final_row)

    time.sleep(2)


if all_rows:

    new_df = pd.DataFrame(all_rows)

    if os.path.exists(CSV_OUTPUT):

        existing_df = pd.read_csv(CSV_OUTPUT)

        final_df = pd.concat(
            [existing_df, new_df],
            ignore_index=True
        )

    else:

        final_df = new_df

    final_df.to_csv(
        CSV_OUTPUT,
        index=False
    )

    print()
    print(
        f"Completed. {len(all_rows)} new places were added."
    )

    print(
        f"Total places in the file: {len(final_df)}"
    )

else:

    print()
    print("All places were already processed.")