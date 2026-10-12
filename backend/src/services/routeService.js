const { haversineDistance } = require('./distanceUtils');

const LOCAL_TRANSPORT_RATE_PER_KM = 15;


// ---------------------------------------------------------
// Distribute places across days
// ---------------------------------------------------------

function distributePlaces(totalPlaces, totalDays, maxPerDay = 3) {
  const perDay = Array(totalDays).fill(0);

  let remaining = totalPlaces;

  for (let d = 0; d < totalDays && remaining > 0; d++) {
    const daysLeft = totalDays - d;

    const count = Math.min(
      maxPerDay,
      Math.ceil(remaining / daysLeft)
    );

    perDay[d] = count;
    remaining -= count;
  }

  return perDay;
}


// ---------------------------------------------------------
// Find nearest place from a given location
// ---------------------------------------------------------

function findNearestPlace(currentLocation, places) {
  let nearestPlace = null;
  let nearestDistance = Infinity;

  for (const place of places) {
    if (
      place.latitude == null ||
      place.longitude == null
    ) {
      continue;
    }

    const distance = haversineDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      place.latitude,
      place.longitude
    );

    if (distance != null && distance < nearestDistance) {
      nearestDistance = distance;
      nearestPlace = place;
    }
  }

  if (!nearestPlace) {
    return null;
  }

  return {
    place: nearestPlace,
    distance: nearestDistance
  };
}


// ---------------------------------------------------------
// Nearest Neighbor Route Optimization
//
// Starting point:
//      Origin city
//
// Then:
//      nearest place
//          ↓
//      nearest unvisited place
//          ↓
//      nearest unvisited place
//          ↓
//      ...
//
// This is a greedy / nearest-neighbor approach.
// ---------------------------------------------------------

function optimizeRoute(selectedPlaces, originCoordinates = null) {
  if (!selectedPlaces || selectedPlaces.length <= 1) {
    return selectedPlaces || [];
  }

  const remaining = [...selectedPlaces];
  const ordered = [];

  // -------------------------------------------------------
  // CASE 1:
  // Origin coordinates available
  // -------------------------------------------------------

  if (
    originCoordinates &&
    originCoordinates.latitude != null &&
    originCoordinates.longitude != null
  ) {
    let currentLocation = {
      latitude: originCoordinates.latitude,
      longitude: originCoordinates.longitude
    };

    while (remaining.length > 0) {
      const nearest = findNearestPlace(
        currentLocation,
        remaining
      );

      // If no place has valid coordinates
      if (!nearest) {
        // Add remaining places as they are
        ordered.push(...remaining);
        break;
      }

      ordered.push(nearest.place);

      // Remove selected place from remaining
      const index = remaining.indexOf(nearest.place);

      if (index !== -1) {
        remaining.splice(index, 1);
      }

      // Current position becomes selected place
      currentLocation = {
        latitude: nearest.place.latitude,
        longitude: nearest.place.longitude
      };
    }

    return ordered;
  }


  // -------------------------------------------------------
  // CASE 2:
  // No origin coordinates
  //
  // Start from first selected place and then keep choosing
  // nearest unvisited place.
  // -------------------------------------------------------

  let currentPlace = remaining.shift();

  ordered.push(currentPlace);

  while (remaining.length > 0) {
    const nearest = findNearestPlace(
      {
        latitude: currentPlace.latitude,
        longitude: currentPlace.longitude
      },
      remaining
    );

    if (!nearest) {
      ordered.push(...remaining);
      break;
    }

    ordered.push(nearest.place);

    const index = remaining.indexOf(nearest.place);

    if (index !== -1) {
      remaining.splice(index, 1);
    }

    currentPlace = nearest.place;
  }

  return ordered;
}


// ---------------------------------------------------------
// Build final day-wise itinerary
// ---------------------------------------------------------

function buildRoute(
  selectedPlaces,
  totalDays,
  originCoordinates = null
) {
  const timeSlots = [
    'Morning',
    'Afternoon',
    'Evening'
  ];

  const perDayCounts = distributePlaces(
    selectedPlaces.length,
    totalDays,
    timeSlots.length
  );


  // -------------------------------------------------------
  // IMPORTANT:
  // Optimize order BEFORE distributing into days.
  // -------------------------------------------------------

  const orderedPlaces = optimizeRoute(
    selectedPlaces,
    originCoordinates
  );


  const itinerary = [];

  let placeIndex = 0;

  let prevPlace = null;

  let totalLocalDistanceKm = 0;


  // -------------------------------------------------------
  // Create each day
  // -------------------------------------------------------

  for (let day = 1; day <= totalDays; day++) {
    const countForThisDay =
      perDayCounts[day - 1];

    const dayPlan = {
      day: day,
      theme: '',
      places: []
    };


    // -----------------------------------------------------
    // Free day
    // -----------------------------------------------------

    if (countForThisDay === 0) {
      dayPlan.theme = 'Free Day';

      dayPlan.note =
        'No more matching places were found for your preferences. Consider relaxing some filters for more options, or use this day to explore locally around your previous stop.';

      itinerary.push(dayPlan);

      continue;
    }


    // -----------------------------------------------------
    // Add places to current day
    // -----------------------------------------------------

    for (
      let slot = 0;
      slot < countForThisDay;
      slot++
    ) {
      const place = orderedPlaces[placeIndex];

      if (!place) {
        break;
      }


      // Use database preferred time if available
      const assignedSlot =
        place.best_time &&
        timeSlots.includes(place.best_time)
          ? place.best_time
          : timeSlots[slot];


      // ---------------------------------------------------
      // Distance from previous stop
      // ---------------------------------------------------

      const distanceFromPrevious =
        prevPlace
          ? haversineDistance(
              prevPlace.latitude,
              prevPlace.longitude,
              place.latitude,
              place.longitude
            )
          : null;


      // ---------------------------------------------------
      // Local transport cost
      // ---------------------------------------------------

      const transportCostFromPrevious =
        distanceFromPrevious != null
          ? Math.round(
              distanceFromPrevious *
              LOCAL_TRANSPORT_RATE_PER_KM
            )
          : null;


      if (distanceFromPrevious != null) {
        totalLocalDistanceKm +=
          distanceFromPrevious;
      }


      // ---------------------------------------------------
      // Add place to day
      // ---------------------------------------------------

      dayPlan.places.push({
        name: place.name,
        city: place.city,
        type: place.type,

        time_slot: assignedSlot,

        duration_hrs:
          place.time_to_visit_hrs,

        match_score:
          place.matchScore,

        match_breakdown:
          place.match_breakdown || null,

        activities:
          place.activities || [],

        entry_fee_inr:
          place.entrance_fee_inr,

        vibe:
          place.vibe,

        photography_spot:
          place.photography_spot,

        local_cuisine:
          place.local_cuisine_must_try,

        avoid_if:
          place.avoid_if,

        nearest_railway_station:
          place.nearest_railway_station,

        railway_distance_km:
          place.railway_distance_km,

        nearest_airport:
          place.nearest_airport,

        airport_distance_km:
          place.airport_distance_km,

        distance_from_previous_km:
          distanceFromPrevious,

        local_transport_cost_from_previous_inr:
          transportCostFromPrevious,

        latitude:
          place.latitude,

        longitude:
          place.longitude
      });


      // Current place becomes previous place
      prevPlace = place;

      placeIndex++;
    }


    // -----------------------------------------------------
    // Generate day theme
    // -----------------------------------------------------

    const types = dayPlan.places.map(
      p => p.type
    );


    if (types.includes('Beach')) {
      dayPlan.theme =
        'Beach & Relaxation';
    } else if (
      types.includes('Fort') ||
      types.includes('Temple')
    ) {
      dayPlan.theme =
        'Heritage & Culture';
    } else if (
      types.includes('National Park') ||
      types.includes('Waterfall')
    ) {
      dayPlan.theme =
        'Nature & Adventure';
    } else if (
      types.includes('Lake')
    ) {
      dayPlan.theme =
        'Scenic Exploration';
    } else {
      dayPlan.theme =
        'Local Exploration';
    }


    itinerary.push(dayPlan);
  }


  return {
    itinerary,

    totalLocalDistanceKm:
      parseFloat(
        totalLocalDistanceKm.toFixed(1)
      )
  };
}


// ---------------------------------------------------------
// Calculate estimated cost
// ---------------------------------------------------------

function calculateCost(
  selectedPlaces,
  totalDays,
  budgetLevel,
  totalLocalDistanceKm = 0,
  travelCostInr = 0
) {
  const stayMap = {
    budget: 800,
    mid: 3000,
    luxury: 8000
  };

  const mealMap = {
    budget: 150,
    mid: 400,
    luxury: 1000
  };


  const stayPerNight =
    stayMap[budgetLevel] || 3000;

  const mealPerDay =
    mealMap[budgetLevel] || 400;


  const totalStay =
    stayPerNight * totalDays;

  const totalMeals =
    mealPerDay * totalDays * 3;


  const totalEntry =
    selectedPlaces.reduce(
      (sum, p) =>
        sum + (p.entrance_fee_inr || 0),
      0
    );


  const totalLocalTransport =
    Math.round(
      totalLocalDistanceKm *
      LOCAL_TRANSPORT_RATE_PER_KM
    );


  const minCost =
    totalStay +
    totalMeals +
    totalEntry +
    totalLocalTransport +
    travelCostInr;


  const maxCost =
    minCost * 1.3;


  return {
    stay: `₹${totalStay}`,

    meals: `₹${totalMeals}`,

    entry_fees: `₹${totalEntry}`,

    local_transport:
      `₹${totalLocalTransport}`,

    travel_to_destination:
      travelCostInr > 0
        ? `₹${travelCostInr}`
        : "Not calculated (select origin city)",

    estimated_total:
      `₹${Math.round(minCost)} - ₹${Math.round(maxCost)}`
  };
}


module.exports = {
  buildRoute,
  calculateCost,
  optimizeRoute
};