import type { BgId } from "../types";

export function applyBg(type: BgId): void {
  const canvas = document.getElementById("bgCanvas") as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const W = (canvas.width = window.innerWidth);
  const H = (canvas.height = window.innerHeight);
  ctx.clearRect(0, 0, W, H);

  const fg =
    getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() ||
    "#e8e4d0";
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;

  if (type === "grid") {
    const S = 24;
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.18;
    for (let x = 0; x < W; x += S) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += S) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (type === "dots") {
    const S = 20;
    ctx.globalAlpha = 0.22;
    for (let x = S; x < W; x += S)
      for (let y = S; y < H; y += S) ctx.fillRect(x - 1, y - 1, 2, 2);
  } else if (type === "plus") {
    const S = 28;
    ctx.globalAlpha = 0.18;
    for (let x = S; x < W; x += S) {
      for (let y = S; y < H; y += S) {
        ctx.fillRect(x - 3, y - 1, 7, 3);
        ctx.fillRect(x - 1, y - 3, 3, 7);
      }
    }
  } else if (type === "aliens") {
    const sp = [
      [0,0,1,0,0,0,1,0],
      [0,0,0,1,1,1,0,0],
      [0,0,1,1,1,1,0,0],
      [0,1,1,0,0,1,1,0],
      [1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,0,1],
      [1,0,1,0,0,1,0,1],
      [0,0,0,1,1,0,0,0],
    ];
    const px = 2;
    const gap = 52;
    ctx.globalAlpha = 0.12;
    let row = 0;
    for (let y = gap / 2; y < H + gap; y += gap) {
      for (let x = row % 2 === 0 ? gap / 2 : gap; x < W + gap; x += gap) {
        sp.forEach((r, ri) =>
          r.forEach((c, ci) => {
            if (c) ctx.fillRect(Math.round(x + ci * px), Math.round(y + ri * px), px, px);
          })
        );
      }
      row++;
    }
  }
  ctx.globalAlpha = 1;
}
