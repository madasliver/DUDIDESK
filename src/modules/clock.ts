import type { ClockStyle } from "../types";
import { prefs, savePrefs } from "./state";

const CANVAS_SIZE = 140;
let widget: HTMLElement | null = null;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// pixel-style line: draw a filled rect instead of a stroked line
function pixelLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number, w: number,
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.ceil(len / w);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x1 + dx * t);
    const y = Math.round(y1 + dy * t);
    ctx.fillRect(x - Math.floor(w / 2), y - Math.floor(w / 2), w, w);
  }
}

function drawAnalog(ctx: CanvasRenderingContext2D): void {
  const s = CANVAS_SIZE;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2 - 10;
  const now = new Date();

  ctx.clearRect(0, 0, s, s);
  ctx.imageSmoothingEnabled = false;

  const fg = cssVar("--fg");
  const fg2 = cssVar("--fg2");
  const fg3 = cssVar("--fg3");
  const bg = cssVar("--bg");

  // outer ring — pixelated square blocks around circle
  ctx.fillStyle = fg2;
  for (let a = 0; a < 360; a += 3) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(cx + r * Math.cos(rad));
    const y = Math.round(cy + r * Math.sin(rad));
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }

  // inner fill
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 3, 0, Math.PI * 2);
  ctx.fill();

  // hour markers — chunky pixel blocks
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI / 6) - Math.PI / 2;
    const big = i % 3 === 0;
    const inner = r - (big ? 16 : 10);
    const outer = r - 4;
    ctx.fillStyle = big ? fg : fg3;
    pixelLine(ctx,
      Math.round(cx + inner * Math.cos(a)), Math.round(cy + inner * Math.sin(a)),
      Math.round(cx + outer * Math.cos(a)), Math.round(cy + outer * Math.sin(a)),
      big ? 3 : 2,
    );
  }

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const sec = now.getSeconds();

  // hour hand — thick pixels
  const hA = ((h + m / 60) * Math.PI / 6) - Math.PI / 2;
  ctx.fillStyle = fg;
  pixelLine(ctx, cx, cy,
    Math.round(cx + r * 0.42 * Math.cos(hA)),
    Math.round(cy + r * 0.42 * Math.sin(hA)), 4);

  // minute hand
  const mA = ((m + sec / 60) * Math.PI / 30) - Math.PI / 2;
  ctx.fillStyle = fg;
  pixelLine(ctx, cx, cy,
    Math.round(cx + r * 0.62 * Math.cos(mA)),
    Math.round(cy + r * 0.62 * Math.sin(mA)), 3);

  // second hand — thin pixel line
  const sA = (sec * Math.PI / 30) - Math.PI / 2;
  ctx.fillStyle = fg3;
  pixelLine(ctx, cx, cy,
    Math.round(cx + r * 0.75 * Math.cos(sA)),
    Math.round(cy + r * 0.75 * Math.sin(sA)), 2);

  // center dot
  ctx.fillStyle = fg;
  ctx.fillRect(cx - 3, cy - 3, 6, 6);
}

function buildWidget(): HTMLElement {
  const el = document.createElement("div");
  el.id = "clockWidget";
  document.body.appendChild(el);
  return el;
}

function renderContent(style: ClockStyle): void {
  if (!widget) return;
  widget.innerHTML = "";

  if (style === "analog") {
    const canvas = document.createElement("canvas");
    canvas.className = "clock-canvas";
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    widget.appendChild(canvas);
  } else {
    const time = document.createElement("span");
    time.className = "clock-time";
    time.id = "clockTimeEl";
    widget.appendChild(time);
  }
}

function positionWidget(): void {
  if (!widget) return;
  if (prefs.clockX < 0) {
    requestAnimationFrame(() => {
      if (!widget) return;
      const w = widget.offsetWidth;
      widget.style.left = Math.round((window.innerWidth - w) / 2) + "px";
      widget.style.top = prefs.clockY + "px";
    });
  } else {
    widget.style.left = prefs.clockX + "px";
    widget.style.top = prefs.clockY + "px";
  }
}

const PROTECTED = [".icon-panel", ".tab-bar", ".search-panel", ".wordmark", ".icon-panel-wrap"];

function overlapsProtected(x: number, y: number, w: number, h: number): boolean {
  for (const sel of PROTECTED) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (x + w > r.left && x < r.right && y + h > r.top && y < r.bottom) return true;
  }
  return false;
}

function attachDrag(): void {
  if (!widget) return;
  let dragging = false;
  let ox = 0, oy = 0;
  let prevX = 0, prevY = 0;

  widget.addEventListener("dblclick", () => {
    prefs.clockX = -1;
    prefs.clockY = 12;
    positionWidget();
    savePrefs();
  });

  widget.addEventListener("pointerdown", e => {
    dragging = true;
    const rect = widget!.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    prevX = rect.left;
    prevY = rect.top;
    widget!.classList.add("clock-dragging");
    widget!.setPointerCapture(e.pointerId);
  });

  widget.addEventListener("pointermove", e => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 60, e.clientX - ox));
    const y = Math.max(0, Math.min(window.innerHeight - 30, e.clientY - oy));
    widget!.style.left = x + "px";
    widget!.style.top = y + "px";
    prefs.clockX = x;
    prefs.clockY = y;
  });

  widget.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    widget!.classList.remove("clock-dragging");
    const rect = widget!.getBoundingClientRect();
    if (overlapsProtected(rect.left, rect.top, rect.width, rect.height)) {
      widget!.style.left = prevX + "px";
      widget!.style.top = prevY + "px";
      prefs.clockX = prevX;
      prefs.clockY = prevY;
    }
    savePrefs();
  });
}

export function applyClockStyle(style: ClockStyle): void {
  renderContent(style);
}

export function initClock(): void {
  widget = buildWidget();
  renderContent(prefs.clockStyle);
  positionWidget();
  attachDrag();

  function tick(): void {
    const now = new Date();
    if (prefs.clockStyle === "analog") {
      const canvas = widget?.querySelector<HTMLCanvasElement>(".clock-canvas");
      const ctx = canvas?.getContext("2d");
      if (ctx) drawAnalog(ctx);
    } else {
      const timeEl = document.getElementById("clockTimeEl");
      if (timeEl) timeEl.textContent =
        `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    }
    // date stays in topbar
    const dateEl = document.getElementById("clockDate");
    if (dateEl) dateEl.textContent =
      `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  tick();
  setInterval(tick, 1000);
}
