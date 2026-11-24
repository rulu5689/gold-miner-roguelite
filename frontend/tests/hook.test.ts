import { describe, expect, it } from "vitest";
import { Hook, type Grabbable } from "../src/entities/Hook";
import { applyModifiers, DEFAULT_HOOK_PARAMS, type HookParams } from "../src/game/hookParams";

type Item = Grabbable & { name: string };
const bounds = { width: 960, height: 540 };
const makeHook = (params: Partial<HookParams> = {}) => new Hook<Item>(480, 80, { ...DEFAULT_HOOK_PARAMS, ...params }, bounds);
const item = (name: string, x: number, y: number, weight: number, radius = 12, extra: Partial<Item> = {}): Item => ({
  name,
  x,
  y,
  radius,
  weight,
  small: false,
  magnetic: false,
  ...extra,
});
const smallGold = (name: string, x: number, y: number) => item(name, x, y, 1, 12, { small: true, magnetic: true });

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

describe("Hook upgrades", () => {
  it("cannot lift items heavier than maxLiftWeight (Heavy Duty raises it)", () => {
    const giant = () => item("giant", 480, 300, 16, 40);
    const weak = makeHook();
    const { delivered } = fireAndDeliver(weak, [giant()]);
    expect(delivered).toEqual([]);

    const strong = makeHook({ maxLiftWeight: 30 });
    expect(fireAndDeliver(strong, [giant()]).delivered.map((i) => i.name)).toEqual(["giant"]);
  });

  it("reports too-heavy items", () => {
    const hook = makeHook();
    hook.fire();
    const events = hook.update(0.5, [item("giant", 480, 300, 16, 40)]);
    expect(events.tooHeavy.map((i) => i.name)).toEqual(["giant"]);
    expect(hook.state).toBe("reeling");
  });

  it("Magnetic Hook pulls in small gold that is off the hook's path", () => {
    const off = () => smallGold("off", 520, 300); // 40px to the side of a straight-down throw
    expect(fireAndDeliver(makeHook(), [off()]).delivered).toEqual([]);
    expect(fireAndDeliver(makeHook({ magnetRadius: 50 }), [off()]).delivered.map((i) => i.name)).toEqual(["off"]);
  });

  it("Double Hook grabs two small items in one throw", () => {
    const items = () => [smallGold("a", 480, 200), smallGold("b", 480, 350)];
    expect(fireAndDeliver(makeHook(), items()).delivered.map((i) => i.name)).toEqual(["a"]);
    expect(fireAndDeliver(makeHook({ capacity: 2 }), items()).delivered.map((i) => i.name)).toEqual(["a", "b"]);
  });

  it("Double Hook stops at a big item instead of grabbing it", () => {
    const items = [smallGold("a", 480, 200), item("big", 480, 350, 8, 40)];
    const { delivered } = fireAndDeliver(makeHook({ capacity: 2 }), items);
    expect(delivered.map((i) => i.name)).toEqual(["a"]);
  });

  it("Precision grabs from further away", () => {
    const near = () => item("near", 500, 300, 1, 10); // 20px off the path
    expect(fireAndDeliver(makeHook(), [near()]).delivered).toEqual([]);
    expect(fireAndDeliver(makeHook({ grabRadius: 18 }), [near()]).delivered.map((i) => i.name)).toEqual(["near"]);
  });

  it("applies backend modifiers to the base params", () => {
    const params = applyModifiers(DEFAULT_HOOK_PARAMS, {
      reel_speed_mult: 1.2,
      shoot_speed_mult: 0.85,
      grab_radius: 12,
      magnet_radius: 50,
      capacity: 2,
      max_lift_weight: 30,
      strength: 3,
    });
    expect(params.reelSpeed).toBeCloseTo(DEFAULT_HOOK_PARAMS.reelSpeed * 1.2);
    expect(params.shootSpeed).toBeCloseTo(DEFAULT_HOOK_PARAMS.shootSpeed * 0.85);
    expect(params.grabRadius).toBe(DEFAULT_HOOK_PARAMS.grabRadius + 12);
    expect(params.strength).toBe(DEFAULT_HOOK_PARAMS.strength + 3);
    expect([params.magnetRadius, params.capacity, params.maxLiftWeight]).toEqual([50, 2, 30]);
  });
});
