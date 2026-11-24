/**
 * All tunable hook numbers live here. Upgrades (MLP 0.4) will produce a modified
 * copy of these params, e.g. Quick Reel: reelSpeed x1.2, Precision: grabRadius x1.5.
 */
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
}

export const DEFAULT_HOOK_PARAMS: Readonly<HookParams> = {
  maxAngle: (70 * Math.PI) / 180,
  swingSpeed: (2 * Math.PI) / 2.6,
  shootSpeed: 380,
  reelSpeed: 420,
  strength: 2,
  grabRadius: 6,
  restLength: 30,
};
