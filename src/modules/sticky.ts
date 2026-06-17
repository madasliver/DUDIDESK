interface StickyNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

const STICKY_KEY = "dudidesk_stickies";
const MAX = 12;
const SIZE = 210;

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

const PROTECTED = [".icon-panel", ".tab-bar", ".search-panel", ".wordmark", ".icon-panel-wrap"];

function overlapsProtected(x: number, y: number, w: number, h: number): boolean {
  for (const sel of PROTECTED) {
    const el = document.querySelector(sel);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (x + w > r.left && x < r.right && y + h > r.top && y < r.bottom) return true;
  }
  return false;
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
    el.style.pointerEvents = "none";

    const dir = 1;
    const drift = Math.round(40 + Math.random() * 80) * dir;
    const spin = Math.round(8 + Math.random() * 20) * dir;
    const dur = 1400 + Math.round(Math.random() * 800);

    const frames: Keyframe[] = [
      { transform: "translateY(0) translateX(0) rotate(0deg)", offset: 0 },
      { transform: `translateY(70px) translateX(${drift * 0.2}px) rotate(${spin * 0.4}deg)`, offset: 0.15 },
      { transform: `translateY(200px) translateX(${drift * 0.5}px) rotate(${-spin * 0.6}deg)`, offset: 0.3 },
      { transform: `translateY(420px) translateX(${drift * 0.8}px) rotate(${spin * 0.8}deg)`, offset: 0.5 },
      { transform: `translateY(700px) translateX(${drift}px) rotate(${-spin}deg)`, offset: 0.7 },
      { transform: `translateY(120vh) translateX(${drift * 1.2}px) rotate(${spin * 1.3}deg)`, offset: 1 },
    ];

    const anim = el.animate(frames, {
      duration: dur,
      easing: "cubic-bezier(0.15, 0, 0.9, 0.4)",
      fill: "forwards",
    });

    anim.onfinish = () => {
      el.remove();
      const list = load().filter(s => s.id !== note.id);
      save(list);
    };
  });

  const textarea = document.createElement("textarea");
  textarea.className = "sticky-text";
  textarea.value = note.text;
  textarea.placeholder = "drag me by the top bar and drop me anywhere on your desk!";
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
    if (overlapsProtected(note.x, note.y, SIZE, SIZE)) {
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
  if (overlapsProtected(pos.x, pos.y, SIZE, SIZE)) {
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
