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

    case "bag":
      g.fillStyle(color).fillCircle(0, 3, r);
      g.fillStyle(dark).fillTriangle(-r * 0.45, -r * 0.6, r * 0.45, -r * 0.6, 0, -r * 0.1);
      g.lineStyle(2, dark).strokeCircle(0, 3, r);
      container.add(
        scene.add.text(0, 4, "?", { fontFamily: "Georgia, serif", fontSize: `${Math.round(r * 1.1)}px`, color: "#fff3d6" }).setOrigin(0.5),
      );
      break;

    default:
      g.fillStyle(color).fillCircle(0, 0, r);
      g.lineStyle(2, dark).strokeCircle(0, 0, r);
      if (mineral.id.startsWith("gold")) g.fillStyle(0xffffff, 0.45).fillCircle(-r * 0.35, -r * 0.35, r * 0.22);
  }
  return container;
}
