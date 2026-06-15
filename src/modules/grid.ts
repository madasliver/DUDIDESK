import type { CellPos, Item } from "../types";
import { loadShortcuts } from "./state";
import { getActiveTab, itemsInTab } from "./tabs";

export const COLS = 10;
const MIN_ROWS = 4;

function getCSVar(name: string): number {
  return parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(name)
  ) || 0;
}

export function cellSize(): number { return getCSVar("--cell") || 80; }
export function iconSize(): number { return getCSVar("--icon-size") || 66; }

/** Returns the top-left pixel position of the icon for a given cell.
 *  .sc-item width = --cell with flex-center, so we just return cell origin. */
export function cellToXY(col: number, row: number): { x: number; y: number } {
  const cs = cellSize();
  return { x: col * cs, y: row * cs };
}

/** Snap raw pixel coords (already relative to .icon-grid content box) to a cell. */
export function snapToCell(px: number, py: number): CellPos {
  const cs = cellSize();
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor(px / cs))),
    row: Math.max(0, Math.floor(py / cs)),
  };
}

export function freeCell(list: Item[]): CellPos {
  const occupied = new Set(list.map(i => `${i.col},${i.row}`));
  for (let r = 0; r < 50; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!occupied.has(`${c},${r}`)) return { col: c, row: r };
    }
  }
  return { col: 0, row: list.length };
}

export function panelRows(): number {
  const list = itemsInTab(loadShortcuts(), getActiveTab());
  const maxRow = list.reduce((m, i) => Math.max(m, i.row), 0);
  return Math.max(MIN_ROWS, maxRow + 2);
}

export function resizePanel(): void {
  const cs = cellSize();
  const panel = document.getElementById("iconPanel");
  if (!panel) return;
  panel.style.width = COLS * cs + "px";
  panel.style.height = panelRows() * cs + "px";
}
