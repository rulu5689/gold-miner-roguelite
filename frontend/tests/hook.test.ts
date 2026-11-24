import { describe, expect, it } from "vitest";
import { Hook, type Grabbable } from "../src/entities/Hook";
import { DEFAULT_HOOK_PARAMS } from "../src/game/hookParams";

type Item = Grabbable & { name: string };
const bounds = { width: 960, height: 540 };
const makeHook = () => new Hook<Item>(480, 80, { ...DEFAULT_HOOK_PARAMS }, bounds);
const item = (name: string, x: number, y: number, weight: number, radius = 12): Item => ({ name, x, y, radius, weight });

/** Fires straight down (angle is 0 at t=0) and runs until delivery. Returns seconds taken. */
function fireAndDeliver(hook: Hook<Item>, items: Item[]): { seconds: number; delivered: Item[] } {
  hook.fire();
  let seconds = 0;
  const delivered: Item[] = [];
  while (seconds < 30) {
    const events = hook.update(1 / 60, items);
    seconds += 1 / 60;
    delivered.push(...events.delivered);
    if (hook.state === "swinging") break;
  }
  return { seconds, delivered };
}

describe("Hook", () => {
  it("swings within the max angle and passes through both sides", () => {
    const hook = makeHook();
    let min = 0;
    let max = 0;
    for (let i = 0; i < 600; i++) {
      hook.update(1 / 60, []);
      min = Math.min(min, hook.angle);
      max = Math.max(max, hook.angle);
    }
    expect(max).toBeLessThanOrEqual(DEFAULT_HOOK_PARAMS.maxAngle + 1e-9);
    expect(min).toBeGreaterThanOrEqual(-DEFAULT_HOOK_PARAMS.maxAngle - 1e-9);
    expect(max).toBeGreaterThan(DEFAULT_HOOK_PARAMS.maxAngle * 0.95);
    expect(min).toBeLessThan(-DEFAULT_HOOK_PARAMS.maxAngle * 0.95);
  });

  it("only fires while swinging", () => {
    const hook = makeHook();
    expect(hook.fire()).toBe(true);
    expect(hook.state).toBe("shooting");
    expect(hook.fire()).toBe(false);
  });

  it("grabs an item in its path and delivers it", () => {
    const hook = makeHook();
    const gold = item("gold", 480, 300, 1);
    const { delivered } = fireAndDeliver(hook, [gold]);
    expect(delivered).toEqual([gold]);
    expect(hook.carried).toEqual([]);
    expect(hook.length).toBe(DEFAULT_HOOK_PARAMS.restLength);
  });

  it("ignores items that are not in its path", () => {
    const hook = makeHook();
    const { delivered } = fireAndDeliver(hook, [item("side", 800, 300, 1)]);
    expect(delivered).toEqual([]);
    expect(hook.state).toBe("swinging");
  });

  it("reels heavy items back more slowly", () => {
    const light = fireAndDeliver(makeHook(), [item("light", 480, 400, 1)]);
    const heavy = fireAndDeliver(makeHook(), [item("heavy", 480, 400, 8)]);
    expect(heavy.seconds).toBeGreaterThan(light.seconds * 2);
  });

  it("does not skip small items even with a large time step", () => {
    const hook = makeHook();
    hook.fire();
    const events = hook.update(1, [item("tiny", 480, 250, 1, 4)]);
    expect(events.grabbed.map((i) => i.name)).toEqual(["tiny"]);
  });
});

describe("Hook.dropAll", () => {
  it("lets go of carried items but keeps reeling", () => {
    const hook = makeHook();
    hook.fire();
    hook.update(0.5, [item("barrel", 480, 250, 1)]);
    expect(hook.carried).toHaveLength(1);
    hook.dropAll();
    expect(hook.carried).toEqual([]);
    expect(hook.state).toBe("reeling");
  });
});
