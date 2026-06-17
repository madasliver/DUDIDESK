let remaining = 0;
let interval = 0;
let audioCtx: AudioContext | null = null;
let alarmNodes: { osc: OscillatorNode; gain: GainNode } | null = null;

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
  audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.value = 440;
  gain.gain.value = 0.15;

  // retro beep pattern: alternate 440/880 Hz every 0.2s
  const now = audioCtx.currentTime;
  for (let i = 0; i < 200; i++) {
    osc.frequency.setValueAtTime(i % 2 === 0 ? 440 : 880, now + i * 0.2);
  }

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  alarmNodes = { osc, gain };
}

function stopAlarm(): void {
  if (alarmNodes) {
    alarmNodes.osc.stop();
    alarmNodes.gain.disconnect();
    alarmNodes = null;
  }
  if (audioCtx) {
    void audioCtx.close();
    audioCtx = null;
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
      // pause
      clearInterval(interval);
      interval = 0;
      paused = true;
      startBtn.textContent = "START";
      return;
    }

    if (paused) {
      // resume
      paused = false;
    } else {
      // fresh start
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
