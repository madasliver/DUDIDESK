interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

const STICKY_KEY = "dudidesk_stickies";
const MAX = 8;
const SIZE = 160;

const COLORS = [
  { id: "yellow",   bg: "#f5e643", text: "#4a4210" },
  { id: "pink",     bg: "#f06ca5", text: "#3d1028" },
  { id: "blue",     bg: "#6ab4f5", text: "#122e45" },
  { id: "green",    bg: "#5ee89a", text: "#133d24" },
  { id: "lavender", bg: "#b07af5", text: "#2a1245" },
  { id: "peach",    bg: "#f5a84e", text: "#3d2a10" },
  { id: "mint",     bg: "#4ee8c8", text: "#103d33" },
  { id: "coral",    bg: "#f56e6e", text: "#3d1212" },
];

let colorIdx = 0;

function load(): StickyNote[] {
  try { return JSON.parse(localStorage.getItem(STICKY_KEY) || "[]"); }
  catch { return []; }
}

function save(list: StickyNote[]): void {
  localStorage.setItem(STICKY_KEY, JSON.stringify(list));
}

function overlapsPanel(x: number, y: number): boolean {
  const panel = document.querySelector(".icon-panel");
  if (!panel) return false;
  const r = panel.getBoundingClientRect();
  return x + SIZE > r.left && x < r.right && y + SIZE > r.top && y < r.bottom;
}

function clamp(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(window.innerWidth - SIZE, x)),
    y: Math.max(0, Math.min(window.innerHeight - SIZE, y)),
  };
}

function makeSticky(note: StickyNote, layer: HTMLElement): HTMLElement {
  const el = document.createElement("div");
  el.className = "sticky-note";
  el.dataset.id = note.id;

  const c = COLORS.find(c => c.id === note.color) || COLORS[0];
  el.style.left = note.x + "px";
  el.style.top = note.y + "px";
  el.style.background = c.bg;
  el.style.color = c.text;

  const del = document.createElement("button");
  del.className = "sticky-del";
  del.textContent = "×";
  del.style.color = c.text;
  del.addEventListener("click", e => {
    e.stopPropagation();
    el.classList.add("sticky-falling");
    el.addEventListener("animationend", () => {
      el.remove();
      const list = load().filter(s => s.id !== note.id);
      save(list);
    });
  });

  const textarea = document.createElement("textarea");
  textarea.className = "sticky-text";
  textarea.value = note.text;
  textarea.placeholder = "...";
  textarea.style.color = c.text;
  textarea.addEventListener("input", () => {
    const list = load();
    const s = list.find(s => s.id === note.id);
    if (s) { s.text = textarea.value; save(list); }
  });

  // drag via header area (top 24px)
  const header = document.createElement("div");
  header.className = "sticky-header";

  let dragging = false;
  let ox = 0, oy = 0;
  let prevX = note.x, prevY = note.y;

  header.addEventListener("pointerdown", e => {
    dragging = true;
    ox = e.clientX - note.x;
    oy = e.clientY - note.y;
    prevX = note.x;
    prevY = note.y;
    el.classList.add("sticky-dragging");
    header.setPointerCapture(e.pointerId);
  });

  header.addEventListener("pointermove", e => {
    if (!dragging) return;
    const pos = clamp(e.clientX - ox, e.clientY - oy);
    note.x = pos.x;
    note.y = pos.y;
    el.style.left = pos.x + "px";
    el.style.top = pos.y + "px";
  });

  header.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("sticky-dragging");
    if (overlapsPanel(note.x, note.y)) {
      note.x = prevX;
      note.y = prevY;
      el.style.left = prevX + "px";
      el.style.top = prevY + "px";
    }
    const list = load();
    const s = list.find(s => s.id === note.id);
    if (s) { s.x = note.x; s.y = note.y; save(list); }
  });

  el.appendChild(header);
  el.appendChild(del);
  el.appendChild(textarea);
  layer.appendChild(el);
  return el;
}

function addSticky(): void {
  const list = load();
  if (list.length >= MAX) return;

  const c = COLORS[colorIdx % COLORS.length];
  colorIdx++;

  const pos = clamp(
    100 + Math.random() * (window.innerWidth - SIZE - 200),
    100 + Math.random() * (window.innerHeight - SIZE - 200),
  );

  // avoid icon panel
  if (overlapsPanel(pos.x, pos.y)) {
    pos.x = 60;
    pos.y = 60;
  }

  const note: StickyNote = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    x: pos.x,
    y: pos.y,
    text: "",
    color: c.id,
  };

  list.push(note);
  save(list);

  const layer = document.getElementById("stickyLayer");
  if (layer) makeSticky(note, layer);
}

export function initSticky(): void {
  const layer = document.getElementById("stickyLayer");
  const addBtn = document.getElementById("stickyAddBtn");
  if (!layer || !addBtn) return;

  const stickies = load();
  colorIdx = stickies.length;
  stickies.forEach(note => makeSticky(note, layer));

  addBtn.addEventListener("click", addSticky);
}
