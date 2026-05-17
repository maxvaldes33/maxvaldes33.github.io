// ── THEME TOGGLE ──────────────────────────────────────────
const html = document.documentElement;
if (localStorage.getItem('theme') === 'light') html.classList.add('light');

document.getElementById('theme-toggle').addEventListener('click', () => {
  html.classList.toggle('light');
  localStorage.setItem('theme', html.classList.contains('light') ? 'light' : 'dark');
});

// ── WEATHER WIDGET ────────────────────────────────────────
const WMO_CODES = {
  0:  ['☀️',  'Despejado'],
  1:  ['🌤️', 'Mayormente despejado'],
  2:  ['⛅',  'Parcialmente nublado'],
  3:  ['☁️',  'Nublado'],
  45: ['🌫️', 'Niebla'],
  48: ['🌫️', 'Niebla con escarcha'],
  51: ['🌦️', 'Llovizna ligera'],
  53: ['🌦️', 'Llovizna moderada'],
  55: ['🌧️', 'Llovizna intensa'],
  61: ['🌧️', 'Lluvia ligera'],
  63: ['🌧️', 'Lluvia moderada'],
  65: ['🌧️', 'Lluvia intensa'],
  71: ['🌨️', 'Nevada ligera'],
  73: ['🌨️', 'Nevada moderada'],
  75: ['❄️',  'Nevada intensa'],
  80: ['🌦️', 'Chubascos ligeros'],
  81: ['🌧️', 'Chubascos moderados'],
  82: ['⛈️',  'Chubascos intensos'],
  95: ['⛈️',  'Tormenta'],
  99: ['⛈️',  'Tormenta con granizo'],
};

async function loadWeather() {
  const widget = document.getElementById('weather-widget');

  try {
    // Get user coordinates
    const { coords } = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
    );

    const { latitude: lat, longitude: lon } = coords;

    // Reverse geocode city name (Open-Meteo geocoding)
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
    );
    const geoData = await geoRes.json();
    const city = geoData.address?.city
      || geoData.address?.town
      || geoData.address?.village
      || geoData.address?.county
      || 'Tu ubicación';

    // Weather from Open-Meteo (no API key needed)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weathercode&temperature_unit=celsius&timezone=auto`
    );
    const weatherData = await weatherRes.json();
    const temp = Math.round(weatherData.current.temperature_2m);
    const code = weatherData.current.weathercode;
    const [icon, desc] = WMO_CODES[code] ?? ['🌡️', 'Sin datos'];

    widget.innerHTML = `
      <span class="w-icon">${icon}</span>
      <span class="w-temp">${temp}°C</span>
      <span class="w-desc">${desc} · ${city}</span>
    `;
  } catch (err) {
    // Geolocation denied → fallback to Santiago
    try {
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-33.45&longitude=-70.67' +
        '&current=temperature_2m,weathercode&temperature_unit=celsius&timezone=auto'
      );
      const data = await res.json();
      const temp = Math.round(data.current.temperature_2m);
      const code = data.current.weathercode;
      const [icon, desc] = WMO_CODES[code] ?? ['🌡️', 'Sin datos'];
      widget.innerHTML = `
        <span class="w-icon">${icon}</span>
        <span class="w-temp">${temp}°C</span>
        <span class="w-desc">${desc} · Santiago</span>
      `;
    } catch {
      widget.innerHTML = `<span class="w-desc">Clima no disponible</span>`;
    }
  }
}

loadWeather();

// ── SCROLL REVEAL ─────────────────────────────────────────
const revealEls = document.querySelectorAll('.reveal, .timeline-item');
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => io.observe(el));

// ── SKILL BARS ────────────────────────────────────────────
const barIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
      barIo.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.skills-bars').forEach(el => barIo.observe(el));

// ── COUNT-UP STATS ────────────────────────────────────────
const countIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('[data-count]').forEach(el => {
        const target = +el.dataset.count;
        const step = 30;
        const inc = target / (1200 / step);
        let cur = 0;
        const timer = setInterval(() => {
          cur += inc;
          if (cur >= target) { cur = target; clearInterval(timer); }
          el.textContent = Math.round(cur) + '+';
        }, step);
      });
      countIo.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stats-grid').forEach(el => countIo.observe(el));
