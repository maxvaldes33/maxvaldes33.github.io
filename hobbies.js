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
  const VW = 256, VH = 160;
  canvas.width = VW;
  canvas.height = VH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // --- Motor ---
  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = 1;
  const world = engine.world;

  // --- Estructura estática (marco + repisa central) ---
  const wood = { isStatic: true, friction: 0.8, frictionStatic: 1, restitution: 0 };
  function wall(x, y, w, h) { World.add(world, Bodies.rectangle(x, y, w, h, wood)); }
  const FLOOR_Y = VH - 6;
  const SHELF_Y = 78;                  // repisa central
  wall(VW / 2, FLOOR_Y + 3, VW, 12);   // piso
  wall(6, VH / 2, 12, VH);             // pared izq
  wall(VW - 6, VH / 2, 12, VH);        // pared der
  wall(VW / 2, 4, VW, 12);             // techo
  wall(VW / 2, SHELF_Y, VW - 24, 6);   // repisa central

  // --- Libros (cuerpos dinámicos) ---
  const COLORS = [
    '#e6394a', '#f4a259', '#f7d046', '#5fb05a', '#3a8fb7',
    '#7d5ba6', '#d96c9b', '#2a9d8f', '#e76f51', '#4895ef',
  ];
  const books = [];
  const rows = [SHELF_Y - 3, FLOOR_Y - 3]; // borde superior de cada repisa
  const X0 = 16, X1 = VW - 16;

  for (const rowTop of rows) {
    let x = X0 + 4;
    while (x < X1 - 16) {
      const bw = 11 + Math.floor(Math.random() * 7);   // grosor del lomo
      const bh = 34 + Math.floor(Math.random() * 12);  // alto
      const cx = x + bw / 2;
      const cy = rowTop - bh / 2;
      const book = Bodies.rectangle(cx, cy, bw, bh, {
        friction: 0.6, frictionStatic: 1, restitution: 0.04, density: 0.005,
        chamfer: { radius: 0 },
      });
      book.userData = {
        w: bw, h: bh,
        color: COLORS[books.length % COLORS.length],
        bands: 1 + Math.floor(Math.random() * 2),
        home: { x: cx, y: cy, angle: 0 },
      };
      World.add(world, book);
      books.push(book);
      x += bw + 2;
    }
  }

  // --- Hojas que saltan al agitar ---
  const pages = [];
  function spawnPages(x, y, n) {
    for (let i = 0; i < n; i++) {
      pages.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: -1.5 - Math.random() * 2.5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        life: 1,
      });
    }
  }

  // --- Arrastre con constraint + detección de "agitar" ---
  let dragBody = null;
  let dragConstraint = null;
  let lastP = null, lastT = 0, shakeCooldown = 0;

  function toWorld(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * VW,
      y: (e.clientY - r.top) / r.height * VH,
    };
  }

  canvas.addEventListener('pointerdown', (e) => {
    const p = toWorld(e);
    const found = Query.point(books, p)[0];
    if (!found) return;
    dragBody = found;
    Body.setStatic(dragBody, false);
    if (dragBody.isSleeping) M.Sleeping.set(dragBody, false);
    const a = -dragBody.angle;
    const dx = p.x - dragBody.position.x, dy = p.y - dragBody.position.y;
    const pb = { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
    dragConstraint = Constraint.create({
      pointA: p, bodyB: dragBody, pointB: pb,
      stiffness: 0.18, damping: 0.12, length: 0,
    });
    World.add(world, dragConstraint);
    lastP = p; lastT = performance.now();
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragConstraint) return;
    const p = toWorld(e);
    dragConstraint.pointA = p;

    const now = performance.now();
    const dt = Math.max(16, now - lastT);
    const speed = Math.hypot(p.x - lastP.x, p.y - lastP.y) / dt * 1000; // px/s
    if (speed > 900 && now > shakeCooldown) {
      spawnPages(dragBody.position.x, dragBody.position.y, 2);
      shakeCooldown = now + 70;
    }
    lastP = p; lastT = now;
  });

  function drop() {
    if (dragConstraint) { World.remove(world, dragConstraint); dragConstraint = null; }
    dragBody = null;
  }
  canvas.addEventListener('pointerup', drop);
  canvas.addEventListener('pointercancel', drop);
  canvas.addEventListener('pointerleave', drop);

  // --- Reordenar ---
  resetBtn.addEventListener('click', () => {
    drop();
    pages.length = 0;
    for (const b of books) {
      Body.setPosition(b, { x: b.userData.home.x, y: b.userData.home.y });
      Body.setAngle(b, 0);
      Body.setVelocity(b, { x: 0, y: 0 });
      Body.setAngularVelocity(b, 0);
    }
  });

  // --- Render pixel-art ---
  function draw() {
    // fondo
    ctx.fillStyle = '#14121d';
    ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#1c1830';
    ctx.fillRect(0, 0, VW, VH / 2);

    // marco de madera
    drawWoodRect(0, 0, VW, 10);            // techo
    drawWoodRect(0, VH - 12, VW, 12);      // piso
    drawWoodRect(0, 0, 12, VH);            // izq
    drawWoodRect(VW - 12, 0, 12, VH);      // der
    drawWoodRect(12, SHELF_Y - 3, VW - 24, 6); // repisa

    for (const b of books) drawBook(b);
    for (const p of pages) drawPage(p);
  }

  function drawWoodRect(x, y, w, h) {
    ctx.fillStyle = '#5a3d22';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#76502e';
    ctx.fillRect(x, y, w, Math.max(2, h * 0.3));
    ctx.fillStyle = '#3d2817';
    ctx.fillRect(x, y + h - 2, w, 2);
  }

  function drawBook(b) {
    const d = b.userData;
    ctx.save();
    ctx.translate(Math.round(b.position.x), Math.round(b.position.y));
    ctx.rotate(b.angle);
    const w = d.w, h = d.h, x = -w / 2, y = -h / 2;
    // lomo
    ctx.fillStyle = d.color;
    ctx.fillRect(x, y, w, h);
    // páginas (borde claro a la derecha)
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(x + w - 2, y + 2, 2, h - 4);
    // sombra/realce
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(x, y, 2, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 2, y, 1, h);
    // bandas del título
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < d.bands; i++) {
      ctx.fillRect(x + 3, y + 6 + i * 6, w - 6, 2);
    }
    ctx.restore();
  }

  function drawPage(p) {
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = '#f4eeda';
    ctx.fillRect(-3, -2, 6, 5);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-2, 0, 4, 1);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // --- Loop ---
  function loop() {
    Engine.update(engine, 1000 / 60);

    for (let i = pages.length - 1; i >= 0; i--) {
      const p = pages[i];
      p.vy += 0.06;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      p.life -= 0.012;
      if (p.life <= 0 || p.y > VH + 10) pages.splice(i, 1);
    }

    draw();
    requestAnimationFrame(loop);
  }
  loop();
}
