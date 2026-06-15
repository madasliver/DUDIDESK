import { loadPrefs, prefs } from "./modules/state";
import { applyTheme, applyTitle, applyPanelOpacity, setActiveBtn } from "./modules/theme";
import { applyBg } from "./modules/background";
import { resizePanel } from "./modules/grid";
import { render } from "./modules/render";
import { initModal } from "./modules/modal";
import { initFolder } from "./modules/folder";
import { initSettings } from "./modules/settings";
import { initTabs } from "./modules/tabs";

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

  requestAnimationFrame(() => {
    applyBg(prefs.bg);
    applyPanelOpacity(prefs.opacity);
  });

  window.addEventListener("resize", () => {
    applyBg(prefs.bg);
    resizePanel();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
