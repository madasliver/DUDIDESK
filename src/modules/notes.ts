interface NoteTab {
  id: string;
  name: string;
  content: string;
}

interface NotesState {
  tabs: NoteTab[];
  activeIdx: number;
}

const NOTES_KEY = "dudidesk_notes";
const MAX_TABS = 7;

function loadNotes(): NotesState {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) return JSON.parse(raw) as NotesState;
  } catch { /* */ }
  return { tabs: [{ id: "1", name: "NOTE 1", content: "" }], activeIdx: 0 };
}

function saveNotes(state: NotesState): void {
  localStorage.setItem(NOTES_KEY, JSON.stringify(state));
}

function renderNotesTabs(state: NotesState, textarea: HTMLTextAreaElement): void {
  const bar = document.getElementById("notesTabsBar");
  if (!bar) return;
  bar.innerHTML = "";

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

    el.addEventListener("dblclick", e => {
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
      inp.addEventListener("keydown", k => { if (k.key === "Enter") inp.blur(); });
    });

    el.appendChild(label);

    if (state.tabs.length > 1) {
      const del = document.createElement("button");
      del.className = "note-tab-del";
      del.textContent = "×";
      del.addEventListener("click", e => {
        e.stopPropagation();
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
}

export function initNotes(): void {
  const btn = document.getElementById("notesBtn");
  const panel = document.getElementById("notesPanel");
  const textarea = document.getElementById("notesTextarea") as HTMLTextAreaElement | null;
  if (!btn || !panel || !textarea) return;

  panel.addEventListener("click", e => e.stopPropagation());

  let state = loadNotes();

  btn.addEventListener("click", e => {
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
    if (tab) { tab.content = textarea.value; saveNotes(state); }
  });

  document.addEventListener("click", e => {
    if (!panel.contains(e.target as Node) && e.target !== btn)
      panel.classList.remove("open");
  });
}
