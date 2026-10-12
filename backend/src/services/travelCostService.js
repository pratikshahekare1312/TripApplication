const { haversineDistance } = require('./distanceUtils');
const { MAJOR_CITIES } = require('../data/majorCities');


// ---------------------------------------------------------
// Get coordinates of a city
// ---------------------------------------------------------

async function getCityCoordinates(cityName) {

  if (
    !cityName ||
    typeof cityName !== 'string'
  ) {
    return null;
  }


  const normalizedName =
    cityName.trim();


  if (!normalizedName) {
    return null;
  }


  // -------------------------------------------------------
  // Check fixed major cities first
  // -------------------------------------------------------

  const fixedMatch =
    Object.keys(MAJOR_CITIES).find(
      key =>
        key.toLowerCase() ===
        normalizedName.toLowerCase()
    );


  if (fixedMatch) {

    return {
      latitude:
        Number(
          MAJOR_CITIES[fixedMatch].latitude
        ),

      longitude:
        Number(
          MAJOR_CITIES[fixedMatch].longitude
        )
    };
  }


  // -------------------------------------------------------
  // Fallback to OpenStreetMap
  // -------------------------------------------------------

  try {

    const response =
      await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          normalizedName + ", India"
        )}&format=json&limit=1`,
        {
          headers: {
            "User-Agent":
              "TravelPlannerCollegeProject/1.0"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Geocoding request failed with status ${response.status}`
      );
    }


    const results =
      await response.json();


    if (
      results.length > 0
    ) {

      const latitude =
        Number(results[0].lat);

      const longitude =
        Number(results[0].lon);


      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
      ) {

        return {
          latitude,
          longitude
        };
      }
    }

  } catch (error) {

    console.error(
      `Geocoding failed for ${cityName}:`,
      error.message
    );
  }


  return null;
}


// ---------------------------------------------------------
// Calculate travel cost
// ---------------------------------------------------------

async function calculateTravelCost(
  originCity,
  destinationCoords,
  budgetLevel,
  originCoordinates = null
) {

  if (
    !originCity ||
    !destinationCoords
  ) {
    return null;
  }


  const destinationLatitude =
    Number(destinationCoords.latitude);

  const destinationLongitude =
    Number(destinationCoords.longitude);


  if (
    !Number.isFinite(destinationLatitude) ||
    !Number.isFinite(destinationLongitude)
  ) {

    console.error(
      "Invalid destination coordinates:",
      destinationCoords
    );

    return null;
  }


  // -------------------------------------------------------
  // Origin coordinates
  // -------------------------------------------------------

  const origin =
    originCoordinates ||
    await getCityCoordinates(
      originCity
    );


  if (!origin) {

    console.error(
      "Could not find origin coordinates:",
      originCity
    );

    return null;
  }


  const originLatitude =
    Number(origin.latitude);

  const originLongitude =
    Number(origin.longitude);


  if (
    !Number.isFinite(originLatitude) ||
    !Number.isFinite(originLongitude)
  ) {

    console.error(
      "Invalid origin coordinates:",
      origin
    );

    return null;
  }


  // -------------------------------------------------------
  // Calculate distance
  // -------------------------------------------------------

  const oneWayDistance =
    haversineDistance(
      originLatitude,
      originLongitude,
      destinationLatitude,
      destinationLongitude
    );


  if (
    oneWayDistance == null ||
    !Number.isFinite(oneWayDistance)
  ) {

    console.error(
      "Invalid travel distance:",
      {
        origin,
        destinationCoords
      }
    );

    return null;
  }


  const roundTripDistance =
    parseFloat(
      (oneWayDistance * 2)
        .toFixed(1)
    );


  // -------------------------------------------------------
  // Select transport mode
  // -------------------------------------------------------

  let mode;
  let ratePerKm;
  let baseFare;


  if (roundTripDistance < 150) {

    mode = 'Road / Cab';

    ratePerKm = 12;

    baseFare = 0;

  } else if (
    budgetLevel === 'budget'
  ) {

    mode = 'Train / Bus';

    ratePerKm = 1.5;

    baseFare = 150;

  } else if (
    budgetLevel === 'luxury'
  ) {

    mode = 'Flight';

    ratePerKm = 5;

    baseFare = 1500;

  } else {

    mode = 'Train';

    ratePerKm = 2;

    baseFare = 300;
  }


  // -------------------------------------------------------
  // Calculate cost
  // -------------------------------------------------------

  const cost =
    Math.round(
      roundTripDistance *
      ratePerKm +
      baseFare
    );


  if (
    !Number.isFinite(cost)
  ) {

    console.error(
      "Travel cost became invalid:",
      {
        roundTripDistance,
        ratePerKm,
        baseFare
      }
    );

    return null;
  }


  // -------------------------------------------------------
  // Final travel info
  // -------------------------------------------------------

  return {

    origin_city:
      originCity,

    recommended_mode:
      mode,

    one_way_distance_km:
      oneWayDistance,

    round_trip_distance_km:
      roundTripDistance,

    cost_inr:
      cost
  };
}


module.exports = {
  getCityCoordinates,
  calculateTravelCost
};