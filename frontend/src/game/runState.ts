/** Serializable state of the current run, passed between scenes. */
export interface RunState {
  seed: number;
  level: number;
  money: number;
}

export function newRun(seed: number = Math.floor(Math.random() * 2 ** 31)): RunState {
  return { seed, level: 1, money: 0 };
}

/** Seed for a specific level of a run (deterministic). */
export function levelSeed(run: RunState): number {
  return (run.seed + run.level * 7919) >>> 0;
}
