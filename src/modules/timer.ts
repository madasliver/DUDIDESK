const ALARM_URL = "https://www.beepbox.co/player/#song=9n31s0k0l00e03t4Ia7g0cj07r3i0o432T8v0u08f20r22c1q010d02x006W7E0T1v1u35f0qwx10l611d08A6F0B0Q05c0Pa660E2bi626T1v1uc4f0q8111d23A0F4B4Q5000Pff00E0T4v1uf0f0q011z6666ji8k8k3jSBKSJJAArriiiiii07JCABrzrrrrrrr00YrkqHrsrrrrjr005zrAqzrjzrrqr1jRjrqGGrrzsrsA099ijrABJJJIAzrrtirqrqjqixzsrAjrqjiqaqqysttAJqjikikrizrHtBJJAzArzrIsRCITKSS099ijrAJS____Qg99habbCAYrDzh00E0b4h4000000g0000000100000000400000000p1oIR_QE4xwi62-17y9sRM00000";

let remaining = 0;
let interval = 0;
let alarmIframe: HTMLIFrameElement | null = null;

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function updateDisplay(sec: number): void {
  const display = document.getElementById("timerDisplay");
  if (display) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    display.textContent = `${pad(m)}:${pad(s)}`;
  }
}

function startAlarm(): void {
  alarmIframe = document.createElement("iframe");
  alarmIframe.src = ALARM_URL;
  alarmIframe.allow = "autoplay";
  alarmIframe.style.cssText = "position:fixed;width:0;height:0;border:none;opacity:0;pointer-events:none;";
  document.body.appendChild(alarmIframe);
}

function stopAlarm(): void {
  if (alarmIframe) {
    alarmIframe.remove();
    alarmIframe = null;
  }
}

function setRunning(running: boolean): void {
  const startBtn = document.getElementById("timerStartBtn");
  const stopBtn = document.getElementById("timerStopBtn");
  const minInput = document.getElementById("timerMin") as HTMLInputElement | null;
  const secInput = document.getElementById("timerSec") as HTMLInputElement | null;
  if (startBtn) startBtn.textContent = running ? "PAUSE" : "START";
  if (stopBtn) stopBtn.textContent = running ? "STOP" : "RESET";
  if (minInput) minInput.disabled = running;
  if (secInput) secInput.disabled = running;
}

function showAlarmOverlay(): void {
  let overlay = document.querySelector<HTMLElement>(".timer-alarm-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "confirm-overlay timer-alarm-overlay";
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="confirm-box">
      <div class="confirm-msg">// TIME'S UP!</div>
      <div class="confirm-actions">
        <button class="btn-add" id="timerDismissBtn">DISMISS</button>
      </div>
    </div>`;
  overlay.classList.add("open");
  overlay.querySelector("#timerDismissBtn")!.addEventListener("click", () => {
    overlay!.classList.remove("open");
    stopAlarm();
  });
}

export function initTimer(): void {
  const btn = document.getElementById("timerBtn");
  const panel = document.getElementById("timerPanel");
  const startBtn = document.getElementById("timerStartBtn");
  const stopBtn = document.getElementById("timerStopBtn");
  const minInput = document.getElementById("timerMin") as HTMLInputElement | null;
  const secInput = document.getElementById("timerSec") as HTMLInputElement | null;
  if (!btn || !panel || !startBtn || !stopBtn || !minInput || !secInput) return;

  panel.addEventListener("click", e => e.stopPropagation());

  btn.addEventListener("click", e => {
    e.stopPropagation();
    const opening = !panel.classList.contains("open");
    document.getElementById("todoPanel")?.classList.remove("open");
    document.getElementById("notesPanel")?.classList.remove("open");
    panel.classList.toggle("open", opening);
  });

  let paused = false;

  startBtn.addEventListener("click", () => {
    if (interval && !paused) {
      clearInterval(interval);
      interval = 0;
      paused = true;
      startBtn.textContent = "START";
      return;
    }

    if (paused) {
      paused = false;
    } else {
      const m = Math.max(0, parseInt(minInput.value) || 0);
      const s = Math.max(0, Math.min(59, parseInt(secInput.value) || 0));
      remaining = m * 60 + s;
      if (remaining <= 0) return;
    }

    setRunning(true);
    interval = window.setInterval(() => {
      remaining--;
      updateDisplay(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        interval = 0;
        paused = false;
        setRunning(false);
        updateDisplay(0);
        startAlarm();
        showAlarmOverlay();
      }
    }, 1000);
  });

  stopBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = 0;
    paused = false;
    remaining = 0;
    stopAlarm();
    setRunning(false);
    updateDisplay(0);
  });

  document.addEventListener("click", e => {
    if (!panel.contains(e.target as Node) && e.target !== btn)
      panel.classList.remove("open");
  });
}
