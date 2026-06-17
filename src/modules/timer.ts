let remaining = 0;
let interval = 0;
let alarmCtx: AudioContext | null = null;
let alarmLoop = 0;
let masterGain: GainNode | null = null;
let volume = 0.5;

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

function playMelody(ctx: AudioContext): void {
  if (!masterGain) return;
  const notes = [
    523, 659, 784, 1047,
    0,
    523, 659, 784, 1047,
    0,
    880, 784, 659, 523,
    0,
  ];
  const dur = 0.1;
  const gap = 0.05;
  const step = dur + gap;

  notes.forEach((freq, i) => {
    if (freq === 0) return;
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(1, ctx.currentTime + i * step);
    noteGain.gain.setValueAtTime(0, ctx.currentTime + i * step + dur);
    osc.connect(noteGain);
    noteGain.connect(masterGain!);
    osc.start(ctx.currentTime + i * step);
    osc.stop(ctx.currentTime + i * step + dur + 0.01);
  });
}

function startAlarm(): void {
  alarmCtx = new AudioContext();
  masterGain = alarmCtx.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(alarmCtx.destination);
  playMelody(alarmCtx);
  alarmLoop = window.setInterval(() => {
    if (alarmCtx) playMelody(alarmCtx);
  }, 2300);
}

function stopAlarm(): void {
  clearInterval(alarmLoop);
  alarmLoop = 0;
  masterGain = null;
  if (alarmCtx) {
    void alarmCtx.close();
    alarmCtx = null;
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

  const volSlider = document.getElementById("timerVol") as HTMLInputElement | null;
  const volVal = document.getElementById("timerVolVal");
  volSlider?.addEventListener("input", () => {
    const v = parseInt(volSlider.value) || 0;
    volume = v / 100;
    if (volVal) volVal.textContent = String(v);
    if (masterGain) masterGain.gain.value = volume;
  });

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
