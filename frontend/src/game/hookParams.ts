import type { HookModifiers } from "./types";

/** All tunable hook numbers live here. Upgrades change them through `applyModifiers`. */
export interface HookParams {
  /** Max swing angle from straight down, in radians. */
  maxAngle: number;
  /** Swing angular frequency (rad/s of the sine phase). */
  swingSpeed: number;
  /** Outward speed when fired, px/s. */
  shootSpeed: number;
  /** Return speed with nothing attached, px/s. */
  reelSpeed: number;
  /** Higher strength = heavy items slow the reel down less. */
  strength: number;
  /** Extra radius added to an item's own radius when checking a grab, px. */
  grabRadius: number;
  /** Rope length while swinging, px. */
  restLength: number;
  /** Magnetic items within this distance of the tip are pulled in (0 = off). */
  magnetRadius: number;
  /** How many small items one throw can carry. */
  capacity: number;
  /** Items heavier than this cannot be lifted. */
  maxLiftWeight: number;
}

export const DEFAULT_HOOK_PARAMS: Readonly<HookParams> = {
  maxAngle: (70 * Math.PI) / 180,
  swingSpeed: (2 * Math.PI) / 2.6,
  shootSpeed: 380,
  reelSpeed: 420,
  strength: 2,
  grabRadius: 6,
  restLength: 30,
  magnetRadius: 0,
  capacity: 1,
  maxLiftWeight: 10,
};

/** Applies the backend's upgrade modifiers to the base hook numbers. */
export function applyModifiers(base: Readonly<HookParams>, mods: HookModifiers): HookParams {
  return {
    ...base,
    reelSpeed: base.reelSpeed * mods.reel_speed_mult,
    shootSpeed: base.shootSpeed * mods.shoot_speed_mult,
    grabRadius: base.grabRadius + mods.grab_radius,
    magnetRadius: mods.magnet_radius,
    capacity: mods.capacity,
    maxLiftWeight: mods.max_lift_weight,
    strength: base.strength + mods.strength,
  };
}
