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

// ── COINGECKO API ─────────────────────────────────────────
const COINS = [
  { id: 'bitcoin',  name: 'Bitcoin',  symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'solana',   name: 'Solana',   symbol: 'SOL' },
  { id: 'chainlink',name: 'Chainlink',symbol: 'LINK' },
];

function formatPrice(n) {
  return n >= 1000
    ? '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadCrypto() {
  const ids = COINS.map(c => c.id).join(',');
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_image=true`
    );
    const data = await res.json();
    const list = document.getElementById('crypto-list');
    list.innerHTML = COINS.map(coin => {
      const d = data[coin.id];
      if (!d) return '';
      const change = d.usd_24h_change?.toFixed(2) ?? '0.00';
      const up = parseFloat(change) >= 0;
      return `
        <div class="crypto-row">
          <div class="crypto-left">
            <div>
              <div class="crypto-name">${coin.name}</div>
              <div class="crypto-symbol">${coin.symbol}</div>
            </div>
          </div>
          <div class="crypto-right">
            <div class="crypto-price">${formatPrice(d.usd)}</div>
            <div class="crypto-change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(change)}%</div>
          </div>
        </div>`;
    }).join('');
    const now = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('crypto-updated').textContent = `Actualizado: ${now} · Fuente: CoinGecko`;
  } catch {
    document.getElementById('crypto-list').innerHTML =
      `<p style="color:var(--muted);font-size:.85rem">No se pudo cargar el mercado.</p>`;
  }
}

loadCrypto();
setInterval(loadCrypto, 60000);

// ── GITHUB API ────────────────────────────────────────────
const GITHUB_USER = 'maxvaldes33';

async function loadGitHub() {
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`),
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=5`),
    ]);
    const user  = await userRes.json();
    const repos = await reposRes.json();

    document.getElementById('github-profile').innerHTML = `
      <div class="github-stat-row">
        <div class="github-stat">
          <div class="github-stat-num">${user.public_repos ?? 0}</div>
          <div class="github-stat-label">Repos públicos</div>
        </div>
        <div class="github-stat">
          <div class="github-stat-num">${user.followers ?? 0}</div>
          <div class="github-stat-label">Seguidores</div>
        </div>
        <div class="github-stat">
          <div class="github-stat-num">${user.following ?? 0}</div>
          <div class="github-stat-label">Siguiendo</div>
        </div>
      </div>`;

    const reposEl = document.getElementById('github-repos');
    if (!Array.isArray(repos) || repos.length === 0) {
      reposEl.innerHTML = `<p style="color:var(--muted);font-size:.85rem">Sin repositorios públicos aún.</p>`;
      return;
    }
    reposEl.innerHTML = repos.map(r => `
      <a class="github-repo" href="${r.html_url}" target="_blank" rel="noopener">
        <div class="github-repo-name">📁 ${r.name}</div>
        <div class="github-repo-right">
          ${r.language ? `<span class="github-repo-lang">${r.language}</span>` : ''}
          <span class="github-repo-stars">⭐ ${r.stargazers_count}</span>
        </div>
      </a>`).join('');
  } catch {
    document.getElementById('github-profile').innerHTML =
      `<p style="color:var(--muted);font-size:.85rem">No se pudo cargar GitHub.</p>`;
  }
}

loadGitHub();

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
