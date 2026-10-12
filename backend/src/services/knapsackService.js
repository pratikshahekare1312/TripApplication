// Knapsack algorithm — select best places within time and budget constraints
//
// IMPORTANT:
// This service ONLY decides which places should be selected.
// It does NOT decide the visiting order.
//
// Visiting order is handled separately by routeService.js
// using geographic distance.

function knapsack(places, totalDays, budgetLevel) {
  // Map budget level to maximum daily cost
  const budgetMap = {
    budget: 1000,
    mid: 3000,
    luxury: 8000
  };

  const maxDailyCost = budgetMap[budgetLevel] || 3000;

  const totalBudget = maxDailyCost * totalDays;

  // Currently each day has 3 time slots
  const totalTimeSlots = totalDays * 3;

  const n = places.length;

  // Each day allows approximately 8 hours of sightseeing
  const maxHours = totalDays * 8;

  // DP table
  const dp = Array(n + 1)
    .fill(null)
    .map(() => Array(maxHours + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const place = places[i - 1];

    const weight = Math.ceil(
      place.time_to_visit_hrs || 2
    );

    const value = place.matchScore || 0;

    for (let w = 0; w <= maxHours; w++) {
      if (weight <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          dp[i - 1][w - weight] + value
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  // Backtrack to find selected places
  const selected = [];

  let w = maxHours;

  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selected.push(places[i - 1]);

      w -= Math.ceil(
        places[i - 1].time_to_visit_hrs || 2
      );
    }
  }

  /*
   * IMPORTANT:
   * Do NOT sort selected places by matchScore here.
   *
   * matchScore is only used for deciding which places
   * are selected.
   *
   * The actual visiting order will be decided later
   * by the nearest-neighbor route algorithm.
   */

  return selected;
}

module.exports = { knapsack };