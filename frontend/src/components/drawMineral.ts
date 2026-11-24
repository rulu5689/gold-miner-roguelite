import Phaser from "phaser";
import type { Mineral } from "../game/types";

const hex = (color: string): number => parseInt(color.slice(1), 16);

/** Builds a simple placeholder graphic for a mineral, centred on (0, 0). */
export function drawMineral(scene: Phaser.Scene, mineral: Mineral): Phaser.GameObjects.Container {
  const r = mineral.radius;
  const color = hex(mineral.color);
  const dark = Phaser.Display.Color.IntegerToColor(color).darken(30).color;
  const g = scene.add.graphics();
  const container = scene.add.container(0, 0, [g]);
  const label = (text: string, size: number, fill: string) =>
    container.add(scene.add.text(0, 0, text, { fontFamily: "monospace", fontSize: `${size}px`, color: fill, fontStyle: "bold" }).setOrigin(0.5));

  switch (mineral.shape) {
    case "diamond":
      g.fillStyle(color).lineStyle(2, 0xffffff, 0.9);
      g.beginPath();
      g.moveTo(0, -r * 1.3);
      g.lineTo(r, 0);
      g.lineTo(0, r * 1.3);
      g.lineTo(-r, 0);
      g.closePath();
      g.fillPath().strokePath();
      break;

    case "chest": {
      const w = r * 2.2;
      const h = r * 1.6;
      g.fillStyle(0x7a4a1c).fillRect(-w / 2, -h / 2, w, h); // wooden box
      g.fillStyle(color).fillRect(-w / 2, -h / 2, w, h * 0.35); // golden lid
      g.fillStyle(color).fillRect(-w / 2, -h / 2, w * 0.12, h).fillRect(w / 2 - w * 0.12, -h / 2, w * 0.12, h); // bands
      g.fillStyle(0xfff3b0).fillRect(-3, -h * 0.12, 6, 8); // lock
      g.lineStyle(2, dark).strokeRect(-w / 2, -h / 2, w, h);
      break;
    }

    case "barrel": {
      const w = r * 1.6;
      const h = r * 2;
      g.fillStyle(color).fillRoundedRect(-w / 2, -h / 2, w, h, 5);
      g.fillStyle(0x3b2410).fillRect(-w / 2, -h * 0.32, w, 3).fillRect(-w / 2, h * 0.28, w, 3);
      g.lineStyle(2, dark).strokeRoundedRect(-w / 2, -h / 2, w, h, 5);
      label("TNT", Math.round(r * 0.6), "#fff3d6");
      break;
    }

    default:
      g.fillStyle(color).fillCircle(0, 0, r);
      g.lineStyle(2, dark).strokeCircle(0, 0, r);
      if (mineral.category === "gold") g.fillStyle(0xffffff, 0.45).fillCircle(-r * 0.35, -r * 0.35, r * 0.22);
  }
  return container;
}
