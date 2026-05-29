// ============================================================
// HOBBIES.JS — Sección oculta (easter egg)
// Desbloqueo: 5 clicks en el logo "MV."
// Contiene: minijuego F1 (largada + dash) y biblioteca 3D
// ============================================================

import * as THREE from 'three';

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

    // Enciende las 5 luces, una por una
    lights.forEach((l, i) => {
      timeouts.push(setTimeout(() => l.classList.add('on'), 600 + i * 650));
    });
    // Apagado tras delay aleatorio → ¡GO!
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

  // --- Controles ---
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

  // Toque/click en mitades del canvas (móvil)
  canvas.addEventListener('pointerdown', (e) => {
    if (state === 'lights') { falseStart(); return; }
    if (state !== 'racing') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    move(x < rect.width / 2 ? -1 : 1);
  });

  // --- Loop ---
  function loop() {
    if (state !== 'racing') return;
    dist += speed * 0.1;
    speed = 4 + dist * 0.012;
    roadOffset = (roadOffset + speed) % 40;
    playerX += (targetX - playerX) * 0.25;

    // Spawn
    if (Math.random() < 0.025 + dist * 0.00004) {
      const l = Math.floor(Math.random() * 3);
      if (!obstacles.some(o => o.lane === l && o.y < CAR_H * 1.6)) {
        obstacles.push({ lane: l, x: LANES[l], y: -CAR_H });
      }
    }
    // Mover + colisión
    const py = H - CAR_H - 14;
    for (const o of obstacles) {
      o.y += speed;
      if (o.lane === lane &&
          o.y + CAR_H > py && o.y < py + CAR_H &&
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

  // --- Render ---
  function drawScene() {
    ctx.clearRect(0, 0, W, H);
    // pista
    ctx.fillStyle = '#0d1018';
    ctx.fillRect(0, 0, W, H);
    // líneas de carril en movimiento
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 3;
    ctx.setLineDash([18, 22]);
    ctx.lineDashOffset = -roadOffset;
    for (let i = 1; i < 3; i++) {
      const x = (LANES[i - 1] + LANES[i]) / 2;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.setLineDash([]);
    // bordes neón
    ctx.strokeStyle = 'rgba(0,229,255,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 0, W - 4, H);

    // obstáculos
    for (const o of obstacles) drawCar(o.x, o.y, '#ff3b6b');
    // jugador
    drawCar(playerX, H - CAR_H - 14, '#00e5ff');
  }

  function drawCar(cx, top, color) {
    const x = cx - CAR_W / 2;
    ctx.fillStyle = color;
    roundRect(x, top, CAR_W, CAR_H, 8); ctx.fill();
    // cabina
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(x + 8, top + 14, CAR_W - 16, CAR_H - 30, 5); ctx.fill();
    // alerones
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
// BIBLIOTECA 3D — libros arrastrables con Three.js
// ============================================================
function initShelf() {
  const canvas = document.getElementById('shelf-canvas');
  const resetBtn = document.getElementById('shelf-reset');

  const scene = new THREE.Scene();
  const w = canvas.clientWidth || 400;
  const h = canvas.clientHeight || 320;
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(0, 1.5, 12);
  camera.lookAt(0, 0.5, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h, false);

  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(4, 8, 6);
  scene.add(dir);
  const cyan = new THREE.PointLight(0x00e5ff, 0.6, 30);
  cyan.position.set(-6, 2, 6);
  scene.add(cyan);

  // --- Estante de madera ---
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.9 });
  const shelfW = 9, shelfD = 2.4, t = 0.3;
  function panel(sx, sy, sz, px, py, pz) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), woodMat);
    m.position.set(px, py, pz);
    scene.add(m);
  }
  panel(shelfW, t, shelfD, 0, -1.2, 0);                 // base
  panel(shelfW, t, shelfD, 0, 2.6, 0);                  // techo
  panel(t, 3.8, shelfD, -shelfW / 2, 0.7, 0);           // lado izq
  panel(t, 3.8, shelfD, shelfW / 2, 0.7, 0);            // lado der
  panel(shelfW, 3.8, t, 0, 0.7, -shelfD / 2);           // fondo

  // --- Libros ---
  const COLORS = [0x00e5ff, 0xff2bd6, 0x7c83ff, 0x3dd6a4, 0xff8c42,
                  0xffd166, 0xef476f, 0x06d6a0, 0x118ab2, 0x9b5de5];
  const books = [];
  const N = 10;
  let x = -shelfW / 2 + 0.6;
  for (let i = 0; i < N; i++) {
    const bw = 0.45 + Math.random() * 0.35;   // grosor
    const bh = 2.6 + Math.random() * 0.7;      // alto
    const bd = 1.8;                            // profundidad
    const mat = new THREE.MeshStandardMaterial({
      color: COLORS[i % COLORS.length], roughness: 0.55, metalness: 0.1,
    });
    const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
    book.position.set(x + bw / 2, -1.05 + bh / 2, 0);
    book.userData.home = book.position.clone();
    book.userData.homeRot = book.rotation.clone();
    scene.add(book);
    books.push(book);
    x += bw + 0.04;
  }

  // --- Arrastre con raycaster ---
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // z = 0
  const hit = new THREE.Vector3();
  const offset = new THREE.Vector3();
  let dragged = null;

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  canvas.addEventListener('pointerdown', (e) => {
    setPointer(e);
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObjects(books);
    if (hits.length) {
      dragged = hits[0].object;
      plane.constant = -dragged.position.z;
      ray.ray.intersectPlane(plane, hit);
      offset.copy(dragged.position).sub(hit);
      canvas.setPointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!dragged) return;
    setPointer(e);
    ray.setFromCamera(pointer, camera);
    if (ray.ray.intersectPlane(plane, hit)) {
      dragged.position.copy(hit).add(offset);
      dragged.position.z = 0.6; // lo saca un poco hacia el frente
      // inclinación "desordenada" según el movimiento horizontal
      dragged.rotation.z = THREE.MathUtils.clamp(-dragged.position.x * 0.05, -0.7, 0.7);
      dragged.rotation.x = -0.15;
    }
  });

  function drop() { dragged = null; }
  canvas.addEventListener('pointerup', drop);
  canvas.addEventListener('pointerleave', drop);

  // --- Reset (volver a ordenar) ---
  let tweening = false;
  resetBtn.addEventListener('click', () => { tweening = true; });

  // --- Resize ---
  const ro = new ResizeObserver(() => {
    const nw = canvas.clientWidth, nh = canvas.clientHeight;
    if (!nw || !nh) return;
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
    renderer.setSize(nw, nh, false);
  });
  ro.observe(canvas);

  // --- Loop ---
  function loop() {
    if (tweening) {
      let done = true;
      for (const b of books) {
        if (b === dragged) continue;
        b.position.lerp(b.userData.home, 0.15);
        b.rotation.z += (b.userData.homeRot.z - b.rotation.z) * 0.15;
        b.rotation.x += (b.userData.homeRot.x - b.rotation.x) * 0.15;
        if (b.position.distanceTo(b.userData.home) > 0.01) done = false;
      }
      if (done) tweening = false;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();
}
