import type { FolderItem, FolderEntry, FolderColorId } from "../types";
import { loadShortcuts, saveShortcuts, favicon, tabOf } from "./state";
import { freeCell } from "./grid";
import { FOLDER_COLORS } from "./themes";
import { render } from "./render";
import { itemsInTab } from "./tabs";
import { showGhost, placeGhost, hideGhost } from "./drag";

const LONG_PRESS_MS = 280;

let openFolderIdx = -1;

export function openFolder(idx: number): void {
  const l = loadShortcuts();
  const folder = l[idx];
  if (!folder || folder.type !== "folder") return;
  openFolderIdx = idx;
  (document.getElementById("folderNameInput") as HTMLInputElement).value = folder.name;
  renderColorPicker(folder);
  renderFolderGrid(folder, idx);
  document.getElementById("folderOverlay")!.classList.add("open");
  setTimeout(() => document.getElementById("folderNameInput")!.focus(), 50);
}

function renderColorPicker(folder: FolderItem): void {
  const picker = document.getElementById("folderColorPicker")!;
  picker.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;";
  picker.innerHTML = "";

  FOLDER_COLORS.forEach(c => {
    const sw = document.createElement("div");
    sw.className = "color-swatch" + ((folder.color || "none") === c.id ? " selected" : "");
    sw.title = c.id.toUpperCase();
    if (c.id === "none") {
      sw.style.cssText = "background:transparent;border:var(--px) solid var(--fg3);";
      sw.innerHTML = `<svg viewBox="0 0 18 18" width="18" height="18"><line x1="2" y1="2" x2="16" y2="16" stroke="var(--fg3)" stroke-width="2"/></svg>`;
    } else {
      sw.style.cssText = `background:${c.color};border:var(--px) solid ${c.border};`;
    }
    sw.addEventListener("click", () => {
      const l = loadShortcuts();
      const item = l[openFolderIdx];
      if (item && item.type === "folder") item.color = c.id as FolderColorId;
      saveShortcuts(l);
      picker.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
      sw.classList.add("selected");
      render();
    });
    picker.appendChild(sw);
  });
}

function renderFolderGrid(folder: FolderItem, folderIdx: number): void {
  const grid = document.getElementById("folderGrid")!;
  grid.innerHTML = "";

  (folder.items || []).forEach((it, j) => {
    const div = document.createElement("div");
    div.className = "f-item";
    div.innerHTML = `
      <a href="${it.url}" class="icon-wrap" style="text-decoration:none;display:flex;align-items:center;justify-content:center;" target="_blank">
        <img src="${favicon(it.url)}" onerror="this.style.display='none'">
      </a>
      <span class="f-label">${it.name}</span>
      <button class="f-del">x</button>`;

    div.querySelector(".f-del")!.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      const l = loadShortcuts();
      const f = l[folderIdx];
      if (!f || f.type !== "folder") return;
      const tabId = tabOf(f);
      const [removed] = f.items.splice(j, 1);

      // dissolve folder if ≤1 item remains
      if (f.items.length <= 1) {
        const rest = f.items.map(i => ({
          type: "link" as const,
          name: i.name,
          url: i.url,
          col: 0,
          row: 0,
          tabId,
        }));
        if (removed) {
          const pos = freeCell(itemsInTab([...l, ...rest], tabId));
          rest.push({ type: "link", name: removed.name, url: removed.url, col: pos.col, row: pos.row, tabId });
        }
        if (rest[0]) {
          rest[0].col = f.col;
          rest[0].row = f.row;
        }
        const ll = loadShortcuts();
        ll.splice(folderIdx, 1, ...rest);
        saveShortcuts(ll);
        closeFolderOverlay();
        render();
        return;
      }

      saveShortcuts(l);
      renderFolderGrid(f, folderIdx);
      render();
    });

    attachFolderItemDrag(div, it, j, folderIdx);

    grid.appendChild(div);
  });
}

/** Long-press an item in the folder overlay and drop it outside the panel to pull it out of the folder. */
function attachFolderItemDrag(el: HTMLElement, entry: FolderEntry, itemIdx: number, folderIdx: number): void {
  const link = el.querySelector<HTMLAnchorElement>(".icon-wrap")!;
  let lpTimer: number | null = null;
  let dragging = false;
  let didDrag = false;

  el.addEventListener("pointerdown", e => {
    if (e.button !== 0 || (e.target as HTMLElement).closest(".f-del")) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    didDrag = false;

    lpTimer = window.setTimeout(() => {
      dragging = true;
      didDrag = true;
      el.classList.add("dragging");
      showGhost(entry, sx, sy);
    }, LONG_PRESS_MS);

    function onMove(ev: PointerEvent): void {
      if (!dragging) {
        if (Math.abs(ev.clientX - sx) > 6 || Math.abs(ev.clientY - sy) > 6) {
          if (lpTimer !== null) clearTimeout(lpTimer);
        }
        return;
      }
      placeGhost(ev.clientX, ev.clientY);
    }

    function onUp(ev: PointerEvent): void {
      if (lpTimer !== null) clearTimeout(lpTimer);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      if (!dragging) return;
      dragging = false;
      el.classList.remove("dragging");
      hideGhost();

      const panel = document.querySelector<HTMLElement>(".folder-panel")!;
      const r = panel.getBoundingClientRect();
      const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) removeFromFolder(folderIdx, itemIdx);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });

  link.addEventListener("click", e => {
    if (didDrag) {
      e.preventDefault();
      didDrag = false;
    }
  });
}

/** Pulls an item out of a folder and places it on the grid. Deletes the folder if it becomes empty. */
function removeFromFolder(folderIdx: number, itemIdx: number): void {
  const l = loadShortcuts();
  const f = l[folderIdx];
  if (!f || f.type !== "folder") return;
  const tabId = tabOf(f);
  const [removed] = f.items.splice(itemIdx, 1);
  if (!removed) return;

  if (f.items.length === 0) {
    l.splice(folderIdx, 1, { type: "link", name: removed.name, url: removed.url, col: f.col, row: f.row, tabId });
    saveShortcuts(l);
    openFolderIdx = -1;
    document.getElementById("folderOverlay")!.classList.remove("open");
    render();
    return;
  }

  const pos = freeCell(itemsInTab(l, tabId));
  l.push({ type: "link", name: removed.name, url: removed.url, col: pos.col, row: pos.row, tabId });
  saveShortcuts(l);
  renderFolderGrid(f, folderIdx);
  render();
}

export function closeFolderOverlay(): void {
  const l = loadShortcuts();
  if (openFolderIdx >= 0) {
    const item = l[openFolderIdx];
    if (item && item.type === "folder") {
      const n = (document.getElementById("folderNameInput") as HTMLInputElement).value.trim();
      if (n) item.name = n.toUpperCase();
      saveShortcuts(l);
    }
  }
  openFolderIdx = -1;
  document.getElementById("folderOverlay")!.classList.remove("open");
  render();
}

export function initFolder(): void {
  document.getElementById("folderCloseBtn")!.addEventListener("click", closeFolderOverlay);
  document.getElementById("folderOverlay")!.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeFolderOverlay();
  });
  document.getElementById("folderNameInput")!.addEventListener("keydown", e => {
    if ((e as KeyboardEvent).key === "Enter") closeFolderOverlay();
  });
}
