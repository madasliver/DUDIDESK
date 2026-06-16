const SUGGEST_URL =
  "https://suggestqueries.google.com/complete/search?client=firefox&q=";
const MAX = 6;

export function initSuggestions(): void {
  const formEl = document.querySelector<HTMLFormElement>(".search-panel");
  const inputEl = formEl?.querySelector<HTMLInputElement>("input[name=q]");
  if (!formEl || !inputEl) return;
  const form = formEl;
  const input = inputEl;

  const dropdown = document.createElement("div");
  dropdown.className = "sug-dropdown";
  form.appendChild(dropdown);

  let timer = 0;
  let activeIdx = -1;
  let suggestions: string[] = [];

  function close(): void {
    dropdown.innerHTML = "";
    dropdown.classList.remove("open");
    activeIdx = -1;
    suggestions = [];
  }

  function setActive(idx: number): void {
    dropdown.querySelectorAll<HTMLElement>(".sug-item").forEach((el, i) =>
      el.classList.toggle("active", i === idx)
    );
    activeIdx = idx;
  }

  function submit(value: string): void {
    input.value = value;
    close();
    form.requestSubmit();
  }

  function render(list: string[]): void {
    suggestions = list.slice(0, MAX);
    activeIdx = -1;
    dropdown.innerHTML = "";
    if (!suggestions.length) { dropdown.classList.remove("open"); return; }
    suggestions.forEach((sug, i) => {
      const el = document.createElement("div");
      el.className = "sug-item";
      el.textContent = sug;
      el.addEventListener("mousedown", e => { e.preventDefault(); submit(sug); });
      el.addEventListener("mouseover", () => setActive(i));
      dropdown.appendChild(el);
    });
    dropdown.classList.add("open");
  }

  async function fetchSuggestions(q: string): Promise<void> {
    try {
      const res = await fetch(SUGGEST_URL + encodeURIComponent(q));
      const data = await res.json() as unknown[];
      const list = Array.isArray(data[1]) ? (data[1] as string[]) : [];
      if (input.value.trim()) render(list);
    } catch { close(); }
  }

  input.addEventListener("input", () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { close(); return; }
    timer = window.setTimeout(() => void fetchSuggestions(q), 300);
  });

  input.addEventListener("keydown", e => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(activeIdx + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(activeIdx - 1, -1));
    } else if (e.key === "Escape") {
      close();
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      submit(suggestions[activeIdx]);
    }
  });

  input.addEventListener("blur", () => setTimeout(close, 150));
}
