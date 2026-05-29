// ============================================================
// HOBBIES.JS — Sección oculta (easter egg)
// Desbloqueo: 5 clicks en el logo "MV."
// Contiene: minijuego F1 (largada + dash) y biblioteca pixel-art
// con físicas reales (Matter.js): los libros caen, chocan y, al
// agitarlos, sueltan hojas.
// ============================================================

// ------------------------------------------------------------
// DESBLOQUEO
// ------------------------------------------------------------
(function initUnlock() {
  const logo = document.querySelector('.nav-logo');
  const section = document.getElementById('hobbies');
  if (!logo || !section) return;

  let clicks = 0;
  let resetTimer;
  let started = false;

  logo.addEventListener('click', () => {
    clicks++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { clicks = 0; }, 1200);
    if (clicks >= 5) {
      clicks = 0;
      reveal();
    }
  });

  function reveal() {
    section.hidden = false;
    section.classList.add('reveal-in');
    toast('🎮 Sección secreta desbloqueada');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!started) {
      started = true;
      try { initF1(); } catch (e) { console.warn('F1:', e); }
      try { initShelf(); } catch (e) { console.warn('Shelf:', e); }
    }
  }
})();

function toast(text) {
  let el = document.getElementById('secret-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'secret-toast';
    document.body.appendChild(el);
  }
  el.textContent = text;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => el.classList.remove('show'), 2600);
}

// ============================================================
// MINIJUEGO F1 — largada de 5 luces + dash esquiva-tráfico
// ============================================================
function initF1() {
  const canvas = document.getElementById('f1-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  const lights = [...document.querySelectorAll('.f1-light')];
  const overlay = document.getElementById('f1-overlay');
  const msg = document.getElementById('f1-msg');
  const startBtn = document.getElementById('f1-start');
  const elReaction = document.getElementById('f1-reaction');
  const elScore = document.getElementById('f1-score');
  const elBest = document.getElementById('f1-best');

  const LANES = [W * 0.25, W * 0.5, W * 0.75];
  const CAR_W = 40, CAR_H = 64;

  let best = +(localStorage.getItem('f1Best') || 0);
  elBest.textContent = best;

  let state = 'idle';          // idle | lights | racing | over
  let lightsOutAt = 0;
  let reaction = null;
  let lane = 1;
  let targetX = LANES[lane];
  let playerX = LANES[lane];
  let dist = 0;
  let speed = 4;
  let obstacles = [];
  let roadOffset = 0;
  let raf = null;
  const timeouts = [];

  function clearTimers() { timeouts.forEach(clearTimeout); timeouts.length = 0; }

  startBtn.addEventListener('click', startSequence);

  function startSequence() {
    clearTimers();
    cancelAnimationFrame(raf);
    overlay.classList.add('hidden');
    lights.forEach(l => l.classList.remove('on'));
    reaction = null;
    elReaction.textContent = '—';
    state = 'lights';
    dist = 0; speed = 4; obstacles = []; lane = 1;
    targetX = playerX = LANES[lane];
    drawScene();

    lights.forEach((l, i) => {
      timeouts.push(setTimeout(() => l.classList.add('on'), 600 + i * 650));
    });
    const total = 600 + 5 * 650;
    const extra = 700 + Math.random() * 2200;
    timeouts.push(setTimeout(lightsOut, total + extra));
  }

  function lightsOut() {
    lights.forEach(l => l.classList.remove('on'));
    lightsOutAt = performance.now();
    state = 'racing';
    loop();
  }

  function falseStart() {
    clearTimers();
    state = 'idle';
    lights.forEach(l => l.classList.remove('on'));
    overlay.classList.remove('hidden');
    msg.innerHTML = '🚦 ¡Salida falsa! Espera a que se apaguen las luces.';
    startBtn.textContent = 'Reintentar';
  }

  function move(dir) {
    if (state !== 'racing') return;
    if (reaction === null) {
      reaction = Math.round(performance.now() - lightsOutAt);
      elReaction.textContent = reaction + ' ms';
    }
    lane = Math.max(0, Math.min(2, lane + dir));
    targetX = LANES[lane];
  }

  function onKey(e) {
    if (state === 'lights' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
        e.key === 'a' || e.key === 'd' || e.key === ' ')) {
      e.preventDefault();
      falseStart();
      return;
    }
    if (state !== 'racing') return;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); move(1); }
  }
  window.addEventListener('keydown', onKey);

  canvas.addEventListener('pointerdown', (e) => {
    if (state === 'lights') { falseStart(); return; }
    if (state !== 'racing') return;
    const rect = canvas.getBoundingClientRect();
    move((e.clientX - rect.left) < rect.width / 2 ? -1 : 1);
  });

  function loop() {
    if (state !== 'racing') return;
    dist += speed * 0.1;
    speed = 4 + dist * 0.012;
    roadOffset = (roadOffset + speed) % 40;
    playerX += (targetX - playerX) * 0.25;

    if (Math.random() < 0.025 + dist * 0.00004) {
      const l = Math.floor(Math.random() * 3);
      if (!obstacles.some(o => o.lane === l && o.y < CAR_H * 1.6)) {
        obstacles.push({ lane: l, x: LANES[l], y: -CAR_H });
      }
    }
    const py = H - CAR_H - 14;
    for (const o of obstacles) {
      o.y += speed;
      if (o.lane === lane && o.y + CAR_H > py && o.y < py + CAR_H &&
          Math.abs(o.x - playerX) < CAR_W) {
        return gameOver();
      }
    }
    obstacles = obstacles.filter(o => o.y < H + CAR_H);

    elScore.textContent = Math.floor(dist);
    drawScene();
    raf = requestAnimationFrame(loop);
  }

  function gameOver() {
    cancelAnimationFrame(raf);
    state = 'over';
    const score = Math.floor(dist);
    if (score > best) { best = score; localStorage.setItem('f1Best', best); elBest.textContent = best; }
    overlay.classList.remove('hidden');
    msg.innerHTML = `💥 ¡Chocaste!<br>Distancia: <strong>${score}</strong>` +
      (reaction !== null ? ` · Reacción: <strong>${reaction} ms</strong>` : '');
    startBtn.textContent = 'Correr de nuevo';
  }

  function drawScene() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0d1018';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = -roadOffset;
    for (let i = 1; i < 3; i++) {
      const x = (LANES[i - 1] + LANES[i]) / 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(0,229,255,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 0, W - 4, H);

    for (const o of obstacles) drawCar(o.x, o.y, '#ff3b6b');
    drawCar(playerX, H - CAR_H - 14, '#00e5ff');
  }

  function drawCar(cx, top, color) {
    const x = cx - CAR_W / 2;
    ctx.fillStyle = color;
    roundRect(x, top, CAR_W, CAR_H, 8); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(x + 8, top + 14, CAR_W - 16, CAR_H - 30, 5); ctx.fill();
    ctx.fillStyle = color;
    ctx.fillRect(x - 4, top + 6, CAR_W + 8, 6);
    ctx.fillRect(x - 4, top + CAR_H - 12, CAR_W + 8, 6);
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawScene();
}

// ============================================================
// BIBLIOTECA PIXEL-ART CON FÍSICAS (Matter.js)
// ============================================================
function initShelf() {
  const canvas = document.getElementById('shelf-canvas');
  const resetBtn = document.getElementById('shelf-reset');
  const M = window.Matter;
  if (!M) { console.warn('Matter.js no cargó'); return; }
  const { Engine, World, Bodies, Body, Query, Constraint } = M;

  // --- Buffer pixel-art (se escala por CSS con image-rendering: pixelated) ---
  const VW = 340, VH = 230;
  canvas.width = VW;
  canvas.height = VH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // --- Motor: más iteraciones = colisiones más firmes ---
  const engine = Engine.create({
    enableSleeping: true,
    positionIterations: 18,
    velocityIterations: 14,
    constraintIterations: 6,
  });
  engine.gravity.y = 0.8;   // gravedad algo menor = caídas más lentas/pesadas
  const world = engine.world;

  // --- Estructura estática (marco grueso + repisa central) ---
  const T = 16; // grosor de paredes (grueso = nada atraviesa)
  const wood = { isStatic: true, friction: 1, frictionStatic: 2, restitution: 0 };
  function wall(x, y, w, h) { World.add(world, Bodies.rectangle(x, y, w, h, wood)); }
  const FLOOR_TOP = VH - T;            // borde superior del piso
  const SHELF_Y = 118;                 // centro de la repisa central
  const SHELF_TH = 8;
  wall(VW / 2, VH - T / 2, VW, T);     // piso
  wall(T / 2, VH / 2, T, VH);          // pared izq
  wall(VW - T / 2, VH / 2, T, VH);     // pared der
  wall(VW / 2, T / 2, VW, T);          // techo
  wall(VW / 2, SHELF_Y, VW - T * 2, SHELF_TH); // repisa central

  // --- Libros (cuerpos dinámicos) ---
  const COLORS = [
    '#8c2f2f', '#2f4858', '#3a5a40', '#9c6644', '#5a3e85',
    '#1d3557', '#6a040f', '#386641', '#7f5539', '#995d81',
    '#bb9457', '#344e41', '#7d4f50', '#40514e', '#a44a3f',
  ];
  const TRIMS = ['#e9c46a', '#d4af37', '#cbd5e1', '#e6ccb2']; // dorados / plata / crema
  const BOOK_OPTS = {
    friction: 0.95, frictionStatic: 1.5, restitution: 0,
    density: 0.02, slop: 0.01, frictionAir: 0.045,
  };
  const books = [];
  let colorI = 0;

  // Crea un cuerpo-libro con sus props visuales (d) en (x, y).
  function makeBook(d, x, y) {
    const b = Bodies.rectangle(x, y, d.w, d.h, BOOK_OPTS);
    b.userData = {
      w: d.w, h: d.h, color: d.color, trim: d.trim,
      bands: d.bands, plate: d.plate, grab: 0, home: { x, y },
    };
    World.add(world, b);
    books.push(b);
    return b;
  }

  // Coloca una fila de libros sobre una superficie, dejando ~25% de hueco.
  function fillRow(surfaceTop, ceiling) {
    const usable = ((VW - T) - T) * 0.74;     // dejar espacio para que caigan
    const space = surfaceTop - ceiling;       // alto disponible
    let x = T + 6;
    while (x < T + usable) {
      const bw = 16 + Math.floor(Math.random() * 11);          // grosor lomo 16-26
      const bh = Math.min(space - 6, 58 + Math.floor(Math.random() * 30)); // alto
      const d = {
        w: bw, h: bh,
        color: COLORS[colorI % COLORS.length],
        trim: TRIMS[colorI % TRIMS.length],
        bands: 2 + Math.floor(Math.random() * 2),
        plate: 0.35 + Math.random() * 0.15,
      };
      colorI++;
      makeBook(d, x + bw / 2, surfaceTop - bh / 2);
      x += bw + 4;
    }
  }

  function buildBooks() {
    colorI = 0;
    fillRow(SHELF_Y - SHELF_TH / 2, T);          // fila superior (sobre la repisa)
    fillRow(FLOOR_TOP, SHELF_Y + SHELF_TH / 2);  // fila inferior (sobre el piso)
  }
  buildBooks();

  // --- Hojas que saltan al agitar ---
  const pages = [];
  function spawnPages(x, y, n) {
    for (let i = 0; i < n; i++) {
      pages.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: -2 - Math.random() * 3,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.5,
        sway: Math.random() * Math.PI * 2,
        life: 1,
      });
    }
  }

  // ============================================================
  // LIBROS FLOTANTES (fuera de la estantería, fijos al viewport)
  // ============================================================
  const floating = [];

  function placeEl(fb) {
    fb.el.style.left = fb.x + 'px';
    fb.el.style.top = fb.y + 'px';
  }

  function createFloating(d, cx, cy, state) {
    const sc = (canvas.getBoundingClientRect().width / VW) || 1.5;
    const wpx = Math.max(10, Math.round(d.w * sc));
    const hpx = Math.max(16, Math.round(d.h * sc));
    const el = document.createElement('canvas');
    el.className = 'floating-book';
    el.width = d.w; el.height = d.h;
    el.style.width = wpx + 'px';
    el.style.height = hpx + 'px';
    const c = el.getContext('2d');
    c.imageSmoothingEnabled = false;
    paintBook(c, 0, 0, d.w, d.h, d);
    document.body.appendChild(el);
    const fb = { el, d, wpx, hpx, x: cx - wpx / 2, y: cy - hpx / 2, vy: 0, state };
    placeEl(fb);
    el.addEventListener('pointerdown', (ev) => regrab(fb, ev));
    floating.push(fb);
    return fb;
  }

  function removeFloating(fb) {
    fb.el.remove();
    const i = floating.indexOf(fb);
    if (i >= 0) floating.splice(i, 1);
  }

  // Volver a tomar un libro del suelo
  function regrab(fb, ev) {
    ev.preventDefault();
    ev.stopPropagation();
    fb.state = 'drag';
    const el = fb.el;
    const offx = ev.clientX - fb.x, offy = ev.clientY - fb.y;
    try { el.setPointerCapture(ev.pointerId); } catch (_) {}
    const mv = (e2) => { fb.x = e2.clientX - offx; fb.y = e2.clientY - offy; placeEl(fb); };
    const up = (e2) => {
      el.removeEventListener('pointermove', mv);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      finalizeFloating(fb, e2.clientX, e2.clientY);
    };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  // Al soltar: si está sobre la estantería se reintegra; si no, cae al suelo.
  function finalizeFloating(fb, cx, cy) {
    const r = canvas.getBoundingClientRect();
    const inside = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    if (inside) {
      let wx = (cx - r.left) / r.width * VW;
      let wy = (cy - r.top) / r.height * VH;
      wx = Math.max(T + fb.d.w / 2, Math.min(VW - T - fb.d.w / 2, wx));
      wy = Math.max(T + fb.d.h / 2, Math.min(VH - T - fb.d.h / 2, wy));
      makeBook(fb.d, wx, wy);
      removeFloating(fb);
    } else {
      fb.state = 'fall';
      fb.vy = 0;
    }
  }

  // --- Arrastre dentro de la estantería + detección de "agitar"/expulsión ---
  let dragBody = null;
  let dragConstraint = null;
  let ejected = null;     // libro expulsado durante el arrastre actual
  let lastP = null, lastT = 0, shakeCooldown = 0;
  const MAX_SPEED = 11;   // tope de velocidad de CUALQUIER libro (anti-tunneling y anti-"saltón")
  const MAX_SPIN = 0.35;  // tope de velocidad angular

  function toWorld(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * VW,
      y: (e.clientY - r.top) / r.height * VH,
    };
  }

  function eject(book, cx, cy) {
    if (dragConstraint) { World.remove(world, dragConstraint); dragConstraint = null; }
    const i = books.indexOf(book);
    if (i >= 0) books.splice(i, 1);
    World.remove(world, book);
    const d = book.userData;
    dragBody = null;
    return createFloating(
      { w: d.w, h: d.h, color: d.color, trim: d.trim, bands: d.bands, plate: d.plate },
      cx, cy, 'drag',
    );
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = toWorld(e);
    const found = Query.point(books, p)[0];
    if (!found) return;
    dragBody = found;
    if (dragBody.isSleeping) M.Sleeping.set(dragBody, false);
    const a = -dragBody.angle;
    const dx = p.x - dragBody.position.x, dy = p.y - dragBody.position.y;
    const pb = { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
    dragConstraint = Constraint.create({
      pointA: p, bodyB: dragBody, pointB: pb,
      stiffness: 0.12, damping: 0.4, length: 0,
    });
    World.add(world, dragConstraint);
    lastP = p; lastT = performance.now();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });

  canvas.addEventListener('pointermove', (e) => {
    // Si ya fue expulsado, el libro flotante sigue al puntero a nivel de página.
    if (ejected) {
      ejected.x = e.clientX - ejected.wpx / 2;
      ejected.y = e.clientY - ejected.hpx / 2;
      placeEl(ejected);
      return;
    }
    if (!dragConstraint) return;

    // ¿El puntero salió del canvas? → expulsar el libro de la estantería.
    const r = canvas.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      ejected = eject(dragBody, e.clientX, e.clientY);
      return;
    }

    const p = toWorld(e);
    dragConstraint.pointA = p;
    const now = performance.now();
    const dt = Math.max(16, now - lastT);
    const speed = Math.hypot(p.x - lastP.x, p.y - lastP.y) / dt * 1000; // px/s
    if (speed > 1100 && now > shakeCooldown) {
      spawnPages(dragBody.position.x, dragBody.position.y, 3);
      shakeCooldown = now + 60;
    }
    lastP = p; lastT = now;
  });

  function endDrag(e) {
    if (ejected) {
      finalizeFloating(ejected, e ? e.clientX : -1, e ? e.clientY : -1);
      ejected = null;
    }
    if (dragConstraint) { World.remove(world, dragConstraint); dragConstraint = null; }
    dragBody = null;
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  // --- Reordenar: vuelve al estado inicial (incluye libros del suelo) ---
  resetBtn.addEventListener('click', () => {
    endDrag(null);
    for (const fb of [...floating]) removeFloating(fb);
    for (const b of [...books]) World.remove(world, b);
    books.length = 0;
    pages.length = 0;
    buildBooks();
  });

  // Reposiciona los libros del suelo al final del viewport (scroll/resize).
  function updateFloating() {
    for (const fb of floating) {
      if (fb.state === 'drag') continue;
      if (fb.state === 'fall') {
        fb.vy += 1.1;
        fb.y += fb.vy;
        const restTop = innerHeight - fb.hpx - 6;
        if (fb.y >= restTop) {
          fb.y = restTop;
          if (fb.vy > 2.4) fb.vy *= -0.26;     // rebote suave
          else { fb.vy = 0; fb.state = 'rest'; }
        }
      } else { // rest: pegado al fondo del viewport
        fb.y = innerHeight - fb.hpx - 6;
      }
      fb.x = Math.max(6, Math.min(innerWidth - fb.wpx - 6, fb.x));
      placeEl(fb);
    }
  }

  // --- Render pixel-art ---
  function draw() {
    // fondo cálido de biblioteca
    ctx.fillStyle = '#1a141d';
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#241a26';
    ctx.fillRect(T, T, VW - 2 * T, VH - 2 * T);

    // marco + repisa
    drawWood(0, 0, VW, T);
    drawWood(0, VH - T, VW, T);
    drawWood(0, 0, T, VH);
    drawWood(VW - T, 0, T, VH);
    drawWood(T, SHELF_Y - SHELF_TH / 2, VW - 2 * T, SHELF_TH);

    for (const b of books) drawBook(b);
    for (const p of pages) drawPage(p);
  }

  function drawWood(x, y, w, h) {
    ctx.fillStyle = '#5a3d22';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#774f2c';
    ctx.fillRect(x, y, w, Math.max(2, Math.floor(h * 0.28)));
    ctx.fillStyle = '#3a2614';
    ctx.fillRect(x, y + h - 2, w, 2);
    // vetas
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (let i = x + 6; i < x + w; i += 14) ctx.fillRect(i, y + 2, 1, h - 4);
  }

  // Dibuja un libro pixel-art en (x,y) con tamaño w×h sobre el contexto c.
  // Reutilizado por la estantería y por los libros flotantes.
  function paintBook(c, x, y, w, h, d) {
    // cuerpo (tapa)
    c.fillStyle = d.color;
    c.fillRect(x, y, w, h);
    // sombra lateral derecha + luz lateral izquierda (volumen)
    c.fillStyle = 'rgba(0,0,0,0.28)';
    c.fillRect(x + w - 3, y, 3, h);
    c.fillStyle = 'rgba(255,255,255,0.16)';
    c.fillRect(x + 2, y, 2, h);
    // encuadernación (lomo) a la izquierda
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.fillRect(x, y, 2, h);

    // páginas arriba y abajo (cantos de hoja)
    c.fillStyle = '#efe6cf';
    c.fillRect(x + 3, y, w - 6, 2);
    c.fillRect(x + 3, y + h - 2, w - 6, 2);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(x + 3, y + h - 1, w - 6, 1);

    // bandas decorativas (trim dorado)
    c.fillStyle = d.trim;
    c.fillRect(x + 3, y + Math.round(h * 0.16), w - 6, 2);
    c.fillRect(x + 3, y + h - Math.round(h * 0.16) - 2, w - 6, 2);

    // placa de título con "texto"
    const plateY = y + Math.round(h * d.plate);
    const plateH = Math.min(20, Math.round(h * 0.28));
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(x + 3, plateY, w - 6, plateH);
    c.fillStyle = d.trim;
    for (let i = 0; i < d.bands; i++) {
      const ly = plateY + 3 + i * 4;
      if (ly < plateY + plateH - 2) c.fillRect(x + 4, ly, w - 8, 1);
    }
  }

  function drawBook(b) {
    const d = b.userData;
    ctx.save();
    ctx.translate(Math.round(b.position.x), Math.round(b.position.y));
    ctx.rotate(b.angle);
    const w = d.w, h = d.h, x = -Math.round(w / 2), y = -Math.round(h / 2);
    if (d.grab > 0.01) {
      ctx.fillStyle = `rgba(0,229,255,${0.35 * d.grab})`;
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
    }
    paintBook(ctx, x, y, w, h, d);
    ctx.restore();
  }

  function drawPage(p) {
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    // hoja con doblez (dos tonos)
    ctx.fillStyle = '#f4eeda';
    ctx.fillRect(-4, -3, 8, 6);
    ctx.fillStyle = '#e3d8b8';
    ctx.fillRect(0, -3, 4, 6);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(-3, 0, 6, 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- Loop con subpasos (menos tunneling) ---
  function loop() {
    for (let s = 0; s < 2; s++) Engine.update(engine, 1000 / 120);

    // tope de velocidad lineal y angular de TODOS los libros:
    // evita que al empujar uno, los demás salgan disparados (método de
    // clamp por frame recomendado en la comunidad de Matter.js).
    for (const b of books) {
      const v = b.velocity;
      const sp = Math.hypot(v.x, v.y);
      if (sp > MAX_SPEED) {
        Body.setVelocity(b, { x: v.x / sp * MAX_SPEED, y: v.y / sp * MAX_SPEED });
      }
      if (Math.abs(b.angularVelocity) > MAX_SPIN) {
        Body.setAngularVelocity(b, Math.sign(b.angularVelocity) * MAX_SPIN);
      }
    }

    // animación de agarre
    for (const b of books) {
      const target = b === dragBody ? 1 : 0;
      b.userData.grab += (target - b.userData.grab) * 0.2;
    }

    // hojas
    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i];
      p.vy += 0.05;
      p.sway += 0.2;
      p.x += p.vx + Math.sin(p.sway) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.01;
      if (p.life <= 0 || p.y > VH + 12) pages.splice(i, 1);
    }

    updateFloating();
    draw();
    requestAnimationFrame(loop);
  }
  loop();
}
