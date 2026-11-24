import Phaser from "phaser";

/** Static miner + winch, drawn with the winch centred on (x, y). */
export function drawMiner(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics();
  // Winch frame and drum
  g.fillStyle(0x5b3a1e).fillRect(x - 22, y - 12, 44, 14);
  g.fillStyle(0x8b5a2b).fillCircle(x, y - 12, 10);
  g.lineStyle(2, 0x3b2410).strokeCircle(x, y - 12, 10);
  // Miner standing to the left of the winch
  const mx = x - 46;
  g.fillStyle(0x2f5d8a).fillRect(mx - 9, y - 30, 18, 26); // body
  g.fillStyle(0x3b2a1a).fillRect(mx - 9, y - 6, 7, 10).fillRect(mx + 2, y - 6, 7, 10); // legs
  g.fillStyle(0xf1c27d).fillCircle(mx, y - 40, 9); // head
  g.fillStyle(0xffd34d).fillRect(mx - 11, y - 50, 22, 6).fillRect(mx - 7, y - 54, 14, 5); // helmet
  g.lineStyle(4, 0xf1c27d).lineBetween(mx + 8, y - 24, x - 8, y - 14); // arm on the crank
}
