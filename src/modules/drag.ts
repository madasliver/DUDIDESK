import type { Item, FolderItem, FolderEntry } from "../types";
import { loadShortcuts, saveShortcuts, favicon, tabOf } from "./state";
import { cellSize, snapToCell, freeCell } from "./grid";
import { render } from "./render";
import { openFolder } from "./folder";
import { itemsInTab } from "./tabs";

interface DragState {
  idx: number;
  el: HTMLElement;
  item: Item;
}

interface GhostSource {
  type?: string;
  name: string;
  url?: string;
  items?: FolderEntry[];
}

let dragging: DragState | null = null;
let folderTimer: number | null = null;
let folderTargetEl: HTMLElement | null = null;
let tabTargetEl: HTMLElement | null = null;
let didDrag = false;

const FOLDER_HOLD_MS = 500;
const LONG_PRESS_MS = 280;

function gCS(p: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(p).trim();
}

export function showGhost(item: GhostSource, x: number, y: number): void {
  const g = document.getElementById("dragGhost")!;
  const sz = gCS("--icon-size") || "66px";
  const im = gCS("--icon-img") || "32px";
  const fs = gCS("--label-size") || "7px";

  let inner = "";
  if (item.type === "folder") {
    inner = `<div style="width:${sz};height:${sz};border:3px solid var(--border);background:var(--bg2);
      display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3px;padding:6px;">
      ${(item.items || []).slice(0, 4).map(it =>
        `<img src="${favicon(it.url)}" style="width:100%;height:100%;object-fit:contain;">`
      ).join("")}
    </div>`;
  } else {
    inner = `<div style="width:${sz};height:${sz};border:3px solid var(--border);background:var(--bg2);
      display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img src="${favicon(item.url || "")}" style="width:${im};height:${im};object-fit:contain;">
    </div>`;
  }
  g.innerHTML = inner +
    `<span style="font-family:'Press Start 2P',monospace;font-size:${fs};color:var(--fg);text-transform:uppercase;">${item.name}</span>`;
  g.style.display = "flex";
  placeGhost(x, y);
}

export function placeGhost(x: number, y: number): void {
  const g = document.getElementById("dragGhost")!;
  const sz = parseInt(gCS("--icon-size")) || 66;
  g.style.left = x - sz / 2 + "px";
  g.style.top = y - sz / 2 + "px";
}

export function hideGhost(): void {
  const g = document.getElementById("dragGhost")!;
  g.style.display = "none";
  g.innerHTML = "";
}

function clearFolderTarget(): void {
  if (folderTargetEl) {
    folderTargetEl.classList.remove("drop-target");
    folderTargetEl = null;
  }
  if (folderTimer !== null) {
    clearTimeout(folderTimer);
    folderTimer = null;
  }
}

function getItemElAt(x: number, y: number, excludeEl: HTMLElement): HTMLElement | null {
  const g = document.getElementById("dragGhost")!;
  const prev = g.style.display;
  g.style.display = "none";
  const hits = document.elementsFromPoint(x, y);
  g.style.display = prev;
  for (const el of hits) {
    const t = (el as HTMLElement).closest<HTMLElement>(".sc-item[data-idx]");
    if (t && t !== excludeEl) return t;
  }
  return null;
}

/** Finds the (non-active) tab button under the cursor, if any. */
function getTabElAt(x: number, y: number): HTMLElement | null {
  const g = document.getElementById("dragGhost")!;
  const prev = g.style.display;
  g.style.display = "none";
  const hits = document.elementsFromPoint(x, y);
  g.style.display = prev;
  for (const el of hits) {
    const t = (el as HTMLElement).closest<HTMLElement>("#tabBar .tab-btn");
    if (t && !t.classList.contains("active")) return t;
  }
  return null;
}

function clearTabTarget(): void {
  if (tabTargetEl) {
    tabTargetEl.classList.remove("drop-target");
    tabTargetEl = null;
  }
}

function moveToTab(idx: number, targetTabId: string): void {
  const l = loadShortcuts();
  const item = l[idx];
  if (!item) return;
  const pos = freeCell(itemsInTab(l, targetTabId));
  item.tabId = targetTabId;
  item.col = pos.col;
  item.row = pos.row;
  saveShortcuts(l);
  render();
}

function mergeFolder(srcIdx: number, tgtIdx: number): void {
  hideGhost();
  if (dragging) {
    dragging.el.classList.remove("dragging");
    dragging = null;
  }
  const l = loadShortcuts();
  const src = l[srcIdx];
  const tgt = l[tgtIdx];
  if (!src || !tgt || src.type === "folder" || tgt.type === "folder") {
    render();
    return;
  }
  const pos = { col: tgt.col, row: tgt.row };
  const folder: FolderItem = {
    type: "folder",
    name: "FOLDER",
    color: "none",
    col: pos.col,
    row: pos.row,
    tabId: tabOf(tgt),
    items: [
      { name: tgt.name, url: tgt.url },
      { name: src.name, url: src.url },
    ],
  };
  // remove both, push folder
  const indices = [srcIdx, tgtIdx].sort((a, b) => b - a);
  indices.forEach(i => l.splice(i, 1));
  l.push(folder);
  saveShortcuts(l);
  render();
  setTimeout(() => {
    const ll = loadShortcuts();
    const fi = ll.findIndex(i => i.type === "folder" && i.col === pos.col && i.row === pos.row);
    if (fi >= 0) openFolder(fi);
  }, 150);
}

export function attachDrag(el: HTMLElement, item: Item, idx: number): void {
  let lpTimer: number | null = null;

  el.addEventListener("pointerdown", e => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".del-btn")) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    didDrag = false;

    lpTimer = window.setTimeout(() => {
      didDrag = true;
      dragging = { idx, el, item };
      el.classList.add("dragging");
      showGhost(item, sx, sy);
    }, LONG_PRESS_MS);

    function onMove(ev: PointerEvent): void {
      if (!dragging) {
        if (Math.abs(ev.clientX - sx) > 6 || Math.abs(ev.clientY - sy) > 6) {
          if (lpTimer !== null) clearTimeout(lpTimer);
        }
        return;
      }
      placeGhost(ev.clientX, ev.clientY);

      const tabEl = getTabElAt(ev.clientX, ev.clientY);
      if (tabEl) {
        clearFolderTarget();
        if (tabEl !== tabTargetEl) {
          clearTabTarget();
          tabEl.classList.add("drop-target");
          tabTargetEl = tabEl;
        }
        return;
      }
      clearTabTarget();

      const tEl = getItemElAt(ev.clientX, ev.clientY, el);
      if (tEl && tEl !== folderTargetEl) {
        clearFolderTarget();
        const tIdx = parseInt(tEl.dataset.idx!);
        const tItem = loadShortcuts()[tIdx];
        // no folder-in-folder
        if (tItem && tItem.type !== "folder" && item.type !== "folder") {
          tEl.classList.add("drop-target");
          folderTargetEl = tEl;
          folderTimer = window.setTimeout(() => {
            clearFolderTarget();
            mergeFolder(idx, tIdx);
          }, FOLDER_HOLD_MS);
        }
      } else if (!tEl) {
        clearFolderTarget();
      }
    }

    function onUp(ev: PointerEvent): void {
      if (lpTimer !== null) clearTimeout(lpTimer);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      if (!dragging) return;
      clearFolderTarget();
      if (!dragging) {
        hideGhost();
        return;
      }
      el.classList.remove("dragging");
      hideGhost();

      if (tabTargetEl) {
        const targetTabId = tabTargetEl.dataset.tab!;
        clearTabTarget();
        dragging = null;
        moveToTab(idx, targetTabId);
        return;
      }

      // compute drop position relative to icon-grid content
      const panel = document.getElementById("iconPanel")!;
      const rect = panel.getBoundingClientRect();
      const cs = cellSize();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const { col, row } = snapToCell(px - cs / 2 + 1, py - cs / 2 + 1);

      const l = loadShortcuts();
      const occupant = l.findIndex((it, i) => i !== idx && it.col === col && it.row === row && tabOf(it) === tabOf(l[idx]));
      if (occupant >= 0) {
        const oldCol = l[idx].col;
        const oldRow = l[idx].row;
        l[occupant].col = oldCol;
        l[occupant].row = oldRow;
      }
      l[idx].col = col;
      l[idx].row = row;
      saveShortcuts(l);
      dragging = null;
      render();
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });

  el.addEventListener("click", e => {
    if (didDrag) {
      e.preventDefault();
      didDrag = false;
    }
  });
}
