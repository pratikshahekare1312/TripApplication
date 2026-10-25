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
// Convert user preferences to feature vector (22 dimensions)
// ---------------------------------------------------------

function buildUserVector(userPrefs) {
  return [
    userPrefs.vibe === 'chill'                       ? 1 : 0,
    userPrefs.vibe === 'adventure'                   ? 1 : 0,
    userPrefs.vibe === 'spiritual'                   ? 1 : 0,
    userPrefs.vibe === 'romantic'                    ? 1 : 0,
    userPrefs.vibe === 'family'                      ? 1 : 0,
    userPrefs.vibe === 'cultural'                    ? 1 : 0,
    userPrefs.vibe === 'party'                       ? 1 : 0,
    userPrefs.vibe === 'offbeat'                     ? 1 : 0,
    userPrefs.budget === 'budget'                    ? 1 : 0,
    userPrefs.budget === 'mid'                       ? 1 : 0,
    userPrefs.budget === 'luxury'                    ? 1 : 0,
    userPrefs.crowd === 'low'                        ? 1 : 0,
    userPrefs.crowd === 'medium'                     ? 1 : 0,
    userPrefs.crowd === 'high'                       ? 1 : 0,
    userPrefs.wantsAdventureSports                   ? 1 : 0,
    userPrefs.wantsWaterActivities                   ? 1 : 0,
    userPrefs.wantsTrekking                          ? 1 : 0,
    userPrefs.wantsNightlife                         ? 1 : 0,
    userPrefs.wantsShopping                          ? 1 : 0,
    userPrefs.wantsPhotography                       ? 1 : 0,
    (userPrefs.religious_interest || userPrefs.vibe === 'spiritual') ? 1 : 0,
    userPrefs.prefers_offbeat === 'Offbeat'          ? 1 : 0,
  ];
}

// ---------------------------------------------------------
// Convert place to feature vector (22 dimensions)
// ---------------------------------------------------------

function buildPlaceVector(place) {
  const fee = place.entrance_fee_inr || 0;
  const isSpiritual = place.vibe === 'spiritual' ||
    place.religious_significance === 'yes' ||
    ['Temple', 'Monastery', 'Gurudwara', 'Church', 'Mosque', 'Religious Shrine', 'Spiritual Center', 'Ghat'].includes(place.type);
  const isAdventure = place.vibe === 'adventure' ||
    place.adventure_sports === 'yes' ||
    place.trekking === 'yes' ||
    ['Ski Resort', 'Adventure Sport', 'Trekking'].includes(place.type);
  const isCultural = place.vibe === 'cultural' ||
    ['Fort', 'Palace', 'Monument', 'Museum', 'Heritage', 'Cave', 'Mausoleum', 'Historical', 'Stepwell'].includes(place.type);

  return [
    place.vibe === 'chill'                          ? 1 : 0,
    (place.vibe === 'adventure' || isAdventure)     ? 1 : 0,
    (place.vibe === 'spiritual' || isSpiritual)     ? 1 : 0,
    place.vibe === 'romantic'                       ? 1 : 0,
    place.vibe === 'family'                         ? 1 : 0,
    (place.vibe === 'cultural' || isCultural)       ? 1 : 0,
    place.vibe === 'party'                          ? 1 : 0,
    place.offbeat === 'yes'                         ? 1 : 0,
    place.budget_level === 'budget'                 ? 1 : 0,
    place.budget_level === 'mid'                    ? 1 : 0,
    (fee >= 500 || place.avg_cost_per_day_inr === '3000-8000') ? 1 : 0,
    place.crowd_level === 'low'                     ? 1 : 0,
    place.crowd_level === 'medium'                  ? 1 : 0,
    place.crowd_level === 'high'                    ? 1 : 0,
    place.adventure_sports === 'yes'                ? 1 : 0,
    place.water_activities === 'yes'                ? 1 : 0,
    place.trekking === 'yes'                        ? 1 : 0,
    place.nightlife === 'yes'                       ? 1 : 0,
    place.shopping_nearby === 'yes'                 ? 1 : 0,
    place.photography_spot === 'yes'                ? 1 : 0,
    place.religious_significance === 'yes'          ? 1 : 0,
    place.offbeat === 'yes'                         ? 1 : 0,
  ];
}

// ---------------------------------------------------------
// Weighted heuristic scoring (base semantic layer)
// ---------------------------------------------------------

function weightedScore(place, userPrefs) {
  let score = 0;
  const theme = userPrefs.vibe;
  const fee = place.entrance_fee_inr || 0;

  // 1. Theme / Vibe Match (35 pts)
  const isSpiritual = place.vibe === 'spiritual' ||
    place.religious_significance === 'yes' ||
    ['Temple', 'Monastery', 'Gurudwara', 'Church', 'Mosque', 'Religious Shrine', 'Spiritual Center', 'Ghat'].includes(place.type);

  const isAdventure = place.vibe === 'adventure' ||
    place.adventure_sports === 'yes' ||
    place.trekking === 'yes' ||
    ['Ski Resort', 'Adventure Sport', 'Trekking'].includes(place.type);

  const isCultural = place.vibe === 'cultural' ||
    ['Fort', 'Palace', 'Monument', 'Museum', 'Heritage', 'Cave', 'Mausoleum', 'Historical', 'Stepwell'].includes(place.type);

  const isChill = place.vibe === 'chill' ||
    ['Beach', 'Lake', 'Park', 'Garden', 'Hill', 'Viewpoint', 'Orchard'].includes(place.type);

  const isRomantic = place.vibe === 'romantic' ||
    ['Beach', 'Lake', 'Promenade', 'Viewpoint', 'Valley', 'Vineyard'].includes(place.type);

  const isFamily = place.vibe === 'family' ||
    place.kids_friendly === 'yes' ||
    ['Amusement Park', 'Zoo', 'Park', 'Aquarium', 'Science'].includes(place.type);

  if (theme === 'spiritual') {
    if (isSpiritual) score += 35;
    else if (isCultural) score += 15;
  } else if (theme === 'adventure') {
    if (isAdventure) score += 35;
    else if (place.water_activities === 'yes') score += 15;
  } else if (theme === 'cultural') {
    if (isCultural) score += 35;
    else if (isSpiritual) score += 15;
  } else if (theme === 'chill') {
    if (isChill) score += 35;
  } else if (theme === 'romantic') {
    if (isRomantic) score += 35;
  } else if (theme === 'family') {
    if (isFamily) score += 35;
  } else if (place.vibe === theme) {
    score += 35;
  }

  // 2. Budget Level Match (25 pts)
  const budget = userPrefs.budget || 'mid';
  if (budget === 'budget') {
    if (place.budget_level === 'budget') score += 15;
    if (fee === 0) score += 10;
    else if (fee <= 50) score += 5;
  } else if (budget === 'luxury') {
    if (fee >= 500) score += 25;
    else if (fee >= 100) score += 18;
    else if (place.avg_cost_per_day_inr === '3000-8000') score += 20;
    else if (place.budget_level === 'mid') score += 12;
  } else {
    // mid
    if (place.budget_level === 'mid') score += 20;
    else score += 10;
  }

  // 3. Crowd Level Match (15 pts)
  if (place.crowd_level === userPrefs.crowd) {
    score += 15;
  } else {
    score += 5;
  }

  // 4. Special Interests (25 pts)
  if (userPrefs.wantsAdventureSports && place.adventure_sports === 'yes') score += 5;
  if (userPrefs.wantsWaterActivities && place.water_activities === 'yes') score += 5;
  if (userPrefs.wantsTrekking && place.trekking === 'yes') score += 5;
  if (userPrefs.wantsNightlife && place.nightlife === 'yes') score += 5;
  if (userPrefs.wantsShopping && place.shopping_nearby === 'yes') score += 3;
  if (userPrefs.wantsPhotography && place.photography_spot === 'yes') score += 2;

  return Math.min(100, score);
}

// ---------------------------------------------------------
// Multiplier / Penalty engine
// ---------------------------------------------------------

function applyBonusPenalty(place, userPrefs) {
  let bonus   = 0;
  let penalty = 0;
  const matched_reasons    = [];
  const mismatched_reasons = [];

  const theme = userPrefs.vibe;
  const fee = place.entrance_fee_inr || 0;

  // -------------------------------------------------------
  // THEME POSITIVE BOOSTS & EXPLICIT PENALTIES
  // -------------------------------------------------------

  const isSpiritual = place.vibe === 'spiritual' ||
    place.religious_significance === 'yes' ||
    ['Temple', 'Monastery', 'Gurudwara', 'Church', 'Mosque', 'Religious Shrine', 'Spiritual Center', 'Ghat'].includes(place.type);

  const isAdventure = place.vibe === 'adventure' ||
    place.adventure_sports === 'yes' ||
    place.trekking === 'yes' ||
    ['Ski Resort', 'Adventure Sport', 'Trekking'].includes(place.type);

  const isCultural = place.vibe === 'cultural' ||
    ['Fort', 'Palace', 'Monument', 'Museum', 'Heritage', 'Cave', 'Mausoleum', 'Historical', 'Stepwell'].includes(place.type);

  if (theme === 'spiritual') {
    if (isSpiritual) {
      bonus += 30;
      matched_reasons.push('+30 Spiritual Destination');
    } else {
      penalty += 25;
      mismatched_reasons.push('-25 Non-spiritual attraction');
    }
  } else if (theme === 'adventure') {
    if (isAdventure) {
      bonus += 30;
      matched_reasons.push('+30 Adventure Destination');
    } else {
      penalty += 25;
      mismatched_reasons.push('-25 Low adventure appeal');
    }
  } else if (theme === 'cultural') {
    if (isCultural) {
      bonus += 30;
      matched_reasons.push('+30 Cultural & Heritage Destination');
    }
  }

  // -------------------------------------------------------
  // BUDGET BOOSTS & PENALTIES
  // -------------------------------------------------------

  const budget = userPrefs.budget || 'mid';
  if (budget === 'budget') {
    if (place.budget_level === 'budget') {
      bonus += 15;
      matched_reasons.push('+15 Budget Tier Match');
    }
    if (fee === 0) {
      bonus += 15;
      matched_reasons.push('+15 Free Admission');
    } else if (fee > 500) {
      penalty += 30;
      mismatched_reasons.push(`-30 Expensive entrance fee for budget (₹${fee})`);
    } else if (fee > 150) {
      penalty += 15;
      mismatched_reasons.push(`-15 Higher entrance fee for budget (₹${fee})`);
    }
  } else if (budget === 'luxury') {
    if (fee >= 500) {
      bonus += 30;
      matched_reasons.push(`+30 Premium / Paid Experience (₹${fee})`);
    } else if (fee >= 100) {
      bonus += 20;
      matched_reasons.push(`+20 Paid Attraction (₹${fee})`);
    } else if (place.avg_cost_per_day_inr === '3000-8000') {
      bonus += 25;
      matched_reasons.push('+25 Higher Average Daily Cost tier');
    } else if (place.budget_level === 'mid') {
      bonus += 15;
      matched_reasons.push('+15 Mid-to-High Standard');
    } else if (fee === 0 && place.crowd_level === 'high' && place.budget_level === 'budget') {
      penalty += 10;
      mismatched_reasons.push('-10 Crowded public free area');
    }
  } else {
    // mid
    if (place.budget_level === 'mid') {
      bonus += 15;
      matched_reasons.push('+15 Mid-Range Match');
    }
    if (fee > 3000) {
      penalty += 20;
      mismatched_reasons.push(`-20 Very high entrance fee (₹${fee})`);
    }
  }

  // -------------------------------------------------------
  // SPECIAL INTERESTS
  // -------------------------------------------------------

  if (userPrefs.wantsAdventureSports && place.adventure_sports === 'yes') {
    bonus += 25;
    matched_reasons.push('+25 Adventure Sports Available');
  }
  if (userPrefs.wantsTrekking && place.trekking === 'yes') {
    bonus += 25;
    matched_reasons.push('+25 Trekking Trail');
  }
  if (userPrefs.wantsWaterActivities && place.water_activities === 'yes') {
    bonus += 25;
    matched_reasons.push('+25 Water Activities Available');
  }
  if (userPrefs.wantsNightlife && place.nightlife === 'yes') {
    bonus += 25;
    matched_reasons.push('+25 Nightlife Available');
  }
  if (userPrefs.wantsShopping && place.shopping_nearby === 'yes') {
    bonus += 15;
    matched_reasons.push('+15 Shopping Options Nearby');
  }
  if (userPrefs.wantsPhotography && place.photography_spot === 'yes') {
    bonus += 15;
    matched_reasons.push('+15 Photography Spot');
  }
  if ((userPrefs.religious_interest || userPrefs.vibe === 'spiritual') && place.religious_significance === 'yes') {
    bonus += 25;
    matched_reasons.push('+25 Religious Significance');
  }

  // -------------------------------------------------------
  // CROWD & OFFBEAT PREFERENCES
  // -------------------------------------------------------

  if (userPrefs.crowd === 'low') {
    if (place.crowd_level === 'low') {
      bonus += 15;
      matched_reasons.push('+15 Low Crowd / Peaceful');
    } else if (place.crowd_level === 'high') {
      penalty += 15;
      mismatched_reasons.push('-15 High Crowd (User prefers quiet)');
    }
  } else if (userPrefs.crowd === 'high') {
    if (place.crowd_level === 'high') {
      bonus += 15;
      matched_reasons.push('+15 Popular & Vibrant');
    }
  }

  if (userPrefs.prefers_offbeat === 'Offbeat') {
    if (place.offbeat === 'yes') {
      bonus += 30;
      matched_reasons.push('+30 Offbeat Destination');
    } else {
      penalty += 10;
    }
  } else if (userPrefs.prefers_offbeat === 'Popular') {
    if (place.offbeat === 'no') {
      bonus += 15;
      matched_reasons.push('+15 Popular Attraction');
    } else {
      penalty += 20;
      mismatched_reasons.push('-20 Offbeat site (User prefers popular)');
    }
  }

  // -------------------------------------------------------
  // CONFLICT PENALTIES
  // -------------------------------------------------------

  if ((theme === 'chill' || theme === 'spiritual') && place.nightlife === 'yes') {
    penalty += 35;
    mismatched_reasons.push('-35 Nightlife (conflicts with Chill/Spiritual vibe)');
  }
  if ((theme === 'chill' || theme === 'spiritual') && place.vibe === 'party') {
    penalty += 35;
    mismatched_reasons.push('-35 Party Vibe (conflicts with Chill/Spiritual vibe)');
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

    // Base hybrid score — cosine similarity + weighted heuristic
    const cosine   = cosineSimilarity(userVector, placeVector);
    const weighted = weightedScore(place, userPreferences) / 100;
    const baseScore = (cosine * 0.4) + (weighted * 0.6);

    // Apply bonus / penalty engine
    const {
      bonus,
      penalty,
      matched_reasons,
      mismatched_reasons
    } = applyBonusPenalty(place, userPreferences);

    // Final adjusted score clamped to 5 - 100
    let adjustedScore = (baseScore * 100) + bonus - penalty;
    adjustedScore = Math.max(5, Math.min(100, adjustedScore));

    const finalMatchScore = parseFloat(adjustedScore.toFixed(2));

    const match_breakdown = {
      matched_reasons,
      mismatched_reasons,
      final_match_percentage: finalMatchScore
    };

    return {
      ...place,
      matchScore: finalMatchScore,
      match_breakdown
    };
  });

  // Sort by match score descending
  scored.sort((a, b) => b.matchScore - a.matchScore);

  return scored;
}

module.exports = { matchPlaces };