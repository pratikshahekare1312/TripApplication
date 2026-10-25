const pool = require('../config/db');

async function applyConstraints(places, userPreferences) {
  const {
    hasSoloFemale,
    hasKids,
    hasSeniors,
    needsWheelchairAccess,
    budgetLevel,
    isFamily,
    carryingDslr,
    medicalImportant,
    internetImportant,
    avoidAdventureSports,
    avoidWaterActivities,
    avoidTrekking,
    avoidNightlife,
    avoidShopping,
    avoidPhotography,
    avoidReligious
  } = userPreferences;

  // Fetch all hard rules from database
  const [rules] = await pool.query('SELECT * FROM constraint_rules');

  const filtered = places.filter(place => {
    // 1. Mandatory Database Constraint Rules
    for (const rule of rules) {
      const { condition_field, condition_value, excluded_attribute, excluded_value } = rule;

      let ruleApplies = false;

      if (condition_field === 'solo_female' && hasSoloFemale) ruleApplies = true;
      if (condition_field === 'group_composition' && condition_value === 'kids' && hasKids) ruleApplies = true;
      if (condition_field === 'group_composition' && condition_value === 'seniors' && hasSeniors) ruleApplies = true;
      if (condition_field === 'accessibility_needed' && needsWheelchairAccess) ruleApplies = true;
      if (condition_field === 'budget_level' && budgetLevel === condition_value) ruleApplies = true;
      if (condition_field === 'group_type' && condition_value === 'family' && isFamily) ruleApplies = true;

      if (ruleApplies) {
        const placeValue = place[excluded_attribute];
        if (placeValue === excluded_value) {
          return false;
        }
      }
    }

    // 2. Hardware / Accessibility Constraints
    if (carryingDslr && place.dslr_allowed === 'No') {
      return false;
    }
    if (medicalImportant && place.medical_facilities_nearby === 'no') {
      return false;
    }
    if (internetImportant && !['good', 'moderate'].includes(place.internet_connectivity)) {
      return false;
    }

    // 3. Mandatory Avoid Preferences
    if (avoidAdventureSports && place.adventure_sports === 'yes') {
      return false;
    }
    if (avoidWaterActivities && place.water_activities === 'yes') {
      return false;
    }
    if (avoidTrekking && place.trekking === 'yes') {
      return false;
    }
    if (avoidNightlife && place.nightlife === 'yes') {
      return false;
    }
    if (avoidShopping && place.shopping_nearby === 'yes') {
      return false;
    }
    if (avoidPhotography && place.photography_spot === 'yes') {
      return false;
    }
    if (avoidReligious && place.religious_significance === 'yes') {
      return false;
    }

    // 4. Hard Budget Limit
    if (budgetLevel === 'budget' && (place.entrance_fee_inr || 0) > 1500) {
      return false;
    }

    return true;
  });

  return filtered;
}

module.exports = { applyConstraints };