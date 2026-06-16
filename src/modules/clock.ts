export function initClock(): void {
  const el = document.getElementById("clockWidget");
  if (!el) return;

  const timeEl = document.createElement("span");
  timeEl.className = "clock-time";
  const dateEl = document.createElement("span");
  dateEl.className = "clock-date";
  el.appendChild(timeEl);
  el.appendChild(dateEl);

  const pad = (n: number) => String(n).padStart(2, "0");

  function tick(): void {
    const now = new Date();
    timeEl.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    dateEl.textContent = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  tick();
  setInterval(tick, 1000);
}
