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
      days,
      group_type,
      group_composition,
      budget_level,
      vibe,
      crowd_preference,
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
      prefers_offbeat,
      carrying_dslr,
      internet_important,
      origin_city
    } = req.body;


    // -----------------------------------------------------
    // Get places for destination state
    // -----------------------------------------------------

    let query = `
      SELECT p.*
      FROM places p
      JOIN states s
        ON p.state_id = s.state_id
      WHERE s.state_name = ?
    `;

    const params = [destination_state];


    if (carrying_dslr) {
      query += `
        AND p.dslr_allowed = 'Yes'
      `;
    }


    if (internet_important) {
      query += `
        AND p.internet_connectivity
        IN ('good', 'moderate')
      `;
    }


    if (medical_important) {
      query += `
        AND p.medical_facilities_nearby = 'yes'
      `;
    }


    if (!religious_interest) {
      query += `
        AND p.religious_significance = 'no'
      `;
    }


    if (prefers_offbeat === 'Popular') {
      query += `
        AND p.offbeat = 'no'
      `;
    } else if (prefers_offbeat === 'Offbeat') {
      query += `
        AND p.offbeat = 'yes'
      `;
    }


    const [places] =
      await pool.query(
        query,
        params
      );


    if (places.length === 0) {
      return res.status(404).json({
        status: 'error',
        message:
          `No places found for ${destination_state}`
      });
    }


    // -----------------------------------------------------
    // Get activities
    // -----------------------------------------------------

    const placeIds =
      places.map(p => p.place_id);


    const [activityRows] =
      await pool.query(
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

      activitiesMap[row.place_id].push(
        row.value
      );
    }


    // -----------------------------------------------------
    // Parse JSON fields
    // -----------------------------------------------------

    places.forEach(place => {
      place.activities =
        activitiesMap[place.place_id] || [];

      place.local_cuisine_must_try =
        parseJsonField(
          place.local_cuisine_must_try
        );

      place.trip_vibe_tags =
        parseJsonField(
          place.trip_vibe_tags
        );

      place.tags =
        parseJsonField(
          place.tags
        );

      place.best_nearby_places =
        parseJsonField(
          place.best_nearby_places
        );

      place.language_spoken =
        parseJsonField(
          place.language_spoken
        );
    });


    // -----------------------------------------------------
    // Hard constraints
    // -----------------------------------------------------

    const userConstraints = {
      hasSoloFemale:
        solo_female === true,

      hasKids:
        group_composition?.includes('Kids'),

      hasSeniors:
        group_composition?.includes('Seniors'),

      needsWheelchairAccess:
        wheelchair_needed === true,

      budgetLevel:
        budget_level,

      isFamily:
        group_type === 'family'
    };


    const filteredPlaces =
      await applyConstraints(
        places,
        userConstraints
      );


    // -----------------------------------------------------
    // User preferences
    // -----------------------------------------------------

    const userPrefs = {
      vibe:
        Array.isArray(vibe)
          ? vibe[0]
          : vibe,

      budget:
        budget_level,

      crowd:
        crowd_preference,

      wantsAdventureSports:
        wants_adventure_sports || false,

      wantsWaterActivities:
        wants_water_activities || false,

      wantsTrekking:
        wants_trekking || false,

      wantsNightlife:
        wants_nightlife || false,

      wantsShopping:
        wants_shopping || false,

      wantsPhotography:
        wants_photography || false
    };


    // -----------------------------------------------------
    // Match places
    // -----------------------------------------------------

    const matchedPlaces =
      await matchPlaces(
        userPrefs,
        filteredPlaces
      );


    // -----------------------------------------------------
    // Knapsack selects places
    //
    // IMPORTANT:
    // Score is used ONLY here for selection.
    // It does not decide route order.
    // -----------------------------------------------------

    const selectedPlaces =
      knapsack(
        matchedPlaces,
        days,
        budget_level
      );


    if (selectedPlaces.length === 0) {
      return res.status(404).json({
        status: 'error',
        message:
          'No suitable places found matching your preferences'
      });
    }


    // -----------------------------------------------------
    // Get origin city coordinates
    // -----------------------------------------------------

    let originCoordinates = null;

    if (origin_city) {
      originCoordinates =
        await getCityCoordinates(
          origin_city
        );
    }


    // -----------------------------------------------------
    // Build optimized route
    //
    // Origin
    //    ↓
    // nearest place
    //    ↓
    // nearest unvisited place
    //    ↓
    // nearest unvisited place
    //
    // Score does NOT decide this order.
    // -----------------------------------------------------

    const {
      itinerary,
      totalLocalDistanceKm
    } = buildRoute(
      selectedPlaces,
      days,
      originCoordinates
    );


    // -----------------------------------------------------
    // Check if enough places were found
    // -----------------------------------------------------

    const insufficientData =
      selectedPlaces.length < days * 3;


    const dataNote =
      insufficientData
        ? `Only ${selectedPlaces.length} matching places found for your preferences. Some days may have fewer places than usual — try relaxing a filter for more options.`
        : null;


    // -----------------------------------------------------
    // Calculate destination travel cost
    // -----------------------------------------------------

    let travelInfo = null;


    const validCoords =
  selectedPlaces
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
      // Average coordinates are still used
      // for estimating overall destination location.
      const avgLat =
        validCoords.reduce(
          (sum, p) =>
            sum + Number(p.latitude),
          0
        ) / validCoords.length;


      const avgLon =
        validCoords.reduce(
          (sum, p) =>
            sum + Number(p.longitude),
          0
        ) / validCoords.length;


      travelInfo =
        await calculateTravelCost(
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
      travelInfo &&
      Number.isFinite(
        Number(travelInfo.cost_inr)
      )
        ? Number(travelInfo.cost_inr)
        : 0;


    const cost =
      calculateCost(
        selectedPlaces,
        days,
        budget_level,
        totalLocalDistanceKm,
        travelCost
    );


    // -----------------------------------------------------
    // Final response
    // -----------------------------------------------------

    return res.json({
      status: 'success',

      destination:
        destination_state,

      total_days:
        days,

      group_type,

      budget_level,

      estimated_cost:
        cost,

      travel_details:
        travelInfo,

      itinerary,

      total_places_selected:
        selectedPlaces.length,

      note:
        dataNote
    });


  } catch (error) {
    console.error(
      'Error generating itinerary:',
      error
    );

    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}


module.exports = {
  generateItinerary
};