// src/modules/state.ts
var PREF_KEY = "dudidesk_prefs";
var SC_KEY = "dudidesk_v7";
var DEFAULT_TAB_ID = "home";
var DEFAULT_TABS = [{ id: DEFAULT_TAB_ID, name: "HOME" }];
var DEFAULT_PREFS = {
  mode: "mid",
  size: "m",
  bg: "grid",
  title: "DUDI",
  opacity: 4,
  tabs: DEFAULT_TABS.map((t) => ({ ...t })),
  activeTab: DEFAULT_TAB_ID
};
var DEFAULT_SHORTCUTS = [
  { type: "link", name: "UNI", url: "https://www.bht-berlin.de", col: 0, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "BHT MAIL", url: "https://mail.bht-berlin.de", col: 1, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "STRATO", url: "https://webmail.strato.de", col: 2, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "YOUTUBE", url: "https://youtube.com", col: 3, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "FACEBOOK", url: "https://facebook.com", col: 4, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "FIGMA", url: "https://figma.com", col: 5, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "TELEGRAM", url: "https://web.telegram.org", col: 6, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "GEMINI", url: "https://gemini.google.com", col: 7, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "ASTA MAIL", url: "https://mail.asta-bht.de", col: 8, row: 0, tabId: DEFAULT_TAB_ID },
  { type: "link", name: "AUTHENTIK", url: "https://authentik.io", col: 9, row: 0, tabId: DEFAULT_TAB_ID }
];
var prefs = { ...DEFAULT_PREFS };
function loadPrefs() {
  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (stored) prefs = { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {
  }
  if (!prefs.tabs || !prefs.tabs.length) prefs.tabs = DEFAULT_TABS.map((t) => ({ ...t }));
  if (!prefs.tabs.some((t) => t.id === prefs.activeTab)) prefs.activeTab = prefs.tabs[0].id;
  return prefs;
}
function savePrefs() {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}
function tabOf(item) {
  return item.tabId || DEFAULT_TAB_ID;
}
function loadShortcuts() {
  try {
    const raw = localStorage.getItem(SC_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      return list.map((item) => item.tabId ? item : { ...item, tabId: DEFAULT_TAB_ID });
    }
  } catch {
  }
  return [...DEFAULT_SHORTCUTS];
}
function saveShortcuts(list) {
  localStorage.setItem(SC_KEY, JSON.stringify(list));
}
function favicon(url) {
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(url).origin}&sz=64`;
  } catch {
    return "";
  }
}

// src/modules/themes.ts
var THEMES = {
  dark: { bg: "#0a0a0a", bg2: "#111111", fg: "#e8e4d0", fg2: "#a09880", fg3: "#303030", border: "#e8e4d0" },
  mid: { bg: "#1a1a1a", bg2: "#222222", fg: "#e8e4d0", fg2: "#a09880", fg3: "#504840", border: "#e8e4d0" },
  light: { bg: "#f0ece0", bg2: "#e4dfd0", fg: "#1a1a1a", fg2: "#504840", fg3: "#a09880", border: "#1a1a1a" }
};
var FOLDER_COLORS = [
  { id: "none", color: "transparent", border: "var(--fg3)" },
  { id: "red", color: "#7a1f1f", border: "#c0392b" },
  { id: "orange", color: "#7a3f0f", border: "#d4691a" },
  { id: "yellow", color: "#5a4a00", border: "#c8a800" },
  { id: "green", color: "#1a4a20", border: "#2ecc71" },
  { id: "blue", color: "#0f2a5a", border: "#2980b9" },
  { id: "purple", color: "#3a1a5a", border: "#8e44ad" }
];

// src/modules/sizes.ts
var SIZES = {
  s: { icon: "54px", img: "26px", label: "7px", search: "8px", pad: "11px", word: "22px", sw: "460px", cell: "78px" },
  m: { icon: "66px", img: "32px", label: "8px", search: "9px", pad: "13px", word: "28px", sw: "540px", cell: "90px" },
  l: { icon: "80px", img: "40px", label: "9px", search: "10px", pad: "15px", word: "34px", sw: "600px", cell: "106px" },
  xl: { icon: "96px", img: "50px", label: "10px", search: "11px", pad: "18px", word: "40px", sw: "660px", cell: "124px" }
};

// src/modules/folder.ts
var LONG_PRESS_MS = 280;
var openFolderIdx = -1;
function openFolder(idx) {
  const l = loadShortcuts();
  const folder = l[idx];
  if (!folder || folder.type !== "folder") return;
  openFolderIdx = idx;
  document.getElementById("folderNameInput").value = folder.name;
  renderColorPicker(folder);
  renderFolderGrid(folder, idx);
  document.getElementById("folderOverlay").classList.add("open");
  setTimeout(() => document.getElementById("folderNameInput").focus(), 50);
}
function renderColorPicker(folder) {
  const picker = document.getElementById("folderColorPicker");
  picker.style.cssText = "display:flex;gap:6px;align-items:center;flex-wrap:wrap;";
  picker.innerHTML = "";
  FOLDER_COLORS.forEach((c) => {
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
      if (item && item.type === "folder") item.color = c.id;
      saveShortcuts(l);
      picker.querySelectorAll(".color-swatch").forEach((s) => s.classList.remove("selected"));
      sw.classList.add("selected");
      render();
    });
    picker.appendChild(sw);
  });
}
function renderFolderGrid(folder, folderIdx) {
  const grid = document.getElementById("folderGrid");
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
    div.querySelector(".f-del").addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const l = loadShortcuts();
      const f = l[folderIdx];
      if (!f || f.type !== "folder") return;
      const tabId = tabOf(f);
      const [removed] = f.items.splice(j, 1);
      if (f.items.length <= 1) {
        const rest = f.items.map((i) => ({
          type: "link",
          name: i.name,
          url: i.url,
          col: 0,
          row: 0,
          tabId
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
function attachFolderItemDrag(el, entry, itemIdx, folderIdx) {
  const link = el.querySelector(".icon-wrap");
  let lpTimer = null;
  let dragging2 = false;
  let didDrag2 = false;
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".f-del")) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    didDrag2 = false;
    lpTimer = window.setTimeout(() => {
      dragging2 = true;
      didDrag2 = true;
      el.classList.add("dragging");
      showGhost(entry, sx, sy);
    }, LONG_PRESS_MS);
    function onMove(ev) {
      if (!dragging2) {
        if (Math.abs(ev.clientX - sx) > 6 || Math.abs(ev.clientY - sy) > 6) {
          if (lpTimer !== null) clearTimeout(lpTimer);
        }
        return;
      }
      placeGhost(ev.clientX, ev.clientY);
    }
    function onUp(ev) {
      if (lpTimer !== null) clearTimeout(lpTimer);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
      if (!dragging2) return;
      dragging2 = false;
      el.classList.remove("dragging");
      hideGhost();
      const panel = document.querySelector(".folder-panel");
      const r = panel.getBoundingClientRect();
      const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
      if (!inside) removeFromFolder(folderIdx, itemIdx);
    }
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
  });
  link.addEventListener("click", (e) => {
    if (didDrag2) {
      e.preventDefault();
      didDrag2 = false;
    }
  });
}
function removeFromFolder(folderIdx, itemIdx) {
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
    document.getElementById("folderOverlay").classList.remove("open");
    render();
    return;
  }
  const pos = freeCell(itemsInTab(l, tabId));
  l.push({ type: "link", name: removed.name, url: removed.url, col: pos.col, row: pos.row, tabId });
  saveShortcuts(l);
  renderFolderGrid(f, folderIdx);
  render();
}
function closeFolderOverlay() {
  const l = loadShortcuts();
  if (openFolderIdx >= 0) {
    const item = l[openFolderIdx];
    if (item && item.type === "folder") {
      const n = document.getElementById("folderNameInput").value.trim();
      if (n) item.name = n.toUpperCase();
      saveShortcuts(l);
    }
  }
  openFolderIdx = -1;
  document.getElementById("folderOverlay").classList.remove("open");
  render();
}
function initFolder() {
  document.getElementById("folderCloseBtn").addEventListener("click", closeFolderOverlay);
  document.getElementById("folderOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeFolderOverlay();
  });
  document.getElementById("folderNameInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") closeFolderOverlay();
  });
}

// src/modules/drag.ts
var dragging = null;
var folderTimer = null;
var folderTargetEl = null;
var tabTargetEl = null;
var didDrag = false;
var FOLDER_HOLD_MS = 500;
var LONG_PRESS_MS2 = 280;
function gCS(p) {
  return getComputedStyle(document.documentElement).getPropertyValue(p).trim();
}
function showGhost(item, x, y) {
  const g = document.getElementById("dragGhost");
  const sz = gCS("--icon-size") || "66px";
  const im = gCS("--icon-img") || "32px";
  const fs = gCS("--label-size") || "7px";
  let inner = "";
  if (item.type === "folder") {
    inner = `<div style="width:${sz};height:${sz};border:3px solid var(--border);background:var(--bg2);
      display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:3px;padding:6px;">
      ${(item.items || []).slice(0, 4).map(
      (it) => `<img src="${favicon(it.url)}" style="width:100%;height:100%;object-fit:contain;">`
    ).join("")}
    </div>`;
  } else {
    inner = `<div style="width:${sz};height:${sz};border:3px solid var(--border);background:var(--bg2);
      display:flex;align-items:center;justify-content:center;overflow:hidden;">
      <img src="${favicon(item.url || "")}" style="width:${im};height:${im};object-fit:contain;">
    </div>`;
  }
  g.innerHTML = inner + `<span style="font-family:'Press Start 2P',monospace;font-size:${fs};color:var(--fg);text-transform:uppercase;">${item.name}</span>`;
  g.style.display = "flex";
  placeGhost(x, y);
}
function placeGhost(x, y) {
  const g = document.getElementById("dragGhost");
  const sz = parseInt(gCS("--icon-size")) || 66;
  g.style.left = x - sz / 2 + "px";
  g.style.top = y - sz / 2 + "px";
}
function hideGhost() {
  const g = document.getElementById("dragGhost");
  g.style.display = "none";
  g.innerHTML = "";
}
function clearFolderTarget() {
  if (folderTargetEl) {
    folderTargetEl.classList.remove("drop-target");
    folderTargetEl = null;
  }
  if (folderTimer !== null) {
    clearTimeout(folderTimer);
    folderTimer = null;
  }
}
function getItemElAt(x, y, excludeEl) {
  const g = document.getElementById("dragGhost");
  const prev = g.style.display;
  g.style.display = "none";
  const hits = document.elementsFromPoint(x, y);
  g.style.display = prev;
  for (const el of hits) {
    const t = el.closest(".sc-item[data-idx]");
    if (t && t !== excludeEl) return t;
  }
  return null;
}
function getTabElAt(x, y) {
  const g = document.getElementById("dragGhost");
  const prev = g.style.display;
  g.style.display = "none";
  const hits = document.elementsFromPoint(x, y);
  g.style.display = prev;
  for (const el of hits) {
    const t = el.closest("#tabBar .tab-btn");
    if (t && !t.classList.contains("active")) return t;
  }
  return null;
}
function clearTabTarget() {
  if (tabTargetEl) {
    tabTargetEl.classList.remove("drop-target");
    tabTargetEl = null;
  }
}
function moveToTab(idx, targetTabId) {
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
function mergeFolder(srcIdx, tgtIdx) {
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
  const folder = {
    type: "folder",
    name: "FOLDER",
    color: "none",
    col: pos.col,
    row: pos.row,
    tabId: tabOf(tgt),
    items: [
      { name: tgt.name, url: tgt.url },
      { name: src.name, url: src.url }
    ]
  };
  const indices = [srcIdx, tgtIdx].sort((a, b) => b - a);
  indices.forEach((i) => l.splice(i, 1));
  l.push(folder);
  saveShortcuts(l);
  render();
  setTimeout(() => {
    const ll = loadShortcuts();
    const fi = ll.findIndex((i) => i.type === "folder" && i.col === pos.col && i.row === pos.row);
    if (fi >= 0) openFolder(fi);
  }, 150);
}
function attachDrag(el, item, idx) {
  let lpTimer = null;
  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".del-btn")) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    didDrag = false;
    lpTimer = window.setTimeout(() => {
      didDrag = true;
      dragging = { idx, el, item };
      el.classList.add("dragging");
      showGhost(item, sx, sy);
    }, LONG_PRESS_MS2);
    function onMove(ev) {
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
        const tIdx = parseInt(tEl.dataset.idx);
        const tItem = loadShortcuts()[tIdx];
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
    function onUp(ev) {
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
        const targetTabId = tabTargetEl.dataset.tab;
        clearTabTarget();
        dragging = null;
        moveToTab(idx, targetTabId);
        return;
      }
      const panel = document.getElementById("iconPanel");
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
  el.addEventListener("click", (e) => {
    if (didDrag) {
      e.preventDefault();
      didDrag = false;
    }
  });
}

// src/modules/undo.ts
var MAX_UNDO = 5;
var stack = [];
var onChange = null;
function pushUndo(action) {
  stack.push(action);
  if (stack.length > MAX_UNDO) stack.shift();
  onChange?.();
}
function popUndo() {
  const action = stack.pop();
  onChange?.();
  return action;
}
function hasUndo() {
  return stack.length > 0;
}
function onUndoChange(cb) {
  onChange = cb;
}

// src/modules/render.ts
function render() {
  resizePanel();
  const panel = document.getElementById("iconPanel");
  panel.innerHTML = "";
  const list = loadShortcuts();
  const activeTab = getActiveTab();
  const visible = list.map((item, idx) => ({ item, idx })).filter(({ item }) => tabOf(item) === activeTab).sort((a, b) => a.item.row - b.item.row || a.item.col - b.item.col);
  visible.forEach(({ item, idx }) => {
    const el = item.type === "folder" ? makeFolderEl(item, idx) : makeScItem(item, idx);
    const { x, y } = cellToXY(item.col || 0, item.row || 0);
    el.style.left = x + "px";
    el.style.top = y + "px";
    panel.appendChild(el);
  });
}
function makeScItem(item, idx) {
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
  el.querySelector(".del-btn").addEventListener("click", (e) => {
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
function makeFolderEl(folder, idx) {
  const el = document.createElement("div");
  el.className = "sc-item";
  el.dataset.idx = String(idx);
  const fc = FOLDER_COLORS.find((c) => c.id === (folder.color || "none")) ?? FOLDER_COLORS[0];
  const bgS = fc.id === "none" ? "" : `background:${fc.color};`;
  const bdS = fc.id === "none" ? "" : `border-color:${fc.border};`;
  const thumbs = (folder.items || []).slice(0, 4).map((it) => `<img class="f-thumb" src="${favicon(it.url)}" onerror="this.style.display='none'">`).join("");
  el.innerHTML = `
    <div class="folder-wrap" style="${bgS}${bdS}">${thumbs}</div>
    <span class="sc-label">${folder.name}</span>
    <button class="del-btn" title="remove">x</button>`;
  el.addEventListener("click", (e) => {
    if (e.target.closest(".del-btn")) return;
    openFolder(idx);
  });
  el.querySelector(".del-btn").addEventListener("click", (e) => {
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

// src/modules/tabs.ts
function itemsInTab(list, tabId) {
  return list.filter((i) => tabOf(i) === tabId);
}
function applyTabStyle(tab, btn, dot, active) {
  const fc = FOLDER_COLORS.find((c) => c.id === (tab.color || "none"));
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
function getActiveTab() {
  if (!prefs.tabs.some((t) => t.id === prefs.activeTab)) {
    prefs.activeTab = prefs.tabs[0]?.id || DEFAULT_TAB_ID;
  }
  return prefs.activeTab;
}
function switchTab(id) {
  if (prefs.activeTab === id) return;
  prefs.activeTab = id;
  savePrefs();
  document.querySelectorAll("#tabBar .tab-btn").forEach((b) => {
    const tab = prefs.tabs.find((t) => t.id === b.dataset.tab);
    const dot = b.querySelector(".tab-color-dot");
    if (!tab || !dot) return;
    const active = tab.id === id;
    b.classList.toggle("active", active);
    applyTabStyle(tab, b, dot, active);
  });
  render();
}
function addTab() {
  const id = "tab-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const tab = { id, name: "NEW" };
  prefs.tabs.push(tab);
  prefs.activeTab = id;
  savePrefs();
  renderTabs();
  render();
  const label = document.querySelector(`.tab-btn[data-tab="${id}"] .tab-label`);
  if (label) startRename(tab, label);
}
function startRename(tab, label) {
  const input = document.createElement("input");
  input.className = "tab-name-input";
  input.maxLength = 12;
  input.value = tab.name;
  label.replaceWith(input);
  input.focus();
  input.select();
  function commit() {
    const v = input.value.trim().toUpperCase();
    if (v) tab.name = v;
    savePrefs();
    renderTabs();
  }
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") input.blur();
    if (e.key === "Escape") {
      input.value = tab.name;
      input.blur();
    }
  });
  input.addEventListener("blur", commit);
}
var colorPickerEl = null;
function closeColorPicker() {
  if (colorPickerEl) {
    colorPickerEl.remove();
    colorPickerEl = null;
  }
}
function toggleColorPicker(tab, btn) {
  const wasOpenForThisTab = colorPickerEl?.dataset.tab === tab.id;
  closeColorPicker();
  if (wasOpenForThisTab) return;
  const picker = document.createElement("div");
  picker.className = "tab-color-picker";
  picker.dataset.tab = tab.id;
  FOLDER_COLORS.forEach((c) => {
    const sw = document.createElement("div");
    sw.className = "tab-color-swatch" + ((tab.color || "none") === c.id ? " selected" : "");
    sw.title = c.id.toUpperCase();
    if (c.id === "none") {
      sw.style.cssText = "background:transparent;border:var(--px) solid var(--fg3);";
      sw.innerHTML = `<svg viewBox="0 0 18 18" width="12" height="12"><line x1="2" y1="2" x2="16" y2="16" stroke="var(--fg3)" stroke-width="2"/></svg>`;
    } else {
      sw.style.cssText = `background:${c.color};border:var(--px) solid ${c.border};`;
    }
    sw.addEventListener("click", (e) => {
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
function showConfirm(msg) {
  return new Promise((resolve) => {
    let overlay = document.querySelector(".confirm-overlay");
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
    const close = (result) => {
      overlay.classList.remove("open");
      resolve(result);
    };
    overlay.querySelector(".btn-cancel").addEventListener("click", () => close(false));
    overlay.querySelector(".btn-add").addEventListener("click", () => close(true));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
  });
}
async function deleteTab(id) {
  if (prefs.tabs.length <= 1) return;
  const ok = await showConfirm("Do you really want to delete this tab?");
  if (!ok) return;
  const idx = prefs.tabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const tab = { ...prefs.tabs[idx] };
  const list = loadShortcuts();
  const tabItems = list.filter((item) => tabOf(item) === id);
  const remaining2 = list.filter((item) => tabOf(item) !== id);
  pushUndo({ type: "tab", tab, items: tabItems });
  saveShortcuts(remaining2);
  prefs.tabs.splice(idx, 1);
  if (prefs.activeTab === id) prefs.activeTab = prefs.tabs[0].id;
  savePrefs();
  renderTabs();
  render();
}
function executeUndo() {
  const action = popUndo();
  if (!action) return;
  if (action.type === "tab" && action.tab) {
    prefs.tabs.push(action.tab);
    prefs.activeTab = action.tab.id;
    savePrefs();
    const list = loadShortcuts();
    action.items.forEach((item) => list.push(item));
    saveShortcuts(list);
  } else {
    const list = loadShortcuts();
    action.items.forEach((item) => list.push(item));
    saveShortcuts(list);
  }
  renderTabs();
  render();
}
function renderTabs() {
  const bar = document.getElementById("tabBar");
  bar.innerHTML = "";
  colorPickerEl = null;
  const active = getActiveTab();
  let dragIdx = -1;
  bar.onpointerup = () => {
    dragIdx = -1;
    bar.querySelectorAll(".dragging").forEach((t) => t.classList.remove("dragging"));
  };
  prefs.tabs.forEach((tab, tabIdx) => {
    const btn = document.createElement("div");
    btn.className = "tab-btn" + (tab.id === active ? " active" : "");
    btn.dataset.tab = tab.id;
    const dot = document.createElement("span");
    dot.className = "tab-color-dot";
    dot.title = "tab color";
    applyTabStyle(tab, btn, dot, tab.id === active);
    dot.addEventListener("click", (e) => {
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
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteTab(tab.id);
      });
      btn.appendChild(del);
    }
    btn.addEventListener("click", () => switchTab(tab.id));
    btn.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      startRename(tab, label);
    });
    btn.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".tab-del, .tab-color-dot, .tab-color-picker")) return;
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
  undoBtn.textContent = "\u21A9";
  undoBtn.title = "UNDO";
  if (!hasUndo()) undoBtn.disabled = true;
  undoBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    executeUndo();
  });
  bar.appendChild(undoBtn);
}
function initTabs() {
  onUndoChange(() => renderTabs());
  renderTabs();
  document.addEventListener("click", (e) => {
    if (colorPickerEl && !colorPickerEl.contains(e.target)) {
      closeColorPicker();
    }
  });
}

// src/modules/grid.ts
var COLS = 10;
var MIN_ROWS = 2;
function getCSVar(name) {
  return parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(name)
  ) || 0;
}
function cellSize() {
  return getCSVar("--cell") || 80;
}
function cellToXY(col, row) {
  const cs = cellSize();
  return { x: col * cs, y: row * cs };
}
function snapToCell(px, py) {
  const cs = cellSize();
  return {
    col: Math.max(0, Math.min(COLS - 1, Math.floor(px / cs))),
    row: Math.max(0, Math.floor(py / cs))
  };
}
function freeCell(list) {
  const occupied = new Set(list.map((i) => `${i.col},${i.row}`));
  for (let r = 0; r < 50; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!occupied.has(`${c},${r}`)) return { col: c, row: r };
    }
  }
  return { col: 0, row: list.length };
}
function panelRows() {
  const list = itemsInTab(loadShortcuts(), getActiveTab());
  const maxRow = list.reduce((m, i) => Math.max(m, i.row), 0);
  return Math.max(MIN_ROWS, maxRow + 1);
}
function resizePanel() {
  const cs = cellSize();
  const panel = document.getElementById("iconPanel");
  if (!panel) return;
  panel.style.width = COLS * cs + "px";
  panel.style.height = panelRows() * cs + "px";
}

// src/modules/background.ts
function applyBg(type) {
  const canvas = document.getElementById("bgCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width = window.innerWidth;
  const H = canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, W, H);
  const fg = getComputedStyle(document.documentElement).getPropertyValue("--fg").trim() || "#e8e4d0";
  ctx.strokeStyle = fg;
  ctx.fillStyle = fg;
  if (type === "grid") {
    const S = 24;
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.18;
    for (let x = 0; x < W; x += S) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += S) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  } else if (type === "dots") {
    const S = 20;
    ctx.globalAlpha = 0.22;
    for (let x = S; x < W; x += S)
      for (let y = S; y < H; y += S) ctx.fillRect(x - 1, y - 1, 2, 2);
  } else if (type === "plus") {
    const S = 28;
    ctx.globalAlpha = 0.18;
    for (let x = S; x < W; x += S) {
      for (let y = S; y < H; y += S) {
        ctx.fillRect(x - 3, y - 1, 7, 3);
        ctx.fillRect(x - 1, y - 3, 3, 7);
      }
    }
  } else if (type === "aliens") {
    const sp = [
      [0, 0, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 1, 0, 1],
      [0, 0, 0, 1, 1, 0, 0, 0]
    ];
    const px = 2;
    const gap = 52;
    ctx.globalAlpha = 0.12;
    let row = 0;
    for (let y = gap / 2; y < H + gap; y += gap) {
      for (let x = row % 2 === 0 ? gap / 2 : gap; x < W + gap; x += gap) {
        sp.forEach(
          (r, ri) => r.forEach((c, ci) => {
            if (c) ctx.fillRect(Math.round(x + ci * px), Math.round(y + ri * px), px, px);
          })
        );
      }
      row++;
    }
  }
  ctx.globalAlpha = 1;
}

// src/modules/theme.ts
var PANEL_PAD = 50;
var VIEWPORT_MARGIN = 24;
var MIN_SCALE = 0.1;
function applyTheme(mode, size) {
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
function applyResponsiveScale(size = prefs.size) {
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
function applyTitle(title) {
  const v = (title || "DUDI").toUpperCase();
  const titleEl = document.getElementById("wordmarkTitle");
  const prefixEl = document.getElementById("wordmarkPrefix");
  titleEl.textContent = v;
  prefixEl.style.display = v === "DUDI" ? "inline" : "none";
  document.title = v + "DESK";
}
function applyPanelOpacity(val) {
  const alpha = val / 10 * 0.18;
  const panel = document.querySelector(".icon-panel");
  if (!panel) return;
  panel.style.background = `rgba(255,255,255,${alpha})`;
  panel.style.borderColor = val === 0 ? "transparent" : `rgba(255,255,255,${alpha * 0.5 + 0.02})`;
}
function setActiveBtn(rowId, key) {
  const attr = rowId === "modeRow" ? "mode" : rowId === "sizeRow" ? "size" : "bg";
  document.querySelectorAll(`#${rowId} .tog-btn`).forEach((b) => {
    const el = b;
    el.classList.toggle("active", el.dataset[attr] === key);
  });
}

// src/modules/modal.ts
function openModal() {
  document.getElementById("modalOverlay").classList.add("open");
  setTimeout(() => document.getElementById("inputName").focus(), 50);
}
function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.getElementById("inputName").value = "";
  document.getElementById("inputUrl").value = "";
}
function addShortcut() {
  const name = document.getElementById("inputName").value.trim();
  let url = document.getElementById("inputUrl").value.trim();
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
function initModal() {
  document.getElementById("globalAddBtn").addEventListener("click", openModal);
  document.getElementById("btnCancel").addEventListener("click", closeModal);
  document.getElementById("modalOverlay").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.getElementById("btnAdd").addEventListener("click", addShortcut);
  document.getElementById("inputUrl").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addShortcut();
  });
}

// src/modules/settings.ts
var dropdown = () => document.getElementById("settingsDropdown");
var savedState = null;
function openDropdown() {
  savedState = { ...prefs };
  document.getElementById("titleInput").value = prefs.title || "DUDI";
  const v = prefs.opacity ?? 4;
  document.getElementById("opacitySlider").value = String(v);
  document.getElementById("opacityVal").textContent = String(v);
  dropdown().classList.add("open");
}
function closeDropdown() {
  dropdown().classList.remove("open");
}
function revertUnsaved() {
  if (!savedState) return;
  prefs.mode = savedState.mode;
  prefs.size = savedState.size;
  prefs.bg = savedState.bg;
  prefs.title = savedState.title;
  prefs.opacity = savedState.opacity;
  applyTheme(prefs.mode, prefs.size);
  applyTitle(prefs.title);
  applyPanelOpacity(prefs.opacity);
  setActiveBtn("modeRow", prefs.mode);
  setActiveBtn("sizeRow", prefs.size);
  setActiveBtn("bgRow", prefs.bg);
}
function initSettings() {
  document.getElementById("settingsBtn").addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown().classList.contains("open") ? closeDropdown() : openDropdown();
  });
  document.addEventListener("click", (e) => {
    if (!document.querySelector(".settings-wrap").contains(e.target) && dropdown().classList.contains("open")) {
      revertUnsaved();
      closeDropdown();
    }
  });
  document.getElementById("modeRow").addEventListener("click", (e) => {
    const b = e.target.closest(".tog-btn");
    if (!b) return;
    prefs.mode = b.dataset.mode;
    setActiveBtn("modeRow", prefs.mode);
    applyTheme(prefs.mode, prefs.size);
  });
  document.getElementById("sizeRow").addEventListener("click", (e) => {
    const b = e.target.closest(".tog-btn");
    if (!b) return;
    prefs.size = b.dataset.size;
    setActiveBtn("sizeRow", prefs.size);
    applyTheme(prefs.mode, prefs.size);
    render();
  });
  document.getElementById("bgRow").addEventListener("click", (e) => {
    const b = e.target.closest(".tog-btn");
    if (!b) return;
    prefs.bg = b.dataset.bg;
    setActiveBtn("bgRow", prefs.bg);
    applyBg(prefs.bg);
  });
  document.getElementById("titleInput").addEventListener("input", (e) => {
    applyTitle(e.target.value.trim() || "DUDI");
  });
  document.getElementById("opacitySlider").addEventListener("input", (e) => {
    const v = parseInt(e.target.value);
    document.getElementById("opacityVal").textContent = String(v);
    applyPanelOpacity(v);
  });
  document.getElementById("btnSave").addEventListener("click", () => {
    const t = document.getElementById("titleInput").value.trim().toUpperCase();
    if (t) prefs.title = t;
    prefs.opacity = parseInt(document.getElementById("opacitySlider").value);
    savePrefs();
    applyTitle(prefs.title);
    applyPanelOpacity(prefs.opacity);
    closeDropdown();
  });
}

// src/modules/clock.ts
function initClock() {
  const timeEl = document.getElementById("clockTime");
  const dateEl = document.getElementById("clockDate");
  if (!timeEl && !dateEl) return;
  const pad2 = (n) => String(n).padStart(2, "0");
  function tick() {
    const now = /* @__PURE__ */ new Date();
    if (timeEl) timeEl.textContent = `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
    if (dateEl) dateEl.textContent = `${pad2(now.getDate())}.${pad2(now.getMonth() + 1)}.${now.getFullYear()}`;
  }
  tick();
  setInterval(tick, 1e3);
}

// src/modules/weather.ts
function icon(rects) {
  return `<svg width="20" height="20" viewBox="0 0 10 10" fill="currentColor" style="image-rendering:pixelated;flex-shrink:0">${rects}</svg>`;
}
var ICONS = {
  sunny: icon(
    '<rect x="4" y="0" width="2" height="1"/><rect x="4" y="9" width="2" height="1"/><rect x="0" y="4" width="1" height="2"/><rect x="9" y="4" width="1" height="2"/><rect x="1" y="1" width="1" height="1"/><rect x="8" y="1" width="1" height="1"/><rect x="1" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/><rect x="3" y="2" width="4" height="1"/><rect x="2" y="3" width="6" height="4"/><rect x="3" y="7" width="4" height="1"/>'
  ),
  cloudy: icon(
    '<rect x="4" y="2" width="3" height="2"/><rect x="2" y="3" width="6" height="1"/><rect x="1" y="4" width="8" height="4"/>'
  ),
  rainy: icon(
    '<rect x="4" y="1" width="3" height="2"/><rect x="2" y="2" width="6" height="1"/><rect x="1" y="3" width="8" height="3"/><rect x="2" y="7" width="1" height="2"/><rect x="5" y="7" width="1" height="2"/><rect x="8" y="7" width="1" height="2"/>'
  ),
  snowy: icon(
    '<rect x="4" y="1" width="3" height="2"/><rect x="2" y="2" width="6" height="1"/><rect x="1" y="3" width="8" height="3"/><rect x="2" y="7" width="2" height="1"/><rect x="5" y="7" width="2" height="1"/><rect x="3" y="9" width="2" height="1"/><rect x="7" y="9" width="2" height="1"/>'
  )
};
function getIcon(code) {
  if (code === 0) return ICONS.sunny;
  if (code <= 48) return ICONS.cloudy;
  if (code >= 71 && code <= 77 || code === 85 || code === 86) return ICONS.snowy;
  return ICONS.rainy;
}
function initWeather() {
  const el = document.getElementById("weatherWidget");
  if (!el || !("geolocation" in navigator)) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode`;
      fetch(url).then((r) => r.json()).then((data) => {
        const d = data;
        const temp = d.current?.temperature_2m;
        const code = d.current?.weathercode;
        if (temp === void 0 || code === void 0) return;
        const tempEl = document.createElement("span");
        tempEl.textContent = `${Math.round(temp)}\xB0C`;
        el.innerHTML = getIcon(code);
        el.appendChild(tempEl);
        el.style.display = "flex";
      }).catch(() => {
      });
    },
    () => {
    }
  );
}

// src/modules/todo.ts
var TODO_KEY = "dudidesk_todos";
function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(TODO_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveTodos(todos) {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}
function renderTodos() {
  const list = document.getElementById("todoList");
  if (!list) return;
  const todos = loadTodos().sort((a, b) => Number(a.done) - Number(b.done));
  list.innerHTML = "";
  todos.forEach((todo) => {
    const row = document.createElement("div");
    row.className = "todo-item" + (todo.done ? " done" : "");
    const check = document.createElement("button");
    check.className = "todo-check";
    check.textContent = todo.done ? "\u2713" : "";
    check.addEventListener("click", () => {
      const all = loadTodos();
      const t = all.find((x) => x.id === todo.id);
      if (t) {
        t.done = !t.done;
        saveTodos(all);
        renderTodos();
      }
    });
    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;
    const del = document.createElement("button");
    del.className = "todo-del";
    del.textContent = "\xD7";
    del.addEventListener("click", () => {
      saveTodos(loadTodos().filter((x) => x.id !== todo.id));
      renderTodos();
    });
    row.appendChild(check);
    row.appendChild(text);
    row.appendChild(del);
    list.appendChild(row);
  });
}
function addTodo(text) {
  const all = loadTodos();
  all.push({ id: Date.now().toString(), text: text.trim(), done: false });
  saveTodos(all);
  renderTodos();
}
var PANEL_SIZES = ["bw-sz-s", "bw-sz-m", "bw-sz-l"];
function injectResizeBtns(panel, headerSel) {
  const header = panel.querySelector(headerSel);
  if (!header) return;
  let szIdx = 1;
  panel.classList.add(PANEL_SIZES[szIdx]);
  const wrap = document.createElement("div");
  wrap.className = "bw-resize-btns";
  const minus = document.createElement("button");
  minus.className = "bw-resize-btn";
  minus.textContent = "\u2212";
  minus.disabled = true;
  const plus = document.createElement("button");
  plus.className = "bw-resize-btn";
  plus.textContent = "+";
  const apply = (delta) => {
    panel.classList.remove(PANEL_SIZES[szIdx]);
    szIdx = Math.max(0, Math.min(PANEL_SIZES.length - 1, szIdx + delta));
    panel.classList.add(PANEL_SIZES[szIdx]);
    minus.disabled = szIdx === 0;
    plus.disabled = szIdx === PANEL_SIZES.length - 1;
  };
  minus.addEventListener("click", (e) => {
    e.stopPropagation();
    apply(-1);
  });
  plus.addEventListener("click", (e) => {
    e.stopPropagation();
    apply(1);
  });
  wrap.appendChild(minus);
  wrap.appendChild(plus);
  header.appendChild(wrap);
}
function initTodo() {
  const btn = document.getElementById("todoBtn");
  const panel = document.getElementById("todoPanel");
  const input = document.getElementById("todoInput");
  const addBtn = document.getElementById("todoAddBtn");
  if (!btn || !panel) return;
  panel.addEventListener("click", (e) => e.stopPropagation());
  injectResizeBtns(panel, ".bw-panel-header");
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const opening = !panel.classList.contains("open");
    document.getElementById("notesPanel")?.classList.remove("open");
    panel.classList.toggle("open", opening);
    if (opening) {
      renderTodos();
      input?.focus();
    }
  });
  addBtn?.addEventListener("click", () => {
    if (!input?.value.trim()) return;
    addTodo(input.value);
    input.value = "";
    input.focus();
  });
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && input.value.trim()) {
      addTodo(input.value);
      input.value = "";
    }
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn)
      panel.classList.remove("open");
  });
}

// src/modules/notes.ts
var NOTES_KEY = "dudidesk_notes";
var MAX_TABS = 7;
function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
  }
  return { tabs: [{ id: "1", name: "NOTE 1", content: "" }], activeIdx: 0 };
}
function saveNotes(state) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(state));
}
var undoStack = null;
function renderNotesTabs(state, textarea) {
  const bar = document.getElementById("notesTabsBar");
  if (!bar) return;
  bar.innerHTML = "";
  let dragIdx = -1;
  bar.onpointerup = () => {
    dragIdx = -1;
    bar.querySelectorAll(".dragging").forEach((t) => t.classList.remove("dragging"));
  };
  state.tabs.forEach((tab, idx) => {
    const el = document.createElement("div");
    el.className = "note-tab" + (idx === state.activeIdx ? " active" : "");
    const label = document.createElement("span");
    label.textContent = tab.name;
    el.addEventListener("click", () => {
      state.activeIdx = idx;
      saveNotes(state);
      textarea.value = state.tabs[idx].content;
      renderNotesTabs(state, textarea);
    });
    el.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const inp = document.createElement("input");
      inp.className = "note-tab-rename";
      inp.value = tab.name;
      inp.maxLength = 12;
      bar.replaceChild(inp, el);
      inp.focus();
      inp.select();
      const finish = () => {
        state.tabs[idx].name = inp.value.trim() || tab.name;
        saveNotes(state);
        renderNotesTabs(state, textarea);
      };
      inp.addEventListener("blur", finish);
      inp.addEventListener("keydown", (k) => {
        if (k.key === "Enter") inp.blur();
      });
    });
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".note-tab-del")) return;
      dragIdx = idx;
      el.classList.add("dragging");
    });
    el.addEventListener("pointerup", () => {
      if (dragIdx >= 0 && dragIdx !== idx) {
        const tmp = state.tabs[dragIdx];
        state.tabs[dragIdx] = state.tabs[idx];
        state.tabs[idx] = tmp;
        if (state.activeIdx === dragIdx) state.activeIdx = idx;
        else if (state.activeIdx === idx) state.activeIdx = dragIdx;
        saveNotes(state);
        textarea.value = state.tabs[state.activeIdx].content;
        renderNotesTabs(state, textarea);
      }
      dragIdx = -1;
    });
    el.appendChild(label);
    if (state.tabs.length > 1) {
      const del = document.createElement("button");
      del.className = "note-tab-del";
      del.textContent = "\xD7";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        undoStack = { tab: { ...state.tabs[idx] }, index: idx };
        state.tabs.splice(idx, 1);
        state.activeIdx = Math.min(state.activeIdx, state.tabs.length - 1);
        saveNotes(state);
        textarea.value = state.tabs[state.activeIdx].content;
        renderNotesTabs(state, textarea);
      });
      el.appendChild(del);
    }
    bar.appendChild(el);
  });
  if (state.tabs.length < MAX_TABS) {
    const addBtn = document.createElement("button");
    addBtn.className = "note-tab-add";
    addBtn.textContent = "+";
    addBtn.addEventListener("click", () => {
      const n = state.tabs.length + 1;
      state.tabs.push({ id: Date.now().toString(), name: `NOTE ${n}`, content: "" });
      state.activeIdx = state.tabs.length - 1;
      saveNotes(state);
      textarea.value = "";
      renderNotesTabs(state, textarea);
      textarea.focus();
    });
    bar.appendChild(addBtn);
  }
  if (undoStack) {
    const undoBtn = document.createElement("button");
    undoBtn.className = "note-tab-undo";
    undoBtn.textContent = "\u21A9";
    undoBtn.title = "UNDO";
    undoBtn.addEventListener("click", () => {
      if (!undoStack) return;
      const insertAt = Math.min(undoStack.index, state.tabs.length);
      state.tabs.splice(insertAt, 0, undoStack.tab);
      state.activeIdx = insertAt;
      saveNotes(state);
      textarea.value = undoStack.tab.content;
      undoStack = null;
      renderNotesTabs(state, textarea);
    });
    bar.appendChild(undoBtn);
  }
}
function initNotes() {
  const btn = document.getElementById("notesBtn");
  const panel = document.getElementById("notesPanel");
  const textarea = document.getElementById("notesTextarea");
  if (!btn || !panel || !textarea) return;
  panel.addEventListener("click", (e) => e.stopPropagation());
  const notesHeader = document.createElement("div");
  notesHeader.className = "bw-panel-header";
  notesHeader.textContent = "// NOTES";
  panel.prepend(notesHeader);
  {
    const PANEL_SIZES_N = ["bw-sz-s", "bw-sz-m", "bw-sz-l"];
    let szIdx = 1;
    panel.classList.add(PANEL_SIZES_N[szIdx]);
    const wrap = document.createElement("div");
    wrap.className = "bw-resize-btns";
    const minus = document.createElement("button");
    minus.className = "bw-resize-btn";
    minus.textContent = "\u2212";
    minus.disabled = true;
    const plus = document.createElement("button");
    plus.className = "bw-resize-btn";
    plus.textContent = "+";
    const apply = (delta) => {
      panel.classList.remove(PANEL_SIZES_N[szIdx]);
      szIdx = Math.max(0, Math.min(PANEL_SIZES_N.length - 1, szIdx + delta));
      panel.classList.add(PANEL_SIZES_N[szIdx]);
      minus.disabled = szIdx === 0;
      plus.disabled = szIdx === PANEL_SIZES_N.length - 1;
    };
    minus.addEventListener("click", (e) => {
      e.stopPropagation();
      apply(-1);
    });
    plus.addEventListener("click", (e) => {
      e.stopPropagation();
      apply(1);
    });
    wrap.appendChild(minus);
    wrap.appendChild(plus);
    notesHeader.appendChild(wrap);
  }
  let state = loadNotes();
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const opening = !panel.classList.contains("open");
    document.getElementById("todoPanel")?.classList.remove("open");
    panel.classList.toggle("open", opening);
    if (opening) {
      state = loadNotes();
      textarea.value = state.tabs[state.activeIdx]?.content ?? "";
      renderNotesTabs(state, textarea);
      textarea.focus();
    }
  });
  textarea.addEventListener("input", () => {
    const tab = state.tabs[state.activeIdx];
    if (tab) {
      tab.content = textarea.value;
      saveNotes(state);
    }
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn)
      panel.classList.remove("open");
  });
}

// src/modules/timer.ts
var remaining = 0;
var interval = 0;
var alarmCtx = null;
var alarmLoop = 0;
var masterGain = null;
var volume = 0.5;
function pad(n) {
  return n.toString().padStart(2, "0");
}
function updateDisplay(sec) {
  const display = document.getElementById("timerDisplay");
  if (display) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    display.textContent = `${pad(m)}:${pad(s)}`;
  }
}
function playMelody(ctx) {
  if (!masterGain) return;
  const notes = [
    523,
    659,
    784,
    1047,
    0,
    523,
    659,
    784,
    1047,
    0,
    880,
    784,
    659,
    523,
    0
  ];
  const dur = 0.1;
  const gap = 0.05;
  const step = dur + gap;
  notes.forEach((freq, i) => {
    if (freq === 0) return;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(1, ctx.currentTime + i * step);
    noteGain.gain.setValueAtTime(0, ctx.currentTime + i * step + dur);
    osc.connect(noteGain);
    noteGain.connect(masterGain);
    osc.start(ctx.currentTime + i * step);
    osc.stop(ctx.currentTime + i * step + dur + 0.01);
  });
}
function startAlarm() {
  alarmCtx = new AudioContext();
  masterGain = alarmCtx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(alarmCtx.destination);
  playMelody(alarmCtx);
  alarmLoop = window.setInterval(() => {
    if (alarmCtx) playMelody(alarmCtx);
  }, 2300);
}
function stopAlarm() {
  clearInterval(alarmLoop);
  alarmLoop = 0;
  masterGain = null;
  if (alarmCtx) {
    void alarmCtx.close();
    alarmCtx = null;
  }
}
function setRunning(running) {
  const startBtn = document.getElementById("timerStartBtn");
  const stopBtn = document.getElementById("timerStopBtn");
  const minInput = document.getElementById("timerMin");
  const secInput = document.getElementById("timerSec");
  if (startBtn) startBtn.textContent = running ? "PAUSE" : "START";
  if (stopBtn) stopBtn.textContent = running ? "STOP" : "RESET";
  if (minInput) minInput.disabled = running;
  if (secInput) secInput.disabled = running;
}
function showAlarmOverlay() {
  let overlay = document.querySelector(".timer-alarm-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "confirm-overlay timer-alarm-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-msg">// TIME'S UP!</div>
      <div class="confirm-actions">
        <button class="btn-add" id="timerDismissBtn">DISMISS</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  overlay.querySelector("#timerDismissBtn").addEventListener("click", () => {
    overlay.classList.remove("open");
    stopAlarm();
  });
}
function initTimer() {
  const btn = document.getElementById("timerBtn");
  const panel = document.getElementById("timerPanel");
  const startBtn = document.getElementById("timerStartBtn");
  const stopBtn = document.getElementById("timerStopBtn");
  const minInput = document.getElementById("timerMin");
  const secInput = document.getElementById("timerSec");
  if (!btn || !panel || !startBtn || !stopBtn || !minInput || !secInput) return;
  panel.addEventListener("click", (e) => e.stopPropagation());
  const volSlider = document.getElementById("timerVol");
  const volVal = document.getElementById("timerVolVal");
  volSlider?.addEventListener("input", () => {
    const v = parseInt(volSlider.value) || 0;
    volume = v / 100;
    if (volVal) volVal.textContent = String(v);
    if (masterGain) masterGain.gain.value = volume;
  });
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const opening = !panel.classList.contains("open");
    document.getElementById("todoPanel")?.classList.remove("open");
    document.getElementById("notesPanel")?.classList.remove("open");
    panel.classList.toggle("open", opening);
  });
  let paused = false;
  startBtn.addEventListener("click", () => {
    if (interval && !paused) {
      clearInterval(interval);
      interval = 0;
      paused = true;
      startBtn.textContent = "START";
      return;
    }
    if (paused) {
      paused = false;
    } else {
      const m = Math.max(0, parseInt(minInput.value) || 0);
      const s = Math.max(0, Math.min(59, parseInt(secInput.value) || 0));
      remaining = m * 60 + s;
      if (remaining <= 0) return;
    }
    setRunning(true);
    interval = window.setInterval(() => {
      remaining--;
      updateDisplay(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        interval = 0;
        paused = false;
        setRunning(false);
        updateDisplay(0);
        startAlarm();
        showAlarmOverlay();
      }
    }, 1e3);
  });
  stopBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = 0;
    paused = false;
    remaining = 0;
    stopAlarm();
    setRunning(false);
    updateDisplay(0);
  });
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== btn)
      panel.classList.remove("open");
  });
}

// src/modules/sticky.ts
var STICKY_KEY = "dudidesk_stickies";
var MAX = 12;
var SIZE = 210;
var COLORS = [
  { id: "yellow", bg: "#f5e643", text: "#4a4210" },
  { id: "pink", bg: "#f06ca5", text: "#3d1028" },
  { id: "blue", bg: "#6ab4f5", text: "#122e45" },
  { id: "green", bg: "#5ee89a", text: "#133d24" },
  { id: "lavender", bg: "#b07af5", text: "#2a1245" },
  { id: "peach", bg: "#f5a84e", text: "#3d2a10" },
  { id: "mint", bg: "#4ee8c8", text: "#103d33" },
  { id: "coral", bg: "#f56e6e", text: "#3d1212" }
];
var colorIdx = 0;
function load() {
  try {
    return JSON.parse(localStorage.getItem(STICKY_KEY) || "[]");
  } catch {
    return [];
  }
}
function save(list) {
  localStorage.setItem(STICKY_KEY, JSON.stringify(list));
}
function overlapsPanel(x, y) {
  const panel = document.querySelector(".icon-panel");
  if (!panel) return false;
  const r = panel.getBoundingClientRect();
  return x + SIZE > r.left && x < r.right && y + SIZE > r.top && y < r.bottom;
}
function clamp(x, y) {
  return {
    x: Math.max(0, Math.min(window.innerWidth - SIZE, x)),
    y: Math.max(0, Math.min(window.innerHeight - SIZE, y))
  };
}
function makeSticky(note, layer) {
  const el = document.createElement("div");
  el.className = "sticky-note";
  el.dataset.id = note.id;
  const c = COLORS.find((c2) => c2.id === note.color) || COLORS[0];
  el.style.left = note.x + "px";
  el.style.top = note.y + "px";
  el.style.background = c.bg;
  el.style.color = c.text;
  const del = document.createElement("button");
  del.className = "sticky-del";
  del.textContent = "\xD7";
  del.style.color = c.text;
  del.addEventListener("click", (e) => {
    e.stopPropagation();
    el.classList.add("sticky-falling");
    el.addEventListener("animationend", () => {
      el.remove();
      const list = load().filter((s) => s.id !== note.id);
      save(list);
    });
  });
  const textarea = document.createElement("textarea");
  textarea.className = "sticky-text";
  textarea.value = note.text;
  textarea.placeholder = "drag me by the top bar and drop me anywhere on your desk!";
  textarea.style.color = c.text;
  textarea.addEventListener("input", () => {
    const list = load();
    const s = list.find((s2) => s2.id === note.id);
    if (s) {
      s.text = textarea.value;
      save(list);
    }
  });
  const header = document.createElement("div");
  header.className = "sticky-header";
  let dragging2 = false;
  let ox = 0, oy = 0;
  let prevX = note.x, prevY = note.y;
  header.addEventListener("pointerdown", (e) => {
    dragging2 = true;
    ox = e.clientX - note.x;
    oy = e.clientY - note.y;
    prevX = note.x;
    prevY = note.y;
    el.classList.add("sticky-dragging");
    header.setPointerCapture(e.pointerId);
  });
  header.addEventListener("pointermove", (e) => {
    if (!dragging2) return;
    const pos = clamp(e.clientX - ox, e.clientY - oy);
    note.x = pos.x;
    note.y = pos.y;
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
  });
  header.addEventListener("pointerup", () => {
    if (!dragging2) return;
    dragging2 = false;
    el.classList.remove("sticky-dragging");
    if (overlapsPanel(note.x, note.y)) {
      note.x = prevX;
      note.y = prevY;
      el.style.left = prevX + "px";
      el.style.top = prevY + "px";
    }
    const list = load();
    const s = list.find((s2) => s2.id === note.id);
    if (s) {
      s.x = note.x;
      s.y = note.y;
      save(list);
    }
  });
  el.appendChild(header);
  el.appendChild(del);
  el.appendChild(textarea);
  layer.appendChild(el);
  return el;
}
function addSticky() {
  const list = load();
  if (list.length >= MAX) return;
  const c = COLORS[colorIdx % COLORS.length];
  colorIdx++;
  const pos = clamp(
    100 + Math.random() * (window.innerWidth - SIZE - 200),
    100 + Math.random() * (window.innerHeight - SIZE - 200)
  );
  if (overlapsPanel(pos.x, pos.y)) {
    pos.x = 60;
    pos.y = 60;
  }
  const note = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    x: pos.x,
    y: pos.y,
    text: "",
    color: c.id
  };
  list.push(note);
  save(list);
  const layer = document.getElementById("stickyLayer");
  if (layer) makeSticky(note, layer);
}
function initSticky() {
  const layer = document.getElementById("stickyLayer");
  const addBtn = document.getElementById("stickyAddBtn");
  if (!layer || !addBtn) return;
  const stickies = load();
  colorIdx = stickies.length;
  stickies.forEach((note) => makeSticky(note, layer));
  addBtn.addEventListener("click", addSticky);
}

// src/main.ts
function init() {
  loadPrefs();
  applyTheme(prefs.mode, prefs.size);
  applyTitle(prefs.title);
  setActiveBtn("modeRow", prefs.mode);
  setActiveBtn("sizeRow", prefs.size);
  setActiveBtn("bgRow", prefs.bg);
  initSettings();
  initModal();
  initFolder();
  initTabs();
  render();
  initClock();
  initWeather();
  initTodo();
  initNotes();
  initTimer();
  initSticky();
  requestAnimationFrame(() => {
    applyBg(prefs.bg);
    applyPanelOpacity(prefs.opacity);
  });
  window.addEventListener("resize", () => {
    applyBg(prefs.bg);
    applyResponsiveScale();
  });
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
//# sourceMappingURL=bundle.js.map
