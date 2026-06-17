import type { LinkItem, FolderItem } from "../types";
import { loadShortcuts, saveShortcuts, favicon, tabOf } from "./state";
import { cellToXY, resizePanel } from "./grid";
import { attachDrag } from "./drag";
import { openFolder } from "./folder";
import { FOLDER_COLORS } from "./themes";
import { getActiveTab } from "./tabs";
import { pushUndo } from "./undo";

export function render(): void {
  resizePanel();
  const panel = document.getElementById("iconPanel")!;
  panel.innerHTML = "";
  const list = loadShortcuts();
  const activeTab = getActiveTab();
  const visible = list
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => tabOf(item) === activeTab)
    .sort((a, b) => (a.item.row - b.item.row) || (a.item.col - b.item.col));
  visible.forEach(({ item, idx }) => {
    const el = item.type === "folder"
      ? makeFolderEl(item as FolderItem, idx)
      : makeScItem(item as LinkItem, idx);
    const { x, y } = cellToXY(item.col || 0, item.row || 0);
    el.style.left = x + "px";
    el.style.top = y + "px";
    panel.appendChild(el);
  });
}

export function makeScItem(item: LinkItem, idx: number): HTMLAnchorElement {
  const el = document.createElement("a");
  el.href = item.url;
  el.target = "_blank";
  el.rel = "noopener noreferrer";
  el.className = "sc-item";
  el.dataset.idx = String(idx);
  el.innerHTML = `
    <div class="icon-wrap">
      <img src="${favicon(item.url)}" alt="${item.name}" onerror="this.style.display='none'">
    </div>
    <span class="sc-label">${item.name}</span>
    <button class="del-btn" title="remove">x</button>`;

  el.querySelector(".del-btn")!.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    const l = loadShortcuts();
    const deleted = l.splice(idx, 1);
    pushUndo({ type: "icon", items: deleted });
    saveShortcuts(l);
    render();
  });

  attachDrag(el, item, idx);
  return el;
}

export function makeFolderEl(folder: FolderItem, idx: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "sc-item";
  el.dataset.idx = String(idx);

  const fc = FOLDER_COLORS.find(c => c.id === (folder.color || "none")) ?? FOLDER_COLORS[0];
  const bgS = fc.id === "none" ? "" : `background:${fc.color};`;
  const bdS = fc.id === "none" ? "" : `border-color:${fc.border};`;

  const thumbs = (folder.items || [])
    .slice(0, 4)
    .map(it => `<img class="f-thumb" src="${favicon(it.url)}" onerror="this.style.display='none'">`)
    .join("");

  el.innerHTML = `
    <div class="folder-wrap" style="${bgS}${bdS}">${thumbs}</div>
    <span class="sc-label">${folder.name}</span>
    <button class="del-btn" title="remove">x</button>`;

  el.addEventListener("click", e => {
    if ((e.target as HTMLElement).closest(".del-btn")) return;
    openFolder(idx);
  });

  el.querySelector(".del-btn")!.addEventListener("click", e => {
    e.preventDefault();
    e.stopPropagation();
    const l = loadShortcuts();
    const deleted = l.splice(idx, 1);
    pushUndo({ type: "icon", items: deleted });
    saveShortcuts(l);
    render();
  });

  attachDrag(el, folder, idx);
  return el;
}
