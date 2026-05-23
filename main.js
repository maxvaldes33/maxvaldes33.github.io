// ═══════════════════════════════════════════════════════
//  ANIMATION SYSTEMS
// ═══════════════════════════════════════════════════════

// ── NOISE GRAIN ──────────────────────────────────────────
(function initNoise() {
  const canvas = document.getElementById('noise-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let frame;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function drawNoise() {
    const w = canvas.width, h = canvas.height;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      data[i] = data[i+1] = data[i+2] = v;
      data[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    frame = requestAnimationFrame(drawNoise);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  drawNoise();
})();


// ── MAGNETIC BUTTONS ──────────────────────────────────────
(function initMagnetic() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
})();

// ── 3D TILT ───────────────────────────────────────────────
(function initTilt() {
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.tilt').forEach(el => {
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      const tiltX = dy * -8;
      const tiltY = dx *  8;
      el.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(4px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      el.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1)';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
})();

// ── HERO MOUSE PARALLAX ───────────────────────────────────
(function initParallax() {
  if (window.matchMedia('(hover: none)').matches) return;
  const bg   = document.querySelector('.hero-bg');
  const grid = document.querySelector('.hero-grid');
  if (!bg || !grid) return;

  let ticking = false;
  document.addEventListener('mousemove', e => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const dx = (e.clientX / window.innerWidth  - 0.5) * 30;
      const dy = (e.clientY / window.innerHeight - 0.5) * 20;
      bg.style.transform   = `translate(${dx * 0.6}px, ${dy * 0.6}px) scale(1.05)`;
      grid.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
      ticking = false;
    });
  }, { passive: true });
})();

// ── TEXT SCRAMBLE ─────────────────────────────────────────
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#░▒▓';
    this.frame = 0;
    this.queue = [];
    this.frameReq = null;
  }

  setText(newText) {
    const old = this.el.textContent;
    const length = Math.max(old.length, newText.length);
    return new Promise(resolve => {
      this.queue = [];
      for (let i = 0; i < length; i++) {
        const from  = old[i]    || '';
        const to    = newText[i] || '';
        const start = Math.floor(Math.random() * 20);
        const end   = start + Math.floor(Math.random() * 20);
        this.queue.push({ from, to, start, end, char: '' });
      }
      cancelAnimationFrame(this.frameReq);
      this.frame = 0;
      this.resolve = resolve;
      this.update();
    });
  }

  update() {
    let output = '';
    let complete = 0;
    this.queue.forEach(({ from, to, start, end, char }, i) => {
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          this.queue[i].char = this.chars[Math.floor(Math.random() * this.chars.length)];
        }
        output += `<span style="color:var(--accent);opacity:0.6">${this.queue[i].char}</span>`;
      } else {
        output += from;
      }
    });
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameReq = requestAnimationFrame(() => { this.frame++; this.update(); });
    }
  }
}

// Run scramble on hero name elements
(function initScramble() {
  const els = document.querySelectorAll('[data-scramble]');
  if (!els.length) return;
  let delay = 500;
  els.forEach(el => {
    const target = el.dataset.scramble;
    el.textContent = target;
    setTimeout(() => {
      const scrambler = new TextScramble(el);
      scrambler.setText(target);
    }, delay);
    delay += 200;
  });
})();

// ── GLITCH ON HOVER ───────────────────────────────────────
(function initGlitch() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('[data-scramble]').forEach(el => {
    const wrap = document.createElement('span');
    wrap.className = 'glitch-wrap';
    wrap.dataset.text = el.dataset.scramble;
    el.parentNode.insertBefore(wrap, el);
    wrap.appendChild(el);

    let timeout;
    wrap.addEventListener('mouseenter', () => {
      clearTimeout(timeout);
      wrap.classList.add('glitching');
      timeout = setTimeout(() => wrap.classList.remove('glitching'), 400);
    });
  });
})();

// ── TIMELINE LINE DRAW ────────────────────────────────────
(function initTimelineDraw() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { timeline.classList.add('line-drawn'); io.disconnect(); }
  }, { threshold: 0.1 });
  io.observe(timeline);
})();

// ── ANCHOR LINKS sin cambiar URL ──────────────────────────
document.addEventListener('click', function(e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!id) return;
  e.preventDefault();
  const target = document.getElementById(id);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
});

// ── DOWNLOAD CV ───────────────────────────────────────────
function downloadCV() {
  const binary = atob(CV_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'CV_Maximiliano_Valdes.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── THEME TOGGLE ──────────────────────────────────────────
const html = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(isDark) {
  html.classList.toggle('light', !isDark);
}

// Prioridad: preferencia guardada → sistema
const saved = localStorage.getItem('theme');
if (saved) {
  applyTheme(saved === 'dark');
} else {
  applyTheme(prefersDark.matches);
}

// Escuchar cambios del sistema en tiempo real (solo si no hay preferencia guardada)
prefersDark.addEventListener('change', e => {
  if (!localStorage.getItem('theme')) applyTheme(e.matches);
});

document.getElementById('theme-toggle').addEventListener('click', () => {
  const nowDark = !html.classList.contains('light');
  applyTheme(!nowDark);
  localStorage.setItem('theme', !nowDark ? 'dark' : 'light');
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

// ── HACKER NEWS API ───────────────────────────────────────
async function loadNews() {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids = await idsRes.json();
    const top5 = ids.slice(0, 5);

    const stories = await Promise.all(
      top5.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );

    document.getElementById('news-list').innerHTML = stories
      .filter(s => s && s.title && s.url)
      .map(s => {
        const domain = new URL(s.url).hostname.replace('www.', '');
        const ago = Math.round((Date.now() / 1000 - s.time) / 3600);
        return `
          <a class="news-item" href="${s.url}" target="_blank" rel="noopener">
            <div class="news-title">${s.title}</div>
            <div class="news-source">${domain} · hace ${ago}h · ▲ ${s.score} pts</div>
          </a>`;
      }).join('');
  } catch {
    document.getElementById('news-list').innerHTML =
      `<p style="color:var(--muted);font-size:.85rem">Noticias no disponibles.</p>`;
  }
}

loadNews();

// ── VISITOR LOCATION (ipinfo.io) ─────────────────────────
async function loadVisitorLocation() {
  try {
    const res = await fetch('https://ipinfo.io/json');
    const d = await res.json();
    if (!d.ip) throw new Error();

    const countryFlags = {
      CL:'🇨🇱', AR:'🇦🇷', PE:'🇵🇪', MX:'🇲🇽', CO:'🇨🇴',
      US:'🇺🇸', ES:'🇪🇸', BR:'🇧🇷', UY:'🇺🇾', VE:'🇻🇪',
      DE:'🇩🇪', FR:'🇫🇷', GB:'🇬🇧', CA:'🇨🇦', AU:'🇦🇺',
    };
    const flag = countryFlags[d.country] ?? '🌍';
    const [city, region] = [d.city ?? '—', d.region ?? ''];

    document.getElementById('visitor-location').innerHTML = `
      <div class="visitor-card">
        <div class="visitor-row">
          <span class="visitor-flag">${flag}</span>
          <span class="visitor-value">${d.country ?? '—'}</span>
        </div>
        <div class="visitor-row">
          <span class="visitor-label">Ciudad</span>
          <span class="visitor-value">${city}${region ? ', ' + region : ''}</span>
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

// ── FRANKFURTER EXCHANGE RATES ────────────────────────────
// ── MINDICADOR.CL — Banco Central de Chile ────────────────
const INDICADORES = [
  { key: 'dolar',  nombre: 'Dólar observado', flag: '🇺🇸', unidad: 'CLP' },
  { key: 'euro',   nombre: 'Euro',            flag: '🇪🇺', unidad: 'CLP' },
  { key: 'uf',     nombre: 'UF',              flag: '🇨🇱', unidad: 'CLP' },
  { key: 'utm',    nombre: 'UTM',             flag: '🇨🇱', unidad: 'CLP' },
];

async function loadExchangeRates() {
  try {
    const res  = await fetch('https://mindicador.cl/api');
    if (!res.ok) throw new Error();
    const data = await res.json();

    document.getElementById('exchange-list').innerHTML = INDICADORES.map(ind => {
      const entry = data[ind.key];
      if (!entry) return '';
      const valor = entry.valor.toLocaleString('es-CL', { maximumFractionDigits: 2 });
      return `
        <div class="exchange-row">
          <div class="crypto-left">
            <span class="exchange-flag">${ind.flag}</span>
            <div>
              <div class="exchange-pair">${ind.nombre}</div>
              <div class="exchange-name">en ${ind.unidad}</div>
            </div>
          </div>
          <div class="exchange-rate">$${valor}</div>
        </div>`;
    }).join('');

    const fecha = new Date(data.dolar.fecha).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
    document.getElementById('exchange-updated').textContent = `Vigente al ${fecha} · Fuente: Banco Central de Chile`;
  } catch {
    document.getElementById('exchange-list').innerHTML =
      `<p style="color:var(--muted);font-size:.85rem">No se pudo cargar los indicadores.</p>`;
  }
}

loadExchangeRates();
setInterval(loadExchangeRates, 300000);

// ── JOKEAPI ───────────────────────────────────────────────
async function loadJoke() {
  const box = document.getElementById('joke-box');
  box.innerHTML = `<div class="crypto-skeleton"></div><div class="crypto-skeleton"></div>`;
  try {
    const res  = await fetch('https://v2.jokeapi.dev/joke/Programming?lang=en&blacklistFlags=nsfw,racist,sexist');
    const data = await res.json();

    if (data.type === 'twopart') {
      box.innerHTML = `
        <div class="joke-card">
          <div class="joke-setup">${data.setup}</div>
          <div class="joke-delivery">— ${data.delivery}</div>
        </div>`;
    } else {
      box.innerHTML = `
        <div class="joke-card">
          <div class="joke-single">${data.joke}</div>
        </div>`;
    }
  } catch {
    box.innerHTML = `<p style="color:var(--muted);font-size:.85rem">No se pudo cargar el chiste.</p>`;
  }
}

loadJoke();

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
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: '94968791-9c05-46e1-a9b0-1a351781d7f9',
        subject: `Portfolio — mensaje de ${name}`,
        name, email, message,
      }),
    });
    const data = await res.json();
    if (data.success) {
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

// ── SCROLL PROGRESS + BACK TO TOP ────────────────────────
const progressBar = document.getElementById('scroll-progress');
const backToTop   = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY;
  const total    = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (scrolled / total * 100) + '%';
  backToTop.classList.toggle('visible', scrolled > 400);
}, { passive: true });

// ── VISIT COUNTER ─────────────────────────────────────────
async function loadVisitCounter() {
  try {
    const res  = await fetch('https://api.counterapi.dev/v1/maxi-portfolio/visits/up');
    const data = await res.json();
    const count = data.count ?? '—';
    document.getElementById('visit-counter').innerHTML = `
      <span class="w-icon">👁</span>
      <span class="w-desc"><strong style="color:var(--text)">${count.toLocaleString()}</strong> visitas</span>`;
  } catch {
    document.getElementById('visit-counter').innerHTML =
      `<span class="w-icon">👁</span><span class="w-desc">Portfolio en línea</span>`;
  }
}

loadVisitCounter();

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

// ── HAMBURGER NAV ──────────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
  // Al cerrar, resetea delays para que los li no queden atascados
  if (!open) {
    navLinks.querySelectorAll('li').forEach(li => {
      li.style.transitionDelay = '0s';
    });
  } else {
    navLinks.querySelectorAll('li').forEach(li => {
      li.style.transitionDelay = '';
    });
  }
});

document.querySelectorAll('.nav-link-item').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  });
});
