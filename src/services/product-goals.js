const monthIndex = month => {
  const [year, number] = month.slice(0, 7).split('-').map(Number);
  return year * 12 + number - 1;
};

// Past scheduled reserves are not treated as money actually saved.
// Only the explicitly declared reservedCents reduces the remaining target.
export function reserveForMonth(goal, month, asOf) {
  if (goal.status !== 'planned' || goal.goalMode !== 'save') return 0;
  const start = Math.max(monthIndex(goal.date), monthIndex(asOf));
  const offset = monthIndex(month) - start;
  if (offset < 0) return 0;
  const remaining = goal.priceCents + goal.shippingCents - goal.reservedCents;
  return Math.min(goal.monthlyReserveCents, Math.max(0, remaining - offset * goal.monthlyReserveCents));
}

export function productGoalReport(goal, {months, goals, card, asOf}) {
  const total = goal.priceCents + goal.shippingCents;
  const remaining = Math.max(0, total - goal.reservedCents);
  const monthsToGoal = remaining === 0 ? 0 : goal.monthlyReserveCents > 0
    ? Math.ceil(remaining / goal.monthlyReserveCents) : null;
  const otherGoals = goals.filter(item => item.id !== goal.id);
  const rows = months.map(month => {
    const others = otherGoals.reduce((sum, item) => sum + reserveForMonth(item, month.key, asOf), 0);
    const own = goal.goalMode === 'save' ? reserveForMonth(goal, month.key, asOf) : month.paymentCents;
    // purchaseAfterCents already accounts for the unused category budget.
    const after = (goal.goalMode === 'save' ? month.availableCents - own : month.purchaseAfterCents) - others;
    return {...month, otherReservesCents: others, allocationCents: own, afterCents: after};
  });
  const credit = goal.goalMode === 'credit' ? {
    known: !!card?.active,
    availableCents: card?.active ? card.availableCents : null,
    requiredCents: total,
    shortfallCents: card?.active ? Math.max(0, total - card.availableCents) : null,
  } : null;
  const unknown = rows.some(row => !row.complete) || credit && !credit.known;
  const negative = rows.some(row => row.afterCents < 0) || credit?.shortfallCents > 0;
  return {totalCents: total, remainingCents: remaining, monthsToGoal, rows, credit,
    status: negative ? 'attention' : unknown ? 'incomplete' : 'within'};
}
