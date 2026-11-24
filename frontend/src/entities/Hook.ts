import type { HookParams } from "../game/hookParams";

export type HookState = "swinging" | "shooting" | "reeling";

export interface Grabbable {
  x: number;
  y: number;
  radius: number;
  weight: number;
}

export interface HookEvents<T> {
  /** Items grabbed this update (the caller should remove them from the field). */
  grabbed: T[];
  /** Items that reached the miner this update (the caller should award their value). */
  delivered: T[];
}

export interface Bounds {
  width: number;
  height: number;
}

/** Max simulated time per sub-step, so a fast hook can't skip past small items. */
const MAX_STEP = 1 / 240;

/**
 * Hook state machine with no Phaser dependency.
 * Angle 0 points straight down; positive angles swing to the right.
 */
export class Hook<T extends Grabbable> {
  state: HookState = "swinging";
  angle = 0;
  length: number;
  carried: T[] = [];
  private swingTime = 0;

  constructor(
    readonly originX: number,
    readonly originY: number,
    public params: HookParams,
    readonly bounds: Bounds,
  ) {
    this.length = params.restLength;
  }

  get tipX(): number {
    return this.originX + Math.sin(this.angle) * this.length;
  }

  get tipY(): number {
    return this.originY + Math.cos(this.angle) * this.length;
  }

  /** Current reel-in speed; heavier loads are slower. */
  get currentReelSpeed(): number {
    const load = this.carried.reduce((sum, item) => sum + item.weight, 0);
    const { reelSpeed, strength } = this.params;
    return (reelSpeed * strength) / (strength + load);
  }

  /** Fire the hook. Only works while swinging. Returns whether it fired. */
  fire(): boolean {
    if (this.state !== "swinging") return false;
    this.state = "shooting";
    return true;
  }

  /** Let go of everything carried (e.g. an exploding barrel). The hook keeps reeling in. */
  dropAll(): T[] {
    const dropped = this.carried;
    this.carried = [];
    return dropped;
  }

  update(dt: number, items: readonly T[]): HookEvents<T> {
    const events: HookEvents<T> = { grabbed: [], delivered: [] };
    let remaining = dt;
    while (remaining > 0) {
      const step = Math.min(remaining, MAX_STEP);
      this.step(step, items, events);
      remaining -= step;
    }
    return events;
  }

  private step(dt: number, items: readonly T[], events: HookEvents<T>): void {
    switch (this.state) {
      case "swinging":
        this.swingTime += dt;
        this.angle = this.params.maxAngle * Math.sin(this.swingTime * this.params.swingSpeed);
        break;

      case "shooting": {
        this.length += this.params.shootSpeed * dt;
        const hit = items.find(
          (item) =>
            !events.grabbed.includes(item) &&
            Math.hypot(item.x - this.tipX, item.y - this.tipY) <= item.radius + this.params.grabRadius,
        );
        if (hit) {
          this.carried.push(hit);
          events.grabbed.push(hit);
          this.state = "reeling";
        } else if (this.isOutOfBounds()) {
          this.state = "reeling";
        }
        break;
      }

      case "reeling":
        this.length -= this.currentReelSpeed * dt;
        if (this.length <= this.params.restLength) {
          this.length = this.params.restLength;
          events.delivered.push(...this.carried);
          this.carried = [];
          this.state = "swinging";
        }
        break;
    }
    this.positionCarried();
  }

  private isOutOfBounds(): boolean {
    const x = this.tipX;
    const y = this.tipY;
    return x < 0 || x > this.bounds.width || y > this.bounds.height;
  }

  /** Carried items hang just past the tip, along the rope direction. */
  private positionCarried(): void {
    const dx = Math.sin(this.angle);
    const dy = Math.cos(this.angle);
    for (const item of this.carried) {
      item.x = this.tipX + dx * item.radius;
      item.y = this.tipY + dy * item.radius;
    }
  }
}
