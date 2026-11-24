import Phaser from "phaser";
import type { GameApi } from "../api/game";
import { drawMineral } from "../components/drawMineral";
import { drawMiner } from "../components/drawMiner";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { Hook } from "../entities/Hook";
import { applyModifiers, DEFAULT_HOOK_PARAMS } from "../game/hookParams";
import { GROUND_Y, HOOK_ORIGIN } from "../game/layout";
import type { FieldItem, Mineral, RunState, Upgrade } from "../game/types";

/** A field item plus the flags the hook needs. */
type HookItem = FieldItem & { small: boolean; magnetic: boolean };

/** Longest frame we simulate in one go (avoids huge jumps after a tab switch). */
const MAX_FRAME_SECONDS = 0.1;

/**
 * Plays one level. The frontend handles the hook, collisions and drawing;
 * every rule decision (money, explosions, level result) comes from the backend.
 */
export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private api!: GameApi;
  private minerals!: Map<string, Mineral>;
  private hook!: Hook<HookItem>;
  private field: HookItem[] = [];
  private sprites = new Map<number, Phaser.GameObjects.Container>();
  private hookGraphics!: Phaser.GameObjects.Graphics;
  private hud!: {
    money: Phaser.GameObjects.Text;
    target: Phaser.GameObjects.Text;
    level: Phaser.GameObjects.Text;
    time: Phaser.GameObjects.Text;
    crit: Phaser.GameObjects.Text;
    upgrades: Phaser.GameObjects.Text;
  };
  private timeLeft = 0;
  private ended = false;
  /** Backend calls run one after another, so "finish level" always comes after the last collect. */
  private requests: Promise<unknown> = Promise.resolve();

  constructor() {
    super("GameScene");
  }

  init(run: RunState): void {
    this.run = structuredClone(run);
    this.field = [];
    this.sprites.clear();
    this.timeLeft = run.time_limit;
    this.ended = false;
    this.requests = Promise.resolve();
  }

  create(): void {
    this.api = this.registry.get("api") as GameApi;
    this.minerals = new Map((this.registry.get("minerals") as Mineral[]).map((m) => [m.id, m]));
    this.field = this.run.items.map((item) => {
      const m = this.mineral(item);
      return { ...item, small: m.size === "small", magnetic: m.size === "small" && m.category === "gold" };
    });

    // Sky and dirt
    this.add.rectangle(0, 0, GAME_WIDTH, GROUND_Y, 0x7fa7c9).setOrigin(0);
    this.add.rectangle(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y, 0x5a3d22).setOrigin(0);
    this.add.rectangle(0, GROUND_Y, GAME_WIDTH, 4, 0x3b2410).setOrigin(0);
    drawMiner(this, HOOK_ORIGIN.x, GROUND_Y);

    for (const item of this.field) {
      this.sprites.set(item.id, drawMineral(this, this.mineral(item)).setPosition(item.x, item.y));
    }

    const params = applyModifiers(DEFAULT_HOOK_PARAMS, this.run.hook);
    this.hook = new Hook<HookItem>(HOOK_ORIGIN.x, HOOK_ORIGIN.y, params, { width: GAME_WIDTH, height: GAME_HEIGHT });
    this.hookGraphics = this.add.graphics().setDepth(10);

    const style = { fontFamily: "monospace", fontSize: "20px", color: "#1d1a14" };
    this.hud = {
      money: this.add.text(16, 12, "", style),
      target: this.add.text(16, 40, "", style),
      level: this.add.text(GAME_WIDTH - 16, 12, "", style).setOrigin(1, 0),
      time: this.add.text(GAME_WIDTH - 16, 40, "", style).setOrigin(1, 0),
      crit: this.add.text(GAME_WIDTH - 16, 68, "", { ...style, fontSize: "16px", color: "#8e0038" }).setOrigin(1, 0),
      upgrades: this.add.text(16, GAME_HEIGHT - 10, this.upgradeSummary(), { ...style, fontSize: "14px", color: "#e8d9b8" }).setOrigin(0, 1),
    };

    const fire = () => this.hook.fire();
    this.input.keyboard?.on("keydown-SPACE", fire);
    this.input.keyboard?.on("keydown-DOWN", fire);
    this.input.on("pointerdown", fire);

    this.updateHud();
    this.drawHook();
  }

  update(_time: number, deltaMs: number): void {
    if (this.ended) return;
    const dt = Math.min(deltaMs / 1000, MAX_FRAME_SECONDS);

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.endLevel();
      return;
    }

    const { grabbed, delivered, tooHeavy } = this.hook.update(dt, this.field);
    if (tooHeavy.length > 0) this.popup("Too heavy!", "#b71c1c", this.hook.tipX, this.hook.tipY - 20);
    if (grabbed.length > 0) {
      this.field = this.field.filter((item) => !grabbed.includes(item));
      for (const item of grabbed) {
        if (this.mineral(item).category === "explosive") this.detonate(item);
      }
    }
    for (const item of this.hook.carried) this.sprites.get(item.id)?.setPosition(item.x, item.y);
    for (const item of delivered) this.collect(item);

    this.updateHud();
    this.drawHook();
  }

  private mineral(item: FieldItem): Mineral {
    return this.minerals.get(item.mineral_id)!;
  }

  private send<T>(call: () => Promise<T>): Promise<T> {
    const next = this.requests.then(call);
    this.requests = next.catch(() => undefined);
    next.catch(() => this.showError());
    return next;
  }

  private collect(item: FieldItem): void {
    this.removeSprite(item.id);
    void this.send(() => this.api.collect(this.run.run_id, item.id)).then((res) => {
      this.run.money = res.money;
      this.run.crit_chance = res.crit_chance;
      if (res.critical) this.popup(`CRITICAL x2!  +$${res.value}`, "#c2185b");
      else this.popup(`+$${res.value}`, "#2e7d32");
    });
  }

  private detonate(barrel: FieldItem): void {
    this.hook.dropAll();
    this.removeSprite(barrel.id);
    const radius = this.mineral(barrel).explosion_radius ?? 0;
    const blast = this.add.circle(barrel.x, barrel.y, radius, 0xff8c1a, 0.7).setDepth(15).setScale(0.2);
    this.tweens.add({ targets: blast, scale: 1, alpha: 0, duration: 450, onComplete: () => blast.destroy() });
    this.cameras.main.shake(200, 0.006);

    void this.send(() => this.api.explode(this.run.run_id, barrel.id)).then(({ destroyed_ids }) => {
      this.field = this.field.filter((item) => !destroyed_ids.includes(item.id));
      destroyed_ids.forEach((id) => this.removeSprite(id));
    });
  }

  private endLevel(): void {
    this.ended = true;
    this.updateHud();
    void this.send(() => this.api.finishLevel(this.run.run_id)).then((result) => this.scene.start("LevelEndScene", result));
  }

  private removeSprite(id: number): void {
    this.sprites.get(id)?.destroy();
    this.sprites.delete(id);
  }

  private popup(text: string, color: string, x = HOOK_ORIGIN.x + 40, y = GROUND_Y - 40): void {
    const label = this.add
      .text(x, y, text, { fontFamily: "monospace", fontSize: "24px", color, fontStyle: "bold" })
      .setOrigin(0, 0.5)
      .setDepth(20);
    this.tweens.add({ targets: label, y: label.y - 30, alpha: 0, duration: 900, onComplete: () => label.destroy() });
  }

  private showError(): void {
    this.ended = true;
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "Lost connection to the backend.\nRestart it and refresh the page.", {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#ffffff",
        backgroundColor: "#b71c1c",
        align: "center",
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(30);
  }

  private updateHud(): void {
    this.hud.money.setText(`Money  $${this.run.money}`);
    this.hud.target.setText(`Target $${this.run.target}`);
    this.hud.level.setText(`Level ${this.run.level}`);
    this.hud.time.setText(`Time ${Math.ceil(this.timeLeft)}`).setColor(this.timeLeft <= 10 ? "#b71c1c" : "#1d1a14");
    this.hud.crit.setText(this.run.crit_chance > 0 ? `Crit ${Math.round(this.run.crit_chance * 100)}%` : "");
  }

  private upgradeSummary(): string {
    const all = (this.registry.get("upgrades") as Upgrade[] | undefined) ?? [];
    const names = new Map(all.map((u) => [u.id, u.name]));
    const owned = Object.entries(this.run.upgrades).map(([id, n]) => `${names.get(id) ?? id}${n > 1 ? ` x${n}` : ""}`);
    return owned.length ? `Upgrades: ${owned.join(" · ")}` : "";
  }

  private drawHook(): void {
    const g = this.hookGraphics.clear();
    const { originX, originY, tipX, tipY, angle } = this.hook;
    g.lineStyle(2, 0x2a1d10).lineBetween(originX, originY, tipX, tipY);

    // Claw: two prongs opening around the rope direction
    const prong = 14;
    const spread = 0.6;
    g.lineStyle(4, 0x9e9e9e);
    for (const side of [-1, 1]) {
      const a = angle + side * spread;
      g.lineBetween(tipX, tipY, tipX + Math.sin(a) * prong, tipY + Math.cos(a) * prong);
    }
    g.fillStyle(0x616161).fillCircle(tipX, tipY, 4);

    // Magnetic Hook: show the pull range while the hook is out.
    if (this.hook.params.magnetRadius > 0 && this.hook.state === "shooting") {
      g.lineStyle(1, 0x64b5f6, 0.6).strokeCircle(tipX, tipY, this.hook.params.magnetRadius);
    }
  }
}
