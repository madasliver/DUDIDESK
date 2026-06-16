export function initClock(): void {
  const timeEl = document.getElementById("clockTime");
  const dateEl = document.getElementById("clockDate");
  if (!timeEl && !dateEl) return;

  const pad = (n: number) => String(n).padStart(2, "0");

  function tick(): void {
    const now = new Date();
    if (timeEl) timeEl.textContent =
      `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    if (dateEl) dateEl.textContent =
      `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()}`;
  }

  tick();
  setInterval(tick, 1000);
}
