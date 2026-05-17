// Fuerza scroll al tope en cada carga (evita que el browser restaure posición)
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

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

// ── BINANCE API (crypto) ──────────────────────────────────
const COINS = [
  { symbol: 'BTCUSDT',  name: 'Bitcoin',   ticker: 'BTC' },
  { symbol: 'ETHUSDT',  name: 'Ethereum',  ticker: 'ETH' },
  { symbol: 'SOLUSDT',  name: 'Solana',    ticker: 'SOL' },
  { symbol: 'LINKUSDT', name: 'Chainlink', ticker: 'LINK' },
];

function formatPrice(n) {
  return n >= 1000
    ? '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadCrypto() {
  try {
    const symbols = JSON.stringify(COINS.map(c => c.symbol));
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`
    );
    const data = await res.json();
    const bySymbol = Object.fromEntries(data.map(d => [d.symbol, d]));

    document.getElementById('crypto-list').innerHTML = COINS.map(coin => {
      const d = bySymbol[coin.symbol];
      if (!d) return '';
      const change = parseFloat(d.priceChangePercent).toFixed(2);
      const up = parseFloat(change) >= 0;
      return `
        <div class="crypto-row">
          <div class="crypto-left">
            <div class="crypto-name">${coin.name}</div>
            <div class="crypto-symbol">${coin.ticker}</div>
          </div>
          <div class="crypto-right">
            <div class="crypto-price">${formatPrice(d.lastPrice)}</div>
            <div class="crypto-change ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(change)}%</div>
          </div>
        </div>`;
    }).join('');

    const now = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('crypto-updated').textContent = `Actualizado: ${now} · Fuente: Binance`;
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

// ── NEWS API ──────────────────────────────────────────────
async function loadNews() {
  try {
    const res = await fetch(
      'https://newsapi.org/v2/top-headlines?category=technology&language=es&pageSize=5' +
      '&apiKey=2666beef9d4d40729ea63b2c8c3d0867'
    );
    const data = await res.json();
    const articles = data.articles?.filter(a => a.title && a.title !== '[Removed]') ?? [];

    if (articles.length === 0) throw new Error('sin artículos');

    document.getElementById('news-list').innerHTML = articles.slice(0, 5).map(a => `
      <a class="news-item" href="${a.url}" target="_blank" rel="noopener">
        <div class="news-title">${a.title}</div>
        <div class="news-source">${a.source?.name ?? ''} · ${new Date(a.publishedAt).toLocaleDateString('es-CL')}</div>
      </a>`).join('');
  } catch {
    // Fallback: noticias en inglés si no hay en español
    try {
      const res = await fetch(
        'https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=5' +
        '&apiKey=2666beef9d4d40729ea63b2c8c3d0867'
      );
      const data = await res.json();
      const articles = data.articles?.filter(a => a.title && a.title !== '[Removed]') ?? [];
      document.getElementById('news-list').innerHTML = articles.slice(0, 5).map(a => `
        <a class="news-item" href="${a.url}" target="_blank" rel="noopener">
          <div class="news-title">${a.title}</div>
          <div class="news-source">${a.source?.name ?? ''} · ${new Date(a.publishedAt).toLocaleDateString('es-CL')}</div>
        </a>`).join('');
    } catch {
      document.getElementById('news-list').innerHTML =
        `<p style="color:var(--muted);font-size:.85rem">Noticias no disponibles.</p>`;
    }
  }
}

loadNews();

// ── VISITOR LOCATION ──────────────────────────────────────
async function loadVisitorLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const d = await res.json();

    const countryFlags = {
      CL:'🇨🇱', AR:'🇦🇷', PE:'🇵🇪', MX:'🇲🇽', CO:'🇨🇴',
      US:'🇺🇸', ES:'🇪🇸', BR:'🇧🇷', UY:'🇺🇾', VE:'🇻🇪',
    };
    const flag = countryFlags[d.country_code] ?? '🌍';

    document.getElementById('visitor-location').innerHTML = `
      <div class="visitor-card">
        <div class="visitor-row">
          <span class="visitor-flag">${flag}</span>
          <span class="visitor-value">${d.country_name}</span>
        </div>
        <div class="visitor-row">
          <span class="visitor-label">Ciudad</span>
          <span class="visitor-value">${d.city ?? '—'}, ${d.region ?? ''}</span>
        </div>
        <div class="visitor-row">
          <span class="visitor-label">Zona horaria</span>
          <span class="visitor-value">${d.timezone ?? '—'}</span>
        </div>
        <div class="visitor-row">
          <span class="visitor-label">Proveedor</span>
          <span class="visitor-value">${d.org ?? '—'}</span>
        </div>
      </div>`;
  } catch {
    document.getElementById('visitor-location').innerHTML =
      `<p style="color:var(--muted);font-size:.85rem">Ubicación no disponible.</p>`;
  }
}

loadVisitorLocation();

// ── LIGHTBOX GALLERY ──────────────────────────────────────
const GALLERY = [
  { type: 'img', src: 'Certificados/1768766643346.jpeg',         caption: 'Ingeniería en Informática · DUOC UC · 2025' },
  { type: 'img', src: 'Certificados/1756486420666.jpeg',         caption: 'Introducción a la Ciencia de Datos · Santander Open Academy' },
  { type: 'img', src: 'Certificados/certificado_matematicas.jpeg', caption: 'Fundamentos de Matemáticas para Informáticos · Mastermind' },
];
let currentIdx = 0;

function openGallery(idx) {
  currentIdx = idx;
  renderGalleryItem();
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function renderGalleryItem() {
  const item    = GALLERY[currentIdx];
  const img     = document.getElementById('lightbox-img');
  const pdfBtn  = document.getElementById('lightbox-pdf-btn');
  const pdfLink = document.getElementById('lightbox-pdf-link');
  const caption = document.getElementById('lightbox-caption');
  const counter = document.getElementById('lightbox-counter');

  img.style.opacity = '0';
  img.style.display = 'block';
  pdfBtn.style.display = 'none';
  img.src = item.src;
  img.onload = () => { img.style.opacity = '1'; };
  caption.textContent = item.caption;
  counter.textContent = `${currentIdx + 1} / ${GALLERY.length}`;
}

function galleryNav(dir) {
  currentIdx = (currentIdx + dir + GALLERY.length) % GALLERY.length;
  renderGalleryItem();
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function handleLightboxClick(e) {
  if (e.target === document.getElementById('lightbox')) closeLightbox();
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowRight')  galleryNav(1);
  if (e.key === 'ArrowLeft')   galleryNav(-1);
});

// ── CONTACT FORM ──────────────────────────────────────────
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn    = document.getElementById('form-btn');
  const status = document.getElementById('form-status');
  const name    = document.getElementById('cf-name').value.trim();
  const email   = document.getElementById('cf-email').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  btn.textContent = 'Enviando...';
  btn.disabled = true;
  status.className = '';
  status.textContent = '';

  try {
    const res = await fetch('https://formsubmit.co/ajax/musrri.valdes.maxi03@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ name, email, message, _subject: `Portfolio — mensaje de ${name}` }),
    });
    const data = await res.json();
    if (data.success === 'true' || data.success === true) {
      status.textContent = '✅ Mensaje enviado. Te responderé pronto.';
      status.className = 'ok';
      this.reset();
    } else {
      throw new Error();
    }
  } catch {
    status.textContent = '❌ Error al enviar. Escríbeme directo a musrri.valdes.maxi03@gmail.com';
    status.className = 'err';
  } finally {
    btn.textContent = 'Enviar mensaje';
    btn.disabled = false;
  }
});

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
