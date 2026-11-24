import Phaser from "phaser";
import { checkBackendHealth } from "../api/health";
import { API_BASE_URL } from "../config";
import { backendStatusLabel } from "../ui/statusText";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2 - 60, "Gold Miner Roguelite", {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        color: "#ffd34d",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 10, "Frontend running", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#e8e0d0",
      })
      .setOrigin(0.5);

    const backendText = this.add
      .text(width / 2, height / 2 + 45, backendStatusLabel("checking"), {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#a0a0a0",
      })
      .setOrigin(0.5);

    void checkBackendHealth(API_BASE_URL).then((status) => {
      backendText.setText(backendStatusLabel(status));
      backendText.setColor(status === "connected" ? "#6fdc6f" : "#ff6b6b");
    });
  }
}
