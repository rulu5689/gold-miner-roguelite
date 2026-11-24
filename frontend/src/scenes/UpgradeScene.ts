import Phaser from "phaser";
import type { GameApi } from "../api/game";
import type { RunState, Upgrade } from "../game/types";

const CARD_W = 260;
const CARD_H = 200;
const GAP = 30;

/** After passing a level: pick 1 of the upgrades the backend offered. */
export class UpgradeScene extends Phaser.Scene {
  private choosing = false;

  constructor() {
    super("UpgradeScene");
  }

  create(run: RunState): void {
    this.choosing = false;
    const { width, height } = this.scale;
    const api = this.registry.get("api") as GameApi;

    this.add
      .text(width / 2, 60, "Choose an upgrade", { fontFamily: "Georgia, serif", fontSize: "40px", color: "#ffd34d" })
      .setOrigin(0.5);
    this.add
      .text(width / 2, 105, `Next: Level ${run.level}  ·  Target $${run.target}`, { fontFamily: "monospace", fontSize: "18px", color: "#e8e0d0" })
      .setOrigin(0.5);

    const choices = run.upgrade_choices;
    const totalW = choices.length * CARD_W + (choices.length - 1) * GAP;
    const choose = async (upgrade: Upgrade) => {
      if (this.choosing) return;
      this.choosing = true;
      try {
        this.scene.start("GameScene", await api.chooseUpgrade(run.run_id, upgrade.id));
      } catch {
        this.choosing = false;
        this.add
          .text(width / 2, height - 40, "Could not reach the backend. Try again.", { fontFamily: "monospace", fontSize: "18px", color: "#ff6b6b" })
          .setOrigin(0.5);
      }
    };

    choices.forEach((upgrade, i) => {
      const x = (width - totalW) / 2 + i * (CARD_W + GAP) + CARD_W / 2;
      this.drawCard(x, height / 2 + 40, i + 1, upgrade, run.upgrades[upgrade.id] ?? 0, () => void choose(upgrade));
    });

    const keys = ["ONE", "TWO", "THREE"];
    choices.forEach((upgrade, i) => this.input.keyboard?.once(`keydown-${keys[i]}`, () => void choose(upgrade)));

    this.add
      .text(width / 2, height - 40, "Click a card or press 1 / 2 / 3", { fontFamily: "monospace", fontSize: "16px", color: "#a89a80" })
      .setOrigin(0.5);
  }

  private drawCard(x: number, y: number, key: number, upgrade: Upgrade, owned: number, onPick: () => void): void {
    const card = this.add
      .rectangle(x, y, CARD_W, CARD_H, 0x3d2a14)
      .setStrokeStyle(3, 0x8b6b3a)
      .setInteractive({ useHandCursor: true });
    card.on("pointerover", () => card.setStrokeStyle(3, 0xffd34d).setFillStyle(0x4a3419));
    card.on("pointerout", () => card.setStrokeStyle(3, 0x8b6b3a).setFillStyle(0x3d2a14));
    card.on("pointerdown", onPick);

    const top = y - CARD_H / 2;
    this.add.text(x - CARD_W / 2 + 12, top + 10, `${key}`, { fontFamily: "monospace", fontSize: "16px", color: "#a89a80" });
    this.add.text(x, top + 45, upgrade.name, { fontFamily: "Georgia, serif", fontSize: "26px", color: "#ffd34d" }).setOrigin(0.5);
    this.add
      .text(x, top + 105, upgrade.description, {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#e8e0d0",
        align: "center",
        wordWrap: { width: CARD_W - 30 },
      })
      .setOrigin(0.5);
    const level = upgrade.max_stacks === 1 ? "New" : owned === 0 ? `New · max ${upgrade.max_stacks}` : `Lv ${owned} → ${owned + 1} / ${upgrade.max_stacks}`;
    this.add.text(x, top + CARD_H - 25, level, { fontFamily: "monospace", fontSize: "15px", color: "#8fd18f" }).setOrigin(0.5);
  }
}
