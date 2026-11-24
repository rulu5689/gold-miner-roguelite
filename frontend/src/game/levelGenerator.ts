import { createRng, randomInt } from "./rng";
import { levelQuota } from "./rules";
import type { FieldItem, Mineral } from "./types";

/**
 * Temporary frontend level generator (seeded, deterministic).
 * MLP 0.3 moves level generation to the backend.
 */
export interface FieldArea {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const GAP = 6;
const PLACEMENT_TRIES = 60;
/** The field should hold at least this multiple of the level quota. */
const VALUE_MARGIN = 2;

export function generateLevel(
  seed: number,
  level: number,
  minerals: readonly Mineral[],
  area: FieldArea,
): FieldItem[] {
  const rng = createRng(seed);
  const pool = minerals.filter((m) => m.min_level <= level);
  if (pool.length === 0) return [];

  const items: FieldItem[] = [];
  const count = Math.min(10 + 2 * level, 22);
  for (let i = 0; i < count; i++) place(pickWeighted(pool, rng));

  // Guarantee the level is winnable: add gold until enough value is on the field.
  const gold = pool.find((m) => m.id === "gold_medium") ?? pool[0];
  const needed = levelQuota(level) * VALUE_MARGIN;
  let guard = 0;
  while (items.reduce((s, it) => s + it.value, 0) < needed && guard++ < 30) place(gold);

  return items;

  function place(mineral: Mineral): void {
    const r = mineral.radius;
    for (let t = 0; t < PLACEMENT_TRIES; t++) {
      const x = area.left + r + rng() * (area.right - area.left - 2 * r);
      const y = area.top + r + rng() * (area.bottom - area.top - 2 * r);
      const overlaps = items.some((o) => Math.hypot(o.x - x, o.y - y) < o.radius + r + GAP);
      if (!overlaps) {
        const value =
          mineral.value_max != null ? randomInt(rng, mineral.value, mineral.value_max) : mineral.value;
        items.push({ id: items.length, mineralId: mineral.id, x, y, radius: r, weight: mineral.weight, value });
        return;
      }
    }
  }
}

function pickWeighted(pool: readonly Mineral[], rng: () => number): Mineral {
  const total = pool.reduce((s, m) => s + m.spawn_weight, 0);
  let roll = rng() * total;
  for (const m of pool) {
    roll -= m.spawn_weight;
    if (roll < 0) return m;
  }
  return pool[pool.length - 1];
}
