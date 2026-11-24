import Phaser from "phaser";
import { targetForLevel } from "../game/rules";
import type { RunState } from "../game/runState";

interface LevelEndData {
  run: RunState;
  passed: boolean;
}

export class LevelEndScene extends Phaser.Scene {
  constructor() {
    super("LevelEndScene");
  }

  create({ run, passed }: LevelEndData): void {
    const { width, height } = this.scale;
    const target = targetForLevel(run.level);

    this.add
      .text(width / 2, height / 2 - 70, passed ? `Level ${run.level} complete!` : "Game Over", {
        fontFamily: "Georgia, serif",
        fontSize: "44px",
        color: passed ? "#ffd34d" : "#ff6b6b",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, `Money $${run.money}   /   Target $${target}`, {
        fontFamily: "monospace",
        fontSize: "22px",
        color: "#e8e0d0",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height / 2 + 70, passed ? "Press SPACE or click for the next level" : "Press SPACE or click to try again", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });

    let done = false;
    const next = () => {
      if (done) return;
      done = true;
      if (passed) this.scene.start("GameScene", { ...run, level: run.level + 1 });
      else this.scene.start("BootScene");
    };
    // Short delay so a key held at the end of the level doesn't skip this screen.
    this.time.delayedCall(400, () => {
      this.input.keyboard?.once("keydown-SPACE", next);
      this.input.once("pointerdown", next);
    });
  }
}
