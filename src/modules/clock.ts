import type { ClockStyle } from "../types";
import { prefs, savePrefs } from "./state";

const ANALOG_SIZE = 140;
let widget: HTMLElement | null = null;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function drawAnalog(ctx: CanvasRenderingContext2D): void {
  const s = ANALOG_SIZE;
  const cx = s / 2;
  const cy = s / 2;
  const r = s / 2 - 8;
  const now = new Date();

  ctx.clearRect(0, 0, s, s);
  const fg = cssVar("--fg");
  const fg2 = cssVar("--fg2");
  const fg3 = cssVar("--fg3");

  ctx.strokeStyle = fg2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI / 6) - Math.PI / 2;
    const inner = r - (i % 3 === 0 ? 12 : 8);
    ctx.strokeStyle = i % 3 === 0 ? fg : fg3;
    ctx.lineWidth = i % 3 === 0 ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
    ctx.lineTo(cx + (r - 3) * Math.cos(a), cy + (r - 3) * Math.sin(a));
    ctx.stroke();
  }

  const h = now.getHours() % 12;
  const m = now.getMinutes();
  const sec = now.getSeconds();

  ctx.lineCap = "butt";

  // hour
  const hA = ((h + m / 60) * Math.PI / 6) - Math.PI / 2;
  ctx.strokeStyle = fg;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.45 * Math.cos(hA), cy + r * 0.45 * Math.sin(hA));
  ctx.stroke();

  // minute
  const mA = ((m + sec / 60) * Math.PI / 30) - Math.PI / 2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.65 * Math.cos(mA), cy + r * 0.65 * Math.sin(mA));
  ctx.stroke();

  // second
  const sA = (sec * Math.PI / 30) - Math.PI / 2;
  ctx.strokeStyle = fg3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + r * 0.78 * Math.cos(sA), cy + r * 0.78 * Math.sin(sA));
  ctx.stroke();

  // center dot
  ctx.fillStyle = fg;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
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
    canvas.width = ANALOG_SIZE;
    canvas.height = ANALOG_SIZE;
    widget.appendChild(canvas);
  } else {
    const time = document.createElement("span");
    time.className = "clock-time";
    time.id = "clockTimeEl";
    widget.appendChild(time);
  }

  const date = document.createElement("span");
  date.className = "clock-date";
  date.id = "clockDateEl";
  widget.appendChild(date);
}

function positionWidget(): void {
  if (!widget) return;
  if (prefs.clockX < 0) {
    widget.style.left = "50%";
    widget.style.top = prefs.clockY + "px";
    widget.style.transform = "translateX(-50%)";
  } else {
    widget.style.left = prefs.clockX + "px";
    widget.style.top = prefs.clockY + "px";
    widget.style.transform = "";
  }
}

function attachDrag(): void {
  if (!widget) return;
  let dragging = false;
  let ox = 0, oy = 0;

  widget.addEventListener("pointerdown", e => {
    if ((e.target as HTMLElement).tagName === "CANVAS" ||
        (e.target as HTMLElement).classList.contains("clock-time") ||
        (e.target as HTMLElement).classList.contains("clock-date") ||
        e.target === widget) {
      dragging = true;
      const rect = widget!.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      widget!.style.transform = "";
      widget!.classList.add("clock-dragging");
      widget!.setPointerCapture(e.pointerId);
    }
  });

  widget.addEventListener("pointermove", e => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - 80, e.clientX - ox));
    const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - oy));
    widget!.style.left = x + "px";
    widget!.style.top = y + "px";
    prefs.clockX = x;
    prefs.clockY = y;
  });

  widget.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    widget!.classList.remove("clock-dragging");
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
    const dateEl = document.getElementById("clockDateEl");
    if (dateEl) dateEl.textContent =
      `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  tick();
  setInterval(tick, 1000);
}
