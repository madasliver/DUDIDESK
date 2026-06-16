interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const TODO_KEY = "dudidesk_todos";

function loadTodos(): TodoItem[] {
  try { return JSON.parse(localStorage.getItem(TODO_KEY) || "[]"); }
  catch { return []; }
}

function saveTodos(todos: TodoItem[]): void {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

function renderTodos(): void {
  const list = document.getElementById("todoList");
  if (!list) return;
  const todos = loadTodos().sort((a, b) => Number(a.done) - Number(b.done));
  list.innerHTML = "";

  todos.forEach(todo => {
    const row = document.createElement("div");
    row.className = "todo-item" + (todo.done ? " done" : "");

    const check = document.createElement("button");
    check.className = "todo-check";
    check.textContent = todo.done ? "✓" : "";
    check.addEventListener("click", () => {
      const all = loadTodos();
      const t = all.find(x => x.id === todo.id);
      if (t) { t.done = !t.done; saveTodos(all); renderTodos(); }
    });

    const text = document.createElement("span");
    text.className = "todo-text";
    text.textContent = todo.text;

    const del = document.createElement("button");
    del.className = "todo-del";
    del.textContent = "×";
    del.addEventListener("click", () => {
      saveTodos(loadTodos().filter(x => x.id !== todo.id));
      renderTodos();
    });

    row.appendChild(check);
    row.appendChild(text);
    row.appendChild(del);
    list.appendChild(row);
  });
}

function addTodo(text: string): void {
  const all = loadTodos();
  all.push({ id: Date.now().toString(), text: text.trim(), done: false });
  saveTodos(all);
  renderTodos();
}

const PANEL_SIZES = ["bw-sz-s", "bw-sz-m", "bw-sz-l"] as const;

function injectResizeBtns(panel: HTMLElement, headerSel: string): void {
  const header = panel.querySelector(headerSel);
  if (!header) return;
  let szIdx = 1;
  panel.classList.add(PANEL_SIZES[szIdx]);

  const wrap = document.createElement("div");
  wrap.className = "bw-resize-btns";

  const minus = document.createElement("button");
  minus.className = "bw-resize-btn";
  minus.textContent = "−";
  (minus as HTMLButtonElement).disabled = true;

  const plus = document.createElement("button");
  plus.className = "bw-resize-btn";
  plus.textContent = "+";

  const apply = (delta: number): void => {
    panel.classList.remove(PANEL_SIZES[szIdx]);
    szIdx = Math.max(0, Math.min(PANEL_SIZES.length - 1, szIdx + delta));
    panel.classList.add(PANEL_SIZES[szIdx]);
    (minus as HTMLButtonElement).disabled = szIdx === 0;
    (plus as HTMLButtonElement).disabled = szIdx === PANEL_SIZES.length - 1;
  };

  minus.addEventListener("click", e => { e.stopPropagation(); apply(-1); });
  plus.addEventListener("click", e => { e.stopPropagation(); apply(1); });
  wrap.appendChild(minus);
  wrap.appendChild(plus);
  header.appendChild(wrap);
}

export function initTodo(): void {
  const btn = document.getElementById("todoBtn");
  const panel = document.getElementById("todoPanel");
  const input = document.getElementById("todoInput") as HTMLInputElement | null;
  const addBtn = document.getElementById("todoAddBtn");
  if (!btn || !panel) return;

  panel.addEventListener("click", e => e.stopPropagation());
  injectResizeBtns(panel, ".bw-panel-header");

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const opening = !panel.classList.contains("open");
    document.getElementById("notesPanel")?.classList.remove("open");
    panel.classList.toggle("open", opening);
    if (opening) { renderTodos(); input?.focus(); }
  });

  addBtn?.addEventListener("click", () => {
    if (!input?.value.trim()) return;
    addTodo(input.value);
    input.value = "";
    input.focus();
  });

  input?.addEventListener("keydown", e => {
    if (e.key === "Enter" && input.value.trim()) {
      addTodo(input.value);
      input.value = "";
    }
  });

  document.addEventListener("click", e => {
    if (!panel.contains(e.target as Node) && e.target !== btn)
      panel.classList.remove("open");
  });
}
