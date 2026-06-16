function icon(rects: string): string {
  return `<svg width="20" height="20" viewBox="0 0 10 10" fill="currentColor" style="image-rendering:pixelated;flex-shrink:0">${rects}</svg>`;
}

const ICONS = {
  sunny: icon(
    '<rect x="4" y="0" width="2" height="1"/><rect x="4" y="9" width="2" height="1"/>' +
    '<rect x="0" y="4" width="1" height="2"/><rect x="9" y="4" width="1" height="2"/>' +
    '<rect x="1" y="1" width="1" height="1"/><rect x="8" y="1" width="1" height="1"/>' +
    '<rect x="1" y="8" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/>' +
    '<rect x="3" y="2" width="4" height="1"/><rect x="2" y="3" width="6" height="4"/><rect x="3" y="7" width="4" height="1"/>'
  ),
  cloudy: icon(
    '<rect x="4" y="2" width="3" height="2"/><rect x="2" y="3" width="6" height="1"/><rect x="1" y="4" width="8" height="4"/>'
  ),
  rainy: icon(
    '<rect x="4" y="1" width="3" height="2"/><rect x="2" y="2" width="6" height="1"/><rect x="1" y="3" width="8" height="3"/>' +
    '<rect x="2" y="7" width="1" height="2"/><rect x="5" y="7" width="1" height="2"/><rect x="8" y="7" width="1" height="2"/>'
  ),
  snowy: icon(
    '<rect x="4" y="1" width="3" height="2"/><rect x="2" y="2" width="6" height="1"/><rect x="1" y="3" width="8" height="3"/>' +
    '<rect x="2" y="7" width="2" height="1"/><rect x="5" y="7" width="2" height="1"/>' +
    '<rect x="3" y="9" width="2" height="1"/><rect x="7" y="9" width="2" height="1"/>'
  ),
};

function getIcon(code: number): string {
  if (code === 0) return ICONS.sunny;
  if (code <= 48) return ICONS.cloudy;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ICONS.snowy;
  return ICONS.rainy;
}

export function initWeather(): void {
  const el = document.getElementById("weatherWidget");
  if (!el || !("geolocation" in navigator)) return;

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,weathercode`;
      fetch(url)
        .then(r => r.json())
        .then(data => {
          const d = data as { current?: { temperature_2m?: number; weathercode?: number } };
          const temp = d.current?.temperature_2m;
          const code = d.current?.weathercode;
          if (temp === undefined || code === undefined) return;
          const tempEl = document.createElement("span");
          tempEl.textContent = `${Math.round(temp)}°C`;
          el.innerHTML = getIcon(code);
          el.appendChild(tempEl);
          el.style.display = "flex";
        })
        .catch(() => { /* hide silently */ });
    },
    () => { /* geolocation denied — hide silently */ }
  );
}
