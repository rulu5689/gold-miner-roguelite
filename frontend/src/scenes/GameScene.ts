import Phaser from "phaser";
import { drawMineral } from "../components/drawMineral";
import { drawMiner } from "../components/drawMiner";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { Hook } from "../entities/Hook";
import { DEFAULT_HOOK_PARAMS } from "../game/hookParams";
import { FIELD_AREA, GROUND_Y, HOOK_ORIGIN } from "../game/layout";
import { generateLevel } from "../game/levelGenerator";
import { LEVEL_DURATION_SECONDS, targetForLevel } from "../game/rules";
import { levelSeed, type RunState } from "../game/runState";
import type { FieldItem, Mineral } from "../game/types";

/** Longest frame we simulate in one go (avoids huge jumps after a tab switch). */
const MAX_FRAME_SECONDS = 0.1;

export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private hook!: Hook<FieldItem>;
  private field: FieldItem[] = [];
  private sprites = new Map<number, Phaser.GameObjects.Container>();
  private hookGraphics!: Phaser.GameObjects.Graphics;
  private hud!: { money: Phaser.GameObjects.Text; target: Phaser.GameObjects.Text; level: Phaser.GameObjects.Text; time: Phaser.GameObjects.Text };
  private timeLeft = LEVEL_DURATION_SECONDS;
  private ended = false;

  constructor() {
    super("GameScene");
  }

  init(run: RunState): void {
    this.run = { ...run };
    this.field = [];
    this.sprites.clear();
    this.timeLeft = LEVEL_DURATION_SECONDS;
    this.ended = false;
  }

  create(): void {
    const minerals = this.registry.get("minerals") as Mineral[];
    const byId = new Map(minerals.map((m) => [m.id, m]));

    // Sky and dirt
    this.add.rectangle(0, 0, GAME_WIDTH, GROUND_Y, 0x7fa7c9).setOrigin(0);
    this.add.rectangle(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y, 0x5a3d22).setOrigin(0);
    this.add.rectangle(0, GROUND_Y, GAME_WIDTH, 4, 0x3b2410).setOrigin(0);
    drawMiner(this, HOOK_ORIGIN.x, GROUND_Y);

    this.field = generateLevel(levelSeed(this.run), this.run.level, minerals, FIELD_AREA);
    for (const item of this.field) {
      const sprite = drawMineral(this, byId.get(item.mineralId)!).setPosition(item.x, item.y);
      this.sprites.set(item.id, sprite);
    }

    this.hook = new Hook<FieldItem>(HOOK_ORIGIN.x, HOOK_ORIGIN.y, { ...DEFAULT_HOOK_PARAMS }, { width: GAME_WIDTH, height: GAME_HEIGHT });
    this.hookGraphics = this.add.graphics().setDepth(10);

    const style = { fontFamily: "monospace", fontSize: "20px", color: "#1d1a14" };
    this.hud = {
      money: this.add.text(16, 12, "", style),
      target: this.add.text(16, 40, "", style),
      level: this.add.text(GAME_WIDTH - 16, 12, "", style).setOrigin(1, 0),
      time: this.add.text(GAME_WIDTH - 16, 40, "", style).setOrigin(1, 0),
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

    const { grabbed, delivered } = this.hook.update(dt, this.field);
    if (grabbed.length > 0) this.field = this.field.filter((item) => !grabbed.includes(item));
    for (const item of this.hook.carried) this.sprites.get(item.id)?.setPosition(item.x, item.y);
    for (const item of delivered) this.collect(item);

    this.updateHud();
    this.drawHook();
  }

  private collect(item: FieldItem): void {
    this.run.money += item.value;
    this.sprites.get(item.id)?.destroy();
    this.sprites.delete(item.id);
    const popup = this.add
      .text(HOOK_ORIGIN.x + 40, GROUND_Y - 40, `+$${item.value}`, { fontFamily: "monospace", fontSize: "24px", color: "#2e7d32", fontStyle: "bold" })
      .setOrigin(0, 0.5)
      .setDepth(20);
    this.tweens.add({ targets: popup, y: popup.y - 30, alpha: 0, duration: 900, onComplete: () => popup.destroy() });
  }

  private endLevel(): void {
    this.ended = true;
    const passed = this.run.money >= targetForLevel(this.run.level);
    this.updateHud();
    this.scene.start("LevelEndScene", { run: this.run, passed });
  }

  private updateHud(): void {
    this.hud.money.setText(`Money  $${this.run.money}`);
    this.hud.target.setText(`Target $${targetForLevel(this.run.level)}`);
    this.hud.level.setText(`Level ${this.run.level}`);
    this.hud.time.setText(`Time ${Math.ceil(this.timeLeft)}`).setColor(this.timeLeft <= 10 ? "#b71c1c" : "#1d1a14");
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
  }
}
