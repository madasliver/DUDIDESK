import type { Item, Tab } from "../types";
import { prefs, savePrefs, loadShortcuts, saveShortcuts, tabOf, DEFAULT_TAB_ID } from "./state";
import { render } from "./render";
import { FOLDER_COLORS } from "./themes";

export function itemsInTab(list: Item[], tabId: string): Item[] {
  return list.filter(i => tabOf(i) === tabId);
}

/** Applies (or clears) the tag-color styling for a tab button + its color dot. */
function applyTabStyle(tab: Tab, btn: HTMLElement, dot: HTMLElement, active: boolean): void {
  const fc = FOLDER_COLORS.find(c => c.id === (tab.color || "none"))!;
  if (fc.id === "none") {
    btn.style.background = "";
    btn.style.borderColor = "";
    btn.style.color = "";
    dot.style.background = "";
    dot.style.borderColor = "";
    return;
  }
  if (active) {
    btn.style.background = fc.border;
    btn.style.borderColor = fc.border;
    btn.style.color = "var(--bg)";
    dot.style.background = "var(--bg)";
    dot.style.borderColor = "var(--bg)";
  } else {
    btn.style.background = fc.color;
    btn.style.borderColor = fc.border;
    btn.style.color = "var(--fg)";
    dot.style.background = fc.border;
    dot.style.borderColor = fc.border;
  }
}

/** Active tab id, falling back to the first tab if it no longer exists. */
export function getActiveTab(): string {
  if (!prefs.tabs.some(t => t.id === prefs.activeTab)) {
    prefs.activeTab = prefs.tabs[0]?.id || DEFAULT_TAB_ID;
  }
  return prefs.activeTab;
}

function switchTab(id: string): void {
  if (prefs.activeTab === id) return;
  prefs.activeTab = id;
  savePrefs();
  document.querySelectorAll<HTMLElement>("#tabBar .tab-btn").forEach(b => {
    const tab = prefs.tabs.find(t => t.id === b.dataset.tab);
    const dot = b.querySelector<HTMLElement>(".tab-color-dot");
    if (!tab || !dot) return;
    const active = tab.id === id;
    b.classList.toggle("active", active);
    applyTabStyle(tab, b, dot, active);
  });
  render();
}

function addTab(): void {
  const id = "tab-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const tab: Tab = { id, name: "NEW" };
  prefs.tabs.push(tab);
  prefs.activeTab = id;
  savePrefs();
  renderTabs();
  render();
  const label = document.querySelector<HTMLElement>(`.tab-btn[data-tab="${id}"] .tab-label`);
  if (label) startRename(tab, label);
}

function startRename(tab: Tab, label: HTMLElement): void {
  const input = document.createElement("input");
  input.className = "tab-name-input";
  input.maxLength = 12;
  input.value = tab.name;
  label.replaceWith(input);
  input.focus();
  input.select();

  function commit(): void {
    const v = input.value.trim().toUpperCase();
    if (v) tab.name = v;
    savePrefs();
    renderTabs();
  }
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") { input.value = tab.name; input.blur(); }
  });
  input.addEventListener("blur", commit);
}

let colorPickerEl: HTMLElement | null = null;

function closeColorPicker(): void {
  if (colorPickerEl) {
    colorPickerEl.remove();
    colorPickerEl = null;
  }
}

function toggleColorPicker(tab: Tab, btn: HTMLElement): void {
  const wasOpenForThisTab = colorPickerEl?.dataset.tab === tab.id;
  closeColorPicker();
  if (wasOpenForThisTab) return;

  const picker = document.createElement("div");
  picker.className = "tab-color-picker";
  picker.dataset.tab = tab.id;

  FOLDER_COLORS.forEach(c => {
    const sw = document.createElement("div");
    sw.className = "tab-color-swatch" + ((tab.color || "none") === c.id ? " selected" : "");
    sw.title = c.id.toUpperCase();
    if (c.id === "none") {
      sw.style.cssText = "background:transparent;border:var(--px) solid var(--fg3);";
      sw.innerHTML = `<svg viewBox="0 0 18 18" width="12" height="12"><line x1="2" y1="2" x2="16" y2="16" stroke="var(--fg3)" stroke-width="2"/></svg>`;
    } else {
      sw.style.cssText = `background:${c.color};border:var(--px) solid ${c.border};`;
    }
    sw.addEventListener("click", e => {
      e.stopPropagation();
      tab.color = c.id;
      savePrefs();
      closeColorPicker();
      renderTabs();
    });
    picker.appendChild(sw);
  });

  btn.appendChild(picker);
  colorPickerEl = picker;
}

function deleteTab(id: string): void {
  if (prefs.tabs.length <= 1) return;
  const idx = prefs.tabs.findIndex(t => t.id === id);
  if (idx < 0) return;
  prefs.tabs.splice(idx, 1);
  const fallback = prefs.tabs[0].id;

  const list = loadShortcuts();
  list.forEach(item => {
    if (tabOf(item) === id) item.tabId = fallback;
  });
  saveShortcuts(list);

  if (prefs.activeTab === id) prefs.activeTab = fallback;
  savePrefs();
  renderTabs();
  render();
}

export function renderTabs(): void {
  const bar = document.getElementById("tabBar")!;
  bar.innerHTML = "";
  colorPickerEl = null;
  const active = getActiveTab();

  prefs.tabs.forEach(tab => {
    const btn = document.createElement("div");
    btn.className = "tab-btn" + (tab.id === active ? " active" : "");
    btn.dataset.tab = tab.id;

    const dot = document.createElement("span");
    dot.className = "tab-color-dot";
    dot.title = "tab color";
    applyTabStyle(tab, btn, dot, tab.id === active);
    dot.addEventListener("click", e => {
      e.stopPropagation();
      toggleColorPicker(tab, btn);
    });
    btn.appendChild(dot);

    const label = document.createElement("span");
    label.className = "tab-label";
    label.textContent = tab.name;
    btn.appendChild(label);

    if (prefs.tabs.length > 1) {
      const del = document.createElement("button");
      del.className = "tab-del";
      del.textContent = "x";
      del.title = "remove tab";
      del.addEventListener("click", e => {
        e.stopPropagation();
        deleteTab(tab.id);
      });
      btn.appendChild(del);
    }

    btn.addEventListener("click", () => switchTab(tab.id));
    btn.addEventListener("dblclick", e => {
      e.stopPropagation();
      startRename(tab, label);
    });

    bar.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "tab-add-btn";
  addBtn.textContent = "+";
  addBtn.title = "add tab";
  addBtn.addEventListener("click", addTab);
  bar.appendChild(addBtn);
}

export function initTabs(): void {
  renderTabs();
  document.addEventListener("click", e => {
    if (colorPickerEl && !colorPickerEl.contains(e.target as Node)) {
      closeColorPicker();
    }
  });
}
