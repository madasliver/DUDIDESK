import { loadShortcuts, saveShortcuts } from "./state";
import { freeCell } from "./grid";
import { render } from "./render";
import { getActiveTab, itemsInTab } from "./tabs";

function openModal(): void {
  document.getElementById("modalOverlay")!.classList.add("open");
  setTimeout(() => document.getElementById("inputName")!.focus(), 50);
}

function closeModal(): void {
  document.getElementById("modalOverlay")!.classList.remove("open");
  (document.getElementById("inputName") as HTMLInputElement).value = "";
  (document.getElementById("inputUrl") as HTMLInputElement).value = "";
}

function addShortcut(): void {
  const name = (document.getElementById("inputName") as HTMLInputElement).value.trim();
  let url = (document.getElementById("inputUrl") as HTMLInputElement).value.trim();
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const l = loadShortcuts();
  const tabId = getActiveTab();
  const pos = freeCell(itemsInTab(l, tabId));
  l.push({ type: "link", name, url, col: pos.col, row: pos.row, tabId });
  saveShortcuts(l);
  closeModal();
  render();
}

export function initModal(): void {
  document.getElementById("globalAddBtn")!.addEventListener("click", openModal);
  document.getElementById("btnCancel")!.addEventListener("click", closeModal);
  document.getElementById("modalOverlay")!.addEventListener("click", e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById("btnAdd")!.addEventListener("click", addShortcut);
  document.getElementById("inputUrl")!.addEventListener("keydown", e => {
    if ((e as KeyboardEvent).key === "Enter") addShortcut();
  });
}
