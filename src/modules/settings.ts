import type { ModeId, SizeId, BgId } from "../types";
import { prefs, savePrefs } from "./state";
import { applyTheme, applyTitle, applyPanelOpacity, setActiveBtn } from "./theme";
import { applyBg } from "./background";
import { render } from "./render";

const dropdown = () => document.getElementById("settingsDropdown")!;
let savedState: typeof prefs | null = null;

function openDropdown(): void {
  savedState = { ...prefs };
  (document.getElementById("titleInput") as HTMLInputElement).value = prefs.title || "DUDI";
  const v = prefs.opacity ?? 4;
  (document.getElementById("opacitySlider") as HTMLInputElement).value = String(v);
  document.getElementById("opacityVal")!.textContent = String(v);
  dropdown().classList.add("open");
}

function closeDropdown(): void {
  dropdown().classList.remove("open");
}

function revertUnsaved(): void {
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

export function initSettings(): void {
  document.getElementById("settingsBtn")!.addEventListener("click", e => {
    e.stopPropagation();
    dropdown().classList.contains("open") ? closeDropdown() : openDropdown();
  });

  document.addEventListener("click", e => {
    if (
      !document.querySelector(".settings-wrap")!.contains(e.target as Node) &&
      dropdown().classList.contains("open")
    ) {
      revertUnsaved();
      closeDropdown();
    }
  });

  document.getElementById("modeRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.mode = b.dataset.mode as ModeId;
    setActiveBtn("modeRow", prefs.mode);
    applyTheme(prefs.mode, prefs.size);
  });

  document.getElementById("sizeRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.size = b.dataset.size as SizeId;
    setActiveBtn("sizeRow", prefs.size);
    applyTheme(prefs.mode, prefs.size);
    render();
  });

  document.getElementById("bgRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.bg = b.dataset.bg as BgId;
    setActiveBtn("bgRow", prefs.bg);
    applyBg(prefs.bg);
  });

  document.getElementById("titleInput")!.addEventListener("input", e => {
    applyTitle((e.target as HTMLInputElement).value.trim() || "DUDI");
  });

  document.getElementById("opacitySlider")!.addEventListener("input", e => {
    const v = parseInt((e.target as HTMLInputElement).value);
    document.getElementById("opacityVal")!.textContent = String(v);
    applyPanelOpacity(v);
  });

  document.getElementById("btnSave")!.addEventListener("click", () => {
    const t = (document.getElementById("titleInput") as HTMLInputElement).value.trim().toUpperCase();
    if (t) prefs.title = t;
    prefs.opacity = parseInt((document.getElementById("opacitySlider") as HTMLInputElement).value);
    savePrefs();
    applyTitle(prefs.title);
    applyPanelOpacity(prefs.opacity);
    closeDropdown();
  });
}
