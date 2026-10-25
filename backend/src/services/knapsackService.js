// Knapsack service — select optimal places within time and budget constraints
//
// IMPORTANT:
// This service ONLY decides which places should be selected.
// It does NOT decide the visiting order.
// Visiting order is handled separately by routeService.js using geographic distance.

function knapsack(places, totalDays, budgetLevel) {
  const maxSlots = totalDays * 3;
  const maxHours = totalDays * 8;
  const selected = [];
  let totalHours = 0;
  let totalEntranceFee = 0;

  // Maximum allowed total entry fee for budget travellers (₹250/day)
  const budgetCap = budgetLevel === 'budget' ? totalDays * 250 : Infinity;

  // Prefer places with a reasonable match score (>= 25)
  // If not enough places >= 25 exist to cover totalDays, include lower ones
  const goodPlaces = places.filter(p => p.matchScore >= 25);
  const candidatePool = goodPlaces.length >= totalDays ? goodPlaces : places;

  // Select top-ranked places that fit within time, slot, and budget constraints
  for (const place of candidatePool) {
    if (selected.length >= maxSlots) break;

    const hours = Math.ceil(place.time_to_visit_hrs || 2);
    const fee = place.entrance_fee_inr || 0;

    // Enforce budget cap for low budget travellers
    if (budgetLevel === 'budget' && fee > 100 && (totalEntranceFee + fee > budgetCap)) {
      continue;
    }

    // Enforce time constraint
    if (totalHours + hours <= maxHours || selected.length < totalDays) {
      selected.push(place);
      totalHours += hours;
      totalEntranceFee += fee;
    }
  }

  // Ensure at least totalDays places are selected if candidatePool has them
  if (selected.length < totalDays && candidatePool.length > selected.length) {
    for (const place of candidatePool) {
      if (!selected.some(s => s.place_id === place.place_id)) {
        selected.push(place);
        if (selected.length >= totalDays || selected.length >= candidatePool.length) break;
      }
    }
  }

  return selected;
}

module.exports = { knapsack };