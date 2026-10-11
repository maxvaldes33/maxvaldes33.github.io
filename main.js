// ═══════════════════════════════════════════════════════
//  MAIN.JS — navegación, tema, certificados y contacto
// ═══════════════════════════════════════════════════════

// ── ANCLAS sin cambiar la URL ─────────────────────────────
document.addEventListener('click', function(e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href').slice(1);
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth' });
  if (id === 'contenido') target.focus({ preventScroll: true });
});


// ── TEMA — sistema / claro / oscuro ───────────────────────
const html        = document.documentElement;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const themeBtns   = document.querySelectorAll('.theme-btn');

function applyMode(mode) {
  const isDark = mode === 'system' ? prefersDark.matches : mode === 'dark';
  html.classList.toggle('light', !isDark);
  themeBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.theme === mode)));
}

applyMode(localStorage.getItem('themeMode') || 'system');

// Cambios del sistema en tiempo real (solo si el modo es "sistema")
prefersDark.addEventListener('change', () => {
  if ((localStorage.getItem('themeMode') || 'system') === 'system') applyMode('system');
});

themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    localStorage.setItem('themeMode', btn.dataset.theme);
    applyMode(btn.dataset.theme);
  });
});


// ── NAV: borde al hacer scroll + sección activa ──────────
const siteNav   = document.getElementById('site-nav');
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  siteNav.classList.toggle('scrolled', y > 8);
  backToTop.classList.toggle('visible', y > 600);
}, { passive: true });

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

const navItems = document.querySelectorAll('.nav-link-item');
const sectionIo = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    navItems.forEach(a => {
      if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => sectionIo.observe(s));


// ── MENÚ MÓVIL ────────────────────────────────────────────
const hamburger = document.getElementById('nav-hamburger');
const navLinks  = document.getElementById('nav-links');

function setMenu(open) {
  navLinks.classList.toggle('open', open);
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  hamburger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}

hamburger.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
navItems.forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && navLinks.classList.contains('open')) { setMenu(false); hamburger.focus(); }
});


// ── CERTIFICADOS (lightbox) ───────────────────────────────
const GALLERY = [
  { src: 'Certificados/1768766643346.jpeg',          caption: 'Ingeniería en Informática · DUOC UC · 2025' },
  { src: 'Certificados/certificado_claude_analisis_datos_uc.jpeg', caption: 'Taller de Claude para el análisis de datos · Pontificia Universidad Católica de Chile · 2026' },
  { src: 'Certificados/1756486420666.jpeg',          caption: 'Introducción a la Ciencia de Datos · Santander Open Academy' },
  { src: 'Certificados/certificado_matematicas.jpeg', caption: 'Fundamentos de Matemáticas para Informáticos · Mastermind' },
];
const lightbox = document.getElementById('lightbox');
const lbImg    = document.getElementById('lightbox-img');
let currentIdx = 0;
let lastFocus  = null;

function renderGalleryItem() {
  const item = GALLERY[currentIdx];
  lbImg.style.opacity = '0';
  lbImg.onload = () => { lbImg.style.opacity = '1'; };
  lbImg.src = item.src;
  lbImg.alt = item.caption;
  document.getElementById('lightbox-caption').textContent = item.caption;
  document.getElementById('lightbox-counter').textContent = `${currentIdx + 1} / ${GALLERY.length}`;
}

function openGallery(idx) {
  lastFocus = document.activeElement;
  currentIdx = idx;
  renderGalleryItem();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
  lightbox.querySelector('.lightbox-close').focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
  if (lastFocus) lastFocus.focus();
}

function galleryNav(dir) {
  currentIdx = (currentIdx + dir + GALLERY.length) % GALLERY.length;
  renderGalleryItem();
}

document.querySelectorAll('[data-gallery]').forEach(btn => {
  btn.addEventListener('click', () => openGallery(Number(btn.dataset.gallery)));
});
lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.querySelector('.lightbox-prev').addEventListener('click', () => galleryNav(-1));
lightbox.querySelector('.lightbox-next').addEventListener('click', () => galleryNav(1));
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowRight') galleryNav(1);
  if (e.key === 'ArrowLeft')  galleryNav(-1);
});


// ── FORMULARIO DE CONTACTO ────────────────────────────────
const form = document.getElementById('contact-form');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setFieldError(input, msg) {
  const group = input.closest('.form-group');
  group.toggleAttribute('data-invalid', Boolean(msg));
  input.setAttribute('aria-invalid', String(Boolean(msg)));
  document.getElementById(input.id + '-err').textContent = msg;
}

function validateField(input) {
  const value = input.value.trim();
  if (!value) {
    const labels = { 'cf-name': 'tu nombre', 'cf-email': 'tu correo', 'cf-message': 'un mensaje' };
    setFieldError(input, `Ingresa ${labels[input.id]}.`);
    return false;
  }
  if (input.type === 'email' && !EMAIL_RE.test(value)) {
    setFieldError(input, 'Revisa el formato del correo, por ejemplo nombre@dominio.cl.');
    return false;
  }
  setFieldError(input, '');
  return true;
}

form.querySelectorAll('input, textarea').forEach(input => {
  input.addEventListener('blur', () => { if (input.value) validateField(input); });
  input.addEventListener('input', () => {
    if (input.closest('.form-group').hasAttribute('data-invalid')) validateField(input);
  });
});

form.addEventListener('submit', async function(e) {
  e.preventDefault();
  const fields = [...form.querySelectorAll('input, textarea')];
  const valid  = fields.map(validateField).every(Boolean);
  if (!valid) { fields.find(f => f.getAttribute('aria-invalid') === 'true').focus(); return; }

  const btn    = document.getElementById('form-btn');
  const status = document.getElementById('form-status');
  const name    = document.getElementById('cf-name').value.trim();
  const email   = document.getElementById('cf-email').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  btn.textContent = 'Enviando…';
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
    if (!data.success) throw new Error();
    status.textContent = 'Mensaje enviado. Te responderé a la brevedad.';
    status.className = 'ok';
    form.reset();
  } catch {
    status.textContent = 'No se pudo enviar. Escríbeme directamente a musrri.valdes.maxi03@gmail.com.';
    status.className = 'err';
  } finally {
    btn.textContent = 'Enviar mensaje';
    btn.disabled = false;
  }
});


// ── APARICIÓN AL HACER SCROLL ─────────────────────────────
const revealIo = new IntersectionObserver((entries) => {
  entries.filter(e => e.isIntersecting).forEach((e, i) => {
    setTimeout(() => e.target.classList.add('visible'), i * 70);
    revealIo.unobserve(e.target);
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealIo.observe(el));
