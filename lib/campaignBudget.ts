// Shared budget-used math, used by every route that needs it, so the
// calculation can't drift between the search-ranking check, the History
// page, and the Promote overview. "Budget Used" is real elapsed active
// days × the real daily budget — never a charge, never an estimate.

export function computeBudgetUsedPaise(startDate: Date, endDate: Date | null, dailyBudgetPaise: number): number {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const startMs = startDate.getTime();
  const endMs = endDate ? endDate.getTime() : now;
  const effectiveEndMs = Math.min(endMs, now);
  // Not started yet (future-dated "Schedule for Later") -> zero elapsed
  // days regardless of status.
  const elapsedDays = startMs > now ? 0 : Math.max(0, Math.floor((effectiveEndMs - startMs) / DAY_MS));
  return elapsedDays * dailyBudgetPaise;
}

export function isCapReached(budgetUsedPaise: number, totalBudgetCapPaise: number | null): boolean {
  return totalBudgetCapPaise != null && budgetUsedPaise >= totalBudgetCapPaise;
}