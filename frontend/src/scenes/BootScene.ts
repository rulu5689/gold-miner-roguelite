import Phaser from "phaser";
import { fetchMinerals } from "../api/content";
import { checkBackendHealth } from "../api/health";
import { API_BASE_URL } from "../config";
import { newRun } from "../game/runState";
import { backendStatusLabel } from "../ui/statusText";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 80, "Gold Miner Roguelite", {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        color: "#ffd34d",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 - 10, "Frontend running", { fontFamily: "monospace", fontSize: "20px", color: "#e8e0d0" })
      .setOrigin(0.5);

    const backendText = this.add
      .text(width / 2, height / 2 + 25, backendStatusLabel("checking"), {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#a0a0a0",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height / 2 + 95, "", { fontFamily: "monospace", fontSize: "22px", color: "#ffffff" })
      .setOrigin(0.5);

    void this.connect(backendText, prompt);
  }

  private async connect(backendText: Phaser.GameObjects.Text, prompt: Phaser.GameObjects.Text): Promise<void> {
    const status = await checkBackendHealth(API_BASE_URL);
    backendText.setText(backendStatusLabel(status));
    backendText.setColor(status === "connected" ? "#6fdc6f" : "#ff6b6b");
    if (status !== "connected") {
      prompt.setText("Start the backend, then refresh this page").setColor("#ff6b6b");
      return;
    }

    try {
      this.registry.set("minerals", await fetchMinerals(API_BASE_URL));
    } catch {
      prompt.setText("Could not load game data from the backend").setColor("#ff6b6b");
      return;
    }

    prompt.setText("Press SPACE or click to start");
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 700, yoyo: true, repeat: -1 });
    const start = () => this.scene.start("GameScene", newRun());
    this.input.keyboard?.once("keydown-SPACE", start);
    this.input.once("pointerdown", start);
  }
}
