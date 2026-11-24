import { describe, expect, it } from "vitest";
import { generateLevel } from "../src/game/levelGenerator";
import { levelQuota, targetForLevel } from "../src/game/rules";
import type { Mineral } from "../src/game/types";
import mineralsJson from "../../backend/app/data/minerals.json";

const minerals = mineralsJson as Mineral[];
const area = { left: 30, top: 140, right: 930, bottom: 520 };

describe("level generation", () => {
  it("is deterministic for the same seed", () => {
    expect(generateLevel(42, 1, minerals, area)).toEqual(generateLevel(42, 1, minerals, area));
    expect(generateLevel(42, 1, minerals, area)).not.toEqual(generateLevel(43, 1, minerals, area));
  });

  it("places items inside the area without overlaps", () => {
    for (const seed of [1, 2, 3, 99]) {
      const items = generateLevel(seed, 3, minerals, area);
      for (const a of items) {
        expect(a.x - a.radius).toBeGreaterThanOrEqual(area.left);
        expect(a.x + a.radius).toBeLessThanOrEqual(area.right);
        expect(a.y - a.radius).toBeGreaterThanOrEqual(area.top);
        expect(a.y + a.radius).toBeLessThanOrEqual(area.bottom);
        for (const b of items) {
          if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.radius + b.radius);
        }
      }
    }
  });

  it("puts enough value on the field to pass the level", () => {
    for (let level = 1; level <= 5; level++) {
      const total = generateLevel(7, level, minerals, area).reduce((s, i) => s + i.value, 0);
      expect(total).toBeGreaterThanOrEqual(levelQuota(level) * 2);
    }
  });

  it("respects min_level (no diamonds on level 1)", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(generateLevel(seed, 1, minerals, area).some((i) => i.mineralId === "diamond")).toBe(false);
    }
  });
});

describe("rules", () => {
  it("has increasing cumulative targets", () => {
    expect([1, 2, 3, 4].map(targetForLevel)).toEqual([650, 1400, 2350, 3500]);
  });
});
