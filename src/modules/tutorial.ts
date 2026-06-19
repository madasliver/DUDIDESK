interface TutorialStep {
  title: string;
  text: string;
  selector: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "WELCOME TO DUDIDESK!",
    text: "Your personal retro start page. Let me show you around!",
    selector: ".wordmark",
  },
  {
    title: "YOUR SHORTCUTS",
    text: "Drag icons to reposition them. Click the + button below to add new shortcuts. Hover and hit X to remove.",
    selector: ".icon-panel",
  },
  {
    title: "FOLDERS",
    text: "Long-press an icon and hold it over another for 500ms to merge them into a folder. Click a folder to open it.",
    selector: ".icon-panel",
  },
  {
    title: "TABS",
    text: "Organize your shortcuts in tabs. Double-click to rename, drag to reorder. The undo button restores deleted tabs and icons.",
    selector: ".tab-bar",
  },
  {
    title: "SETTINGS",
    text: "Switch between dark, mid and light themes. Change icon size, background pattern, panel opacity and your custom title.",
    selector: ".settings-btn",
  },
  {
    title: "TOOLS",
    text: "TO DO for tasks, NOTES with multiple tabs, and a TIMER with alarm — find them in the bottom-right corner.",
    selector: ".bw-dock",
  },
  {
    title: "STICKY NOTES",
    text: "Click STICKY+ to create colorful notes. Drag them by the top bar and drop them anywhere on your desk!",
    selector: "#stickyLayer",
  },
  {
    title: "THE CLOCK",
    text: "Drag the clock anywhere you like. Double-click to reset its position. Switch between digital and analog in Settings.",
    selector: "#clockWidget",
  },
];

let currentStep = 0;
let overlay: HTMLElement | null = null;
let prevHighlight: Element | null = null;

function highlightEl(selector: string): void {
  prevHighlight?.classList.remove("tutorial-highlight");
  const el = document.querySelector(selector);
  if (el) {
    el.classList.add("tutorial-highlight");
    prevHighlight = el;
  }
}

function clearHighlight(): void {
  prevHighlight?.classList.remove("tutorial-highlight");
  prevHighlight = null;
}

function renderStep(): void {
  if (!overlay) return;
  const step = STEPS[currentStep];
  const total = STEPS.length;

  overlay.innerHTML = `
    <div class="tutorial-box">
      <div class="tutorial-header">
        <span class="tutorial-counter">// ${currentStep + 1}/${total}</span>
        <button class="tutorial-close">×</button>
      </div>
      <div class="tutorial-title">${step.title}</div>
      <div class="tutorial-text">${step.text}</div>
      <div class="tutorial-nav">
        <button class="btn-cancel tutorial-back" ${currentStep === 0 ? "disabled" : ""}>BACK</button>
        <button class="btn-add tutorial-next">${currentStep === total - 1 ? "DONE" : "NEXT"}</button>
      </div>
    </div>`;

  overlay.querySelector(".tutorial-close")!.addEventListener("click", closeTutorial);
  overlay.querySelector(".tutorial-back")!.addEventListener("click", () => {
    if (currentStep > 0) { currentStep--; renderStep(); }
  });
  overlay.querySelector(".tutorial-next")!.addEventListener("click", () => {
    if (currentStep < total - 1) { currentStep++; renderStep(); }
    else closeTutorial();
  });

  highlightEl(step.selector);
}

function openTutorial(): void {
  currentStep = 0;
  overlay = document.createElement("div");
  overlay.className = "tutorial-overlay";
  document.body.appendChild(overlay);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeTutorial();
  });
  requestAnimationFrame(() => {
    overlay?.classList.add("open");
    renderStep();
  });
}

function closeTutorial(): void {
  clearHighlight();
  overlay?.remove();
  overlay = null;
}

export function initTutorial(): void {
  document.getElementById("tutorialBtn")?.addEventListener("click", e => {
    e.preventDefault();
    openTutorial();
  });
}
