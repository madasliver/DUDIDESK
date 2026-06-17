import { loadPrefs, prefs } from "./modules/state";
import { applyTheme, applyTitle, applyPanelOpacity, applyResponsiveScale, setActiveBtn } from "./modules/theme";
import { applyBg } from "./modules/background";
import { render } from "./modules/render";
import { initModal } from "./modules/modal";
import { initFolder } from "./modules/folder";
import { initSettings } from "./modules/settings";
import { initTabs } from "./modules/tabs";
import { initClock } from "./modules/clock";
import { initWeather } from "./modules/weather";
import { initTodo } from "./modules/todo";
import { initNotes } from "./modules/notes";
import { initTimer } from "./modules/timer";

function init(): void {
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
