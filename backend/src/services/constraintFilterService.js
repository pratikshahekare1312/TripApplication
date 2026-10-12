const pool = require('../config/db');

async function applyConstraints(places, userPreferences) {
  const {
    hasSoloFemale,
    hasKids,
    hasSeniors,
    needsWheelchairAccess,
    budgetLevel,
    isFamily
  } = userPreferences;

  // Fetch all hard rules from database
  const [rules] = await pool.query('SELECT * FROM constraint_rules');

  const filtered = places.filter(place => {
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
    return true;
  });

  return filtered;
}

module.exports = { applyConstraints };