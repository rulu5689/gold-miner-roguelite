/** Level rules. Moves to the backend in MLP 0.3. */
export const LEVEL_DURATION_SECONDS = 60;

/** Cumulative money needed to pass level n (1-based): 650, 1400, 2350, 3500, ... */
export function targetForLevel(level: number): number {
  let target = 650;
  for (let n = 2; n <= level; n++) target += 550 + 200 * (n - 1);
  return target;
}

/** Money that must be earned during this level alone. */
export function levelQuota(level: number): number {
  return level === 1 ? targetForLevel(1) : targetForLevel(level) - targetForLevel(level - 1);
}
