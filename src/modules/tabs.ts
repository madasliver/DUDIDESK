import type { Item, Tab } from "../types";
import { prefs, savePrefs, loadShortcuts, saveShortcuts, tabOf, DEFAULT_TAB_ID } from "./state";
import { render } from "./render";
import { FOLDER_COLORS } from "./themes";
import { pushUndo, popUndo, hasUndo, onUndoChange } from "./undo";

export function itemsInTab(list: Item[], tabId: string): Item[] {
  return list.filter(i => tabOf(i) === tabId);
}

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

function showConfirm(msg: string): Promise<boolean> {
  return new Promise(resolve => {
    let overlay = document.querySelector<HTMLElement>(".confirm-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "confirm-overlay";
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
      <div class="confirm-box">
        <div class="confirm-msg">${msg}</div>
        <div class="confirm-actions">
          <button class="btn-cancel">CANCEL</button>
          <button class="btn-add">DELETE</button>
        </div>
      </div>`;
    overlay.classList.add("open");

    const close = (result: boolean) => {
      overlay!.classList.remove("open");
      resolve(result);
    };
    overlay.querySelector(".btn-cancel")!.addEventListener("click", () => close(false));
    overlay.querySelector(".btn-add")!.addEventListener("click", () => close(true));
    overlay.addEventListener("click", e => { if (e.target === overlay) close(false); });
  });
}

async function deleteTab(id: string): Promise<void> {
  if (prefs.tabs.length <= 1) return;
  const ok = await showConfirm("Do you really want to delete this tab?");
  if (!ok) return;

  const idx = prefs.tabs.findIndex(t => t.id === id);
  if (idx < 0) return;
  const tab = { ...prefs.tabs[idx] };

  const list = loadShortcuts();
  const tabItems = list.filter(item => tabOf(item) === id);
  const remaining = list.filter(item => tabOf(item) !== id);

  pushUndo({ type: "tab", tab, items: tabItems });
  saveShortcuts(remaining);

  prefs.tabs.splice(idx, 1);
  if (prefs.activeTab === id) prefs.activeTab = prefs.tabs[0].id;
  savePrefs();
  renderTabs();
  render();
}

function executeUndo(): void {
  const action = popUndo();
  if (!action) return;

  if (action.type === "tab" && action.tab) {
    prefs.tabs.push(action.tab);
    prefs.activeTab = action.tab.id;
    savePrefs();
    const list = loadShortcuts();
    action.items.forEach(item => list.push(item));
    saveShortcuts(list);
  } else {
    const list = loadShortcuts();
    action.items.forEach(item => list.push(item));
    saveShortcuts(list);
  }

  renderTabs();
  render();
}

export function renderTabs(): void {
  const bar = document.getElementById("tabBar")!;
  bar.innerHTML = "";
  colorPickerEl = null;
  const active = getActiveTab();

  let dragIdx = -1;
  bar.onpointerup = () => {
    dragIdx = -1;
    bar.querySelectorAll(".dragging").forEach(t => t.classList.remove("dragging"));
  };

  prefs.tabs.forEach((tab, tabIdx) => {
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

    btn.addEventListener("pointerdown", e => {
      if ((e.target as HTMLElement).closest(".tab-del, .tab-color-dot, .tab-color-picker")) return;
      dragIdx = tabIdx;
      btn.classList.add("dragging");
    });

    btn.addEventListener("pointerup", () => {
      if (dragIdx >= 0 && dragIdx !== tabIdx) {
        const tmp = prefs.tabs[dragIdx];
        prefs.tabs[dragIdx] = prefs.tabs[tabIdx];
        prefs.tabs[tabIdx] = tmp;
        savePrefs();
        renderTabs();
      }
      dragIdx = -1;
    });

    bar.appendChild(btn);
  });

  const addBtn = document.createElement("button");
  addBtn.className = "tab-add-btn";
  addBtn.textContent = "+";
  addBtn.title = "add tab";
  addBtn.addEventListener("click", addTab);
  bar.appendChild(addBtn);

  const undoBtn = document.createElement("button");
  undoBtn.className = "tab-undo-btn";
  undoBtn.textContent = "↩";
  undoBtn.title = "UNDO";
  if (!hasUndo()) undoBtn.disabled = true;
  undoBtn.addEventListener("click", e => {
    e.stopPropagation();
    executeUndo();
  });
  bar.appendChild(undoBtn);
}

export function initTabs(): void {
  onUndoChange(() => renderTabs());
  renderTabs();
  document.addEventListener("click", e => {
    if (colorPickerEl && !colorPickerEl.contains(e.target as Node)) {
      closeColorPicker();
    }
  });
}
