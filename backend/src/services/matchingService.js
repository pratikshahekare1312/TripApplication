const pool = require('../config/db');


// ---------------------------------------------------------
// Cosine similarity between two feature vectors
// ---------------------------------------------------------

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}


// ---------------------------------------------------------
// Convert user preferences to feature vector
// ---------------------------------------------------------

function buildUserVector(userPrefs) {
  return [
    userPrefs.vibe === 'chill'      ? 1 : 0,
    userPrefs.vibe === 'adventure'  ? 1 : 0,
    userPrefs.vibe === 'spiritual'  ? 1 : 0,
    userPrefs.vibe === 'romantic'   ? 1 : 0,
    userPrefs.vibe === 'family'     ? 1 : 0,
    userPrefs.vibe === 'cultural'   ? 1 : 0,
    userPrefs.vibe === 'party'      ? 1 : 0,
    userPrefs.vibe === 'offbeat'    ? 1 : 0,
    userPrefs.budget === 'budget'   ? 1 : 0,
    userPrefs.budget === 'mid'      ? 1 : 0,
    userPrefs.budget === 'luxury'   ? 1 : 0,
    userPrefs.crowd === 'low'       ? 1 : 0,
    userPrefs.crowd === 'medium'    ? 1 : 0,
    userPrefs.crowd === 'high'      ? 1 : 0,
    userPrefs.wantsAdventureSports  ? 1 : 0,
    userPrefs.wantsWaterActivities  ? 1 : 0,
    userPrefs.wantsTrekking         ? 1 : 0,
    userPrefs.wantsNightlife        ? 1 : 0,
    userPrefs.wantsShopping         ? 1 : 0,
    userPrefs.wantsPhotography      ? 1 : 0,
  ];
}


// ---------------------------------------------------------
// Convert place to feature vector
// ---------------------------------------------------------

function buildPlaceVector(place) {
  return [
    place.vibe === 'chill'               ? 1 : 0,
    place.vibe === 'adventure'           ? 1 : 0,
    place.vibe === 'spiritual'           ? 1 : 0,
    place.vibe === 'romantic'            ? 1 : 0,
    place.vibe === 'family'              ? 1 : 0,
    place.vibe === 'cultural'            ? 1 : 0,
    place.vibe === 'party'               ? 1 : 0,
    place.vibe === 'offbeat'             ? 1 : 0,
    place.budget_level === 'budget'      ? 1 : 0,
    place.budget_level === 'mid'         ? 1 : 0,
    place.budget_level === 'luxury'      ? 1 : 0,
    place.crowd_level === 'low'          ? 1 : 0,
    place.crowd_level === 'medium'       ? 1 : 0,
    place.crowd_level === 'high'         ? 1 : 0,
    place.adventure_sports === 'yes'     ? 1 : 0,
    place.water_activities === 'yes'     ? 1 : 0,
    place.trekking === 'yes'             ? 1 : 0,
    place.nightlife === 'yes'            ? 1 : 0,
    place.shopping_nearby === 'yes'      ? 1 : 0,
    place.photography_spot === 'yes'     ? 1 : 0,
  ];
}


// ---------------------------------------------------------
// Weighted heuristic scoring (base layer — unchanged)
// ---------------------------------------------------------

function weightedScore(place, userPrefs) {
  let score = 0;

  if (place.vibe === userPrefs.vibe)                                         score += 40;
  if (place.budget_level === userPrefs.budget)                               score += 25;
  if (place.crowd_level === userPrefs.crowd)                                 score += 15;
  if (userPrefs.wantsAdventureSports && place.adventure_sports === 'yes')   score += 5;
  if (userPrefs.wantsWaterActivities && place.water_activities === 'yes')   score += 5;
  if (userPrefs.wantsTrekking && place.trekking === 'yes')                  score += 5;
  if (userPrefs.wantsNightlife && place.nightlife === 'yes')                score += 5;
  if (userPrefs.wantsShopping && place.shopping_nearby === 'yes')           score += 3;
  if (userPrefs.wantsPhotography && place.photography_spot === 'yes')       score += 2;

  return score;
}


// ---------------------------------------------------------
// Multiplier / Penalty engine
//
// Widens score distribution so that scores are not
// compressed into a narrow 70-90% band.
//
// Returns:
//   bonus            - extra points for strong matches
//   penalty          - deduction for conflicts
//   matched_reasons  - human-readable positive reasons
//   mismatched_reasons - human-readable negative reasons
// ---------------------------------------------------------

function applyBonusPenalty(place, userPrefs) {
  let bonus   = 0;
  let penalty = 0;
  const matched_reasons    = [];
  const mismatched_reasons = [];


  // -------------------------------------------------------
  // POSITIVE BOOSTS - selected special interests that match
  // -------------------------------------------------------

  if (userPrefs.wantsAdventureSports && place.adventure_sports === 'yes') {
    bonus += 35;
    matched_reasons.push('+35 Adventure Sports');
  }

  if (userPrefs.wantsTrekking && place.trekking === 'yes') {
    bonus += 35;
    matched_reasons.push('+35 Trekking Available');
  }

  if (userPrefs.wantsWaterActivities && place.water_activities === 'yes') {
    bonus += 30;
    matched_reasons.push('+30 Water Activities');
  }

  if (userPrefs.wantsNightlife && place.nightlife === 'yes') {
    bonus += 30;
    matched_reasons.push('+30 Nightlife Available');
  }

  if (userPrefs.wantsPhotography && place.photography_spot === 'yes') {
    bonus += 20;
    matched_reasons.push('+20 Photography Spot');
  }

  if (userPrefs.wantsShopping && place.shopping_nearby === 'yes') {
    bonus += 20;
    matched_reasons.push('+20 Shopping Available');
  }

  if (place.vibe === userPrefs.vibe) {
    matched_reasons.push('Vibe Match: ' + userPrefs.vibe);
  }

  if (place.budget_level === userPrefs.budget) {
    matched_reasons.push('Budget Match: ' + userPrefs.budget);
  }

  if (place.crowd_level === userPrefs.crowd) {
    matched_reasons.push('Crowd Level Match: ' + userPrefs.crowd);
  }


  // -------------------------------------------------------
  // EXPLICIT PENALTIES - vibe / interest conflicts
  // -------------------------------------------------------

  // Chill / Spiritual users penalized for nightlife / party places
  if (
    (userPrefs.vibe === 'chill' || userPrefs.vibe === 'spiritual') &&
    place.nightlife === 'yes'
  ) {
    penalty += 40;
    mismatched_reasons.push('-40 Nightlife (conflicts with Chill/Spiritual vibe)');
  }

  if (
    (userPrefs.vibe === 'chill' || userPrefs.vibe === 'spiritual') &&
    place.vibe === 'party'
  ) {
    penalty += 40;
    mismatched_reasons.push('-40 Party Vibe (conflicts with Chill/Spiritual preference)');
  }

  // Spiritual users penalized for extreme sports places
  if (userPrefs.vibe === 'spiritual' && place.adventure_sports === 'yes') {
    penalty += 20;
    mismatched_reasons.push('-20 Extreme Sports (not aligned with Spiritual vibe)');
  }

  // Non-adventure users penalized for adventure-vibe places
  if (!userPrefs.wantsAdventureSports && place.vibe === 'adventure') {
    penalty += 15;
    mismatched_reasons.push('-15 Adventure Vibe (user not seeking adventure)');
  }

  // Non-trekking users penalized for trekking-required places (outside adventure vibe)
  if (
    !userPrefs.wantsTrekking &&
    place.trekking === 'yes' &&
    userPrefs.vibe !== 'adventure'
  ) {
    penalty += 10;
    mismatched_reasons.push('-10 Trekking Required (not in user preferences)');
  }


  // -------------------------------------------------------
  // CROWD / BUDGET MISMATCH PENALTIES
  // -------------------------------------------------------

  if (place.crowd_level !== userPrefs.crowd) {
    penalty += 20;
    mismatched_reasons.push(
      '-20 Crowd Mismatch (place: ' + place.crowd_level + ', preferred: ' + userPrefs.crowd + ')'
    );
  }

  if (place.budget_level !== userPrefs.budget) {
    penalty += 20;
    mismatched_reasons.push(
      '-20 Budget Mismatch (place: ' + place.budget_level + ', preferred: ' + userPrefs.budget + ')'
    );
  }


  return { bonus, penalty, matched_reasons, mismatched_reasons };
}


// ---------------------------------------------------------
// Main matching function
// ---------------------------------------------------------

async function matchPlaces(userPreferences, filteredPlaces) {
  const userVector = buildUserVector(userPreferences);

  const scored = filteredPlaces.map(place => {
    const placeVector = buildPlaceVector(place);

    // Base hybrid score - cosine similarity + weighted heuristic
    const cosine   = cosineSimilarity(userVector, placeVector);
    const weighted = weightedScore(place, userPreferences) / 100;
    const baseScore = (cosine * 0.5) + (weighted * 0.5);

    // Apply bonus / penalty engine for score distribution widening
    const {
      bonus,
      penalty,
      matched_reasons,
      mismatched_reasons
    } = applyBonusPenalty(place, userPreferences);

    // Final adjusted score clamped to 0 - 100
    let adjustedScore = (baseScore * 100) + bonus - penalty;
    adjustedScore = Math.max(0, Math.min(100, adjustedScore));

    const finalMatchScore = parseFloat(adjustedScore.toFixed(2));

    const match_breakdown = {
      matched_reasons,
      mismatched_reasons,
      final_match_percentage: finalMatchScore
    };

    return {
      ...place,
      matchScore:      finalMatchScore,
      match_breakdown
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored;
}


module.exports = { matchPlaces };