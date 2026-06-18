import type { ModeId, SizeId, BgId, ClockStyle } from "../types";
import { prefs, savePrefs } from "./state";
import { applyTheme, applyTitle, applyPanelOpacity, setActiveBtn } from "./theme";
import { applyBg } from "./background";
import { render } from "./render";
import { applyClockStyle } from "./clock";

const dropdown = () => document.getElementById("settingsDropdown")!;

function openDropdown(): void {
  (document.getElementById("titleInput") as HTMLInputElement).value = prefs.title || "DUDI";
  const v = prefs.opacity ?? 4;
  (document.getElementById("opacitySlider") as HTMLInputElement).value = String(v);
  document.getElementById("opacityVal")!.textContent = String(v);
  setActiveBtn("clockRow", prefs.clockStyle);
  dropdown().classList.add("open");
}

function closeDropdown(): void {
  dropdown().classList.remove("open");
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
      closeDropdown();
    }
  });

  document.getElementById("modeRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.mode = b.dataset.mode as ModeId;
    setActiveBtn("modeRow", prefs.mode);
    applyTheme(prefs.mode, prefs.size);
    savePrefs();
  });

  document.getElementById("sizeRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.size = b.dataset.size as SizeId;
    setActiveBtn("sizeRow", prefs.size);
    applyTheme(prefs.mode, prefs.size);
    render();
    savePrefs();
  });

  document.getElementById("bgRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.bg = b.dataset.bg as BgId;
    setActiveBtn("bgRow", prefs.bg);
    applyBg(prefs.bg);
    savePrefs();
  });

  document.getElementById("clockRow")!.addEventListener("click", e => {
    const b = (e.target as HTMLElement).closest<HTMLElement>(".tog-btn");
    if (!b) return;
    prefs.clockStyle = b.dataset.clock as ClockStyle;
    setActiveBtn("clockRow", prefs.clockStyle);
    applyClockStyle(prefs.clockStyle);
    savePrefs();
  });

  document.getElementById("titleInput")!.addEventListener("input", e => {
    const t = (e.target as HTMLInputElement).value.trim().toUpperCase() || "DUDI";
    prefs.title = t;
    applyTitle(t);
    savePrefs();
  });

  document.getElementById("opacitySlider")!.addEventListener("input", e => {
    const v = parseInt((e.target as HTMLInputElement).value);
    prefs.opacity = v;
    document.getElementById("opacityVal")!.textContent = String(v);
    applyPanelOpacity(v);
    savePrefs();
  });
}
