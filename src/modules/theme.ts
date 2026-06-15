import type { ModeId, SizeId } from "../types";
import { THEMES } from "./themes";
import { SIZES } from "./sizes";
import { COLS, resizePanel } from "./grid";
import { applyBg } from "./background";
import { prefs } from "./state";

const PANEL_PAD = 50;
const VIEWPORT_MARGIN = 24;
const MIN_SCALE = 0.35;

export function applyTheme(mode: ModeId, size: SizeId): void {
  const t = THEMES[mode];
  const s = SIZES[size];
  const r = document.documentElement.style;

  r.setProperty("--bg", t.bg);
  r.setProperty("--bg2", t.bg2);
  r.setProperty("--fg", t.fg);
  r.setProperty("--fg2", t.fg2);
  r.setProperty("--fg3", t.fg3);
  r.setProperty("--border", t.border);

  r.setProperty("--search-size", s.search);
  r.setProperty("--search-pad", s.pad);
  r.setProperty("--word-size", s.word);
  r.setProperty("--search-w", s.sw);

  applyResponsiveScale(size);
  setTimeout(() => applyBg(prefs.bg), 30);
}

/** Shrinks cell/icon/label size + panel padding to fit narrow viewports. */
export function applyResponsiveScale(size: SizeId = prefs.size): void {
  const s = SIZES[size];
  const baseCell = parseInt(s.cell);
  const naturalWidth = COLS * baseCell + PANEL_PAD * 2;
  const avail = window.innerWidth - VIEWPORT_MARGIN;
  const scale = avail < naturalWidth ? Math.max(MIN_SCALE, avail / naturalWidth) : 1;

  const r = document.documentElement.style;
  r.setProperty("--cell", baseCell * scale + "px");
  r.setProperty("--icon-size", parseInt(s.icon) * scale + "px");
  r.setProperty("--icon-img", parseInt(s.img) * scale + "px");
  r.setProperty("--label-size", Math.max(5, parseFloat(s.label) * scale) + "px");
  r.setProperty("--panel-pad", PANEL_PAD * scale + "px");

  resizePanel();
}

export function applyTitle(title: string): void {
  const v = (title || "DUDI").toUpperCase();
  const titleEl = document.getElementById("wordmarkTitle")!;
  const prefixEl = document.getElementById("wordmarkPrefix")!;
  titleEl.textContent = v;
  prefixEl.style.display = v === "DUDI" ? "inline" : "none";
  document.title = v + "DESK";
}

export function applyPanelOpacity(val: number): void {
  const alpha = (val / 10) * 0.18; // 0 → invisible, 10 → 0.18 alpha
  const panel = document.querySelector(".icon-panel") as HTMLElement;
  if (!panel) return;
  panel.style.background = `rgba(255,255,255,${alpha})`;
  panel.style.borderColor =
    val === 0 ? "transparent" : `rgba(255,255,255,${alpha * 0.5 + 0.02})`;
}

export function setActiveBtn(rowId: string, key: string): void {
  const attr =
    rowId === "modeRow" ? "mode" :
    rowId === "sizeRow" ? "size" :
    "bg";
  document.querySelectorAll(`#${rowId} .tog-btn`).forEach(b => {
    const el = b as HTMLElement;
    el.classList.toggle("active", el.dataset[attr] === key);
  });
}
