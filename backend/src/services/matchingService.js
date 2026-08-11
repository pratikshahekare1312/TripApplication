const pool = require('../config/db');

// Cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

// Convert user preferences to vector
function buildUserVector(userPrefs) {
  return [
    userPrefs.vibe === 'chill' ? 1 : 0,
    userPrefs.vibe === 'adventure' ? 1 : 0,
    userPrefs.vibe === 'spiritual' ? 1 : 0,
    userPrefs.vibe === 'romantic' ? 1 : 0,
    userPrefs.vibe === 'family' ? 1 : 0,
    userPrefs.vibe === 'cultural' ? 1 : 0,
    userPrefs.vibe === 'party' ? 1 : 0,
    userPrefs.vibe === 'offbeat' ? 1 : 0,
    userPrefs.budget === 'budget' ? 1 : 0,
    userPrefs.budget === 'mid' ? 1 : 0,
    userPrefs.budget === 'luxury' ? 1 : 0,
    userPrefs.crowd === 'low' ? 1 : 0,
    userPrefs.crowd === 'medium' ? 1 : 0,
    userPrefs.crowd === 'high' ? 1 : 0,
    userPrefs.wantsAdventureSports ? 1 : 0,
    userPrefs.wantsWaterActivities ? 1 : 0,
    userPrefs.wantsTrekking ? 1 : 0,
    userPrefs.wantsNightlife ? 1 : 0,
    userPrefs.wantsShopping ? 1 : 0,
    userPrefs.wantsPhotography ? 1 : 0,
  ];
}

// Convert place to vector
function buildPlaceVector(place) {
  return [
    place.vibe === 'chill' ? 1 : 0,
    place.vibe === 'adventure' ? 1 : 0,
    place.vibe === 'spiritual' ? 1 : 0,
    place.vibe === 'romantic' ? 1 : 0,
    place.vibe === 'family' ? 1 : 0,
    place.vibe === 'cultural' ? 1 : 0,
    place.vibe === 'party' ? 1 : 0,
    place.vibe === 'offbeat' ? 1 : 0,
    place.budget_level === 'budget' ? 1 : 0,
    place.budget_level === 'mid' ? 1 : 0,
    place.budget_level === 'luxury' ? 1 : 0,
    place.crowd_level === 'low' ? 1 : 0,
    place.crowd_level === 'medium' ? 1 : 0,
    place.crowd_level === 'high' ? 1 : 0,
    place.adventure_sports === 'yes' ? 1 : 0,
    place.water_activities === 'yes' ? 1 : 0,
    place.trekking === 'yes' ? 1 : 0,
    place.nightlife === 'yes' ? 1 : 0,
    place.shopping_nearby === 'yes' ? 1 : 0,
    place.photography_spot === 'yes' ? 1 : 0,
  ];
}

// Weighted scoring on top of cosine similarity
function weightedScore(place, userPrefs) {
  let score = 0;

  if (place.vibe === userPrefs.vibe) score += 40;
  if (place.budget_level === userPrefs.budget) score += 25;
  if (place.crowd_level === userPrefs.crowd) score += 15;
  if (userPrefs.wantsAdventureSports && place.adventure_sports === 'yes') score += 5;
  if (userPrefs.wantsWaterActivities && place.water_activities === 'yes') score += 5;
  if (userPrefs.wantsTrekking && place.trekking === 'yes') score += 5;
  if (userPrefs.wantsNightlife && place.nightlife === 'yes') score += 5;
  if (userPrefs.wantsShopping && place.shopping_nearby === 'yes') score += 3;
  if (userPrefs.wantsPhotography && place.photography_spot === 'yes') score += 2;

  return score;
}

// Main matching function
async function matchPlaces(userPreferences, filteredPlaces) {
  const userVector = buildUserVector(userPreferences);

  const scored = filteredPlaces.map(place => {
    const placeVector = buildPlaceVector(place);

    // Hybrid score — cosine similarity + weighted score
    const cosine = cosineSimilarity(userVector, placeVector);
    const weighted = weightedScore(place, userPreferences) / 100;
    const finalScore = (cosine * 0.5) + (weighted * 0.5);

    return {
      ...place,
      matchScore: parseFloat((finalScore * 100).toFixed(2))
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored;
}

module.exports = { matchPlaces };