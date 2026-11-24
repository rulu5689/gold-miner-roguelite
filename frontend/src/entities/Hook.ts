import type { HookParams } from "../game/hookParams";

export type HookState = "swinging" | "shooting" | "reeling";

export interface Grabbable {
  x: number;
  y: number;
  radius: number;
  weight: number;
  /** Small items can share a throw when capacity > 1. */
  small: boolean;
  /** Magnetic items are pulled in when the hook passes nearby (Magnetic Hook). */
  magnetic: boolean;
}

export interface HookEvents<T> {
  /** Items grabbed this update (the caller should remove them from the field). */
  grabbed: T[];
  /** Items that reached the miner this update (the caller should award their value). */
  delivered: T[];
  /** Items the hook touched but could not lift. */
  tooHeavy: T[];
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
    const events: HookEvents<T> = { grabbed: [], delivered: [], tooHeavy: [] };
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

      case "shooting":
        this.length += this.params.shootSpeed * dt;
        this.checkGrabs(items, events);
        if (this.state === "shooting" && this.isOutOfBounds()) this.state = "reeling";
        break;

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

  private checkGrabs(items: readonly T[], events: HookEvents<T>): void {
    const free = (item: T) => !this.carried.includes(item);
    const distance = (item: T) => Math.hypot(item.x - this.tipX, item.y - this.tipY) - item.radius;

    // Magnetic Hook: small gold nearby jumps onto the hook.
    if (this.params.magnetRadius > 0) {
      for (const item of items) {
        if (this.state !== "shooting") return;
        if (item.magnetic && free(item) && distance(item) <= this.params.magnetRadius) this.grab(item, events);
      }
    }

    const hit = items.find((item) => free(item) && distance(item) <= this.params.grabRadius);
    if (!hit) return;

    if (hit.weight > this.params.maxLiftWeight) {
      events.tooHeavy.push(hit);
      this.state = "reeling";
    } else if (this.carried.length > 0 && !hit.small) {
      // Double Hook: already carrying a small item, a bigger one just stops the hook.
      this.state = "reeling";
    } else {
      this.grab(hit, events);
    }
  }

  private grab(item: T, events: HookEvents<T>): void {
    this.carried.push(item);
    events.grabbed.push(item);
    // Keep going only while carrying small items and there is room for more.
    const canTakeMore = item.small && this.carried.length < this.params.capacity;
    if (!canTakeMore) this.state = "reeling";
  }

  private isOutOfBounds(): boolean {
    const x = this.tipX;
    const y = this.tipY;
    return x < 0 || x > this.bounds.width || y > this.bounds.height;
  }

  /** Carried items hang past the tip along the rope direction, one after another. */
  private positionCarried(): void {
    const dx = Math.sin(this.angle);
    const dy = Math.cos(this.angle);
    let offset = 0;
    for (const item of this.carried) {
      offset += item.radius;
      item.x = this.tipX + dx * offset;
      item.y = this.tipY + dy * offset;
      offset += item.radius;
    }
  }
}
