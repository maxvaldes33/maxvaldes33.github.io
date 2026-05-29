// ============================================================
// THREE-BG.JS
// Fondo animado sutil con Three.js + tilt 3D de tecnologías
// Tema: <html> sin clase = OSCURO (cyberpunk), html.light = CLARO
// ============================================================

import * as THREE from 'three';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none)').matches;

const isLight = () => document.documentElement.classList.contains('light');

// ------------------------------------------------------------
// 1) Tilt 3D + brillo de los botones de tecnología (.tag)
// ------------------------------------------------------------
(function initTagTilt() {
  if (reduceMotion || isTouch) return;
  const tags = document.querySelectorAll('.tag');
  const MAX_TILT = 14; // grados

  tags.forEach((tag) => {
    tag.addEventListener('mousemove', (e) => {
      const r = tag.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;   // 0..1
      const py = (e.clientY - r.top) / r.height;   // 0..1
      const rotY = (px - 0.5) * 2 * MAX_TILT;
      const rotX = (0.5 - py) * 2 * MAX_TILT;
      tag.style.transform =
        `perspective(500px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(8px)`;
      tag.style.setProperty('--mx', `${px * 100}%`);
      tag.style.setProperty('--my', `${py * 100}%`);
    });
    tag.addEventListener('mouseleave', () => {
      tag.style.transform = '';
    });
  });
})();

// ------------------------------------------------------------
// 2) Fondo Three.js (sutil)
// ------------------------------------------------------------
const canvas = document.getElementById('three-bg');
if (canvas && !reduceMotion) initBackground(canvas);

function fallbackBackground() {
  // WebGL no disponible (p.ej. aceleración por hardware desactivada):
  // mostramos un fondo animado por CSS para no dejarlo en negro plano.
  document.documentElement.classList.add('webgl-fallback');
  if (canvas) canvas.classList.add('loaded');
}

function initBackground(canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
  camera.position.z = 16;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (e) {
    console.warn('WebGL no disponible, usando fondo CSS:', e);
    fallbackBackground();
    return;
  }
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));

  // Paletas (cyan + magenta en oscuro · indigo suave en claro)
  const palette = {
    dark:  { particles: 0x00e5ff, wire: 0xff2bd6, grid: 0x00e5ff },
    light: { particles: 0x5558e3, wire: 0x8b8ef0, grid: 0xc7c9f5 },
  };

  // --- Campo de partículas ---
  const COUNT = 1100;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 7 + Math.random() * 15;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.14,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  // --- Objeto wireframe central (icosaedro=claro · torus-knot=oscuro) ---
  const wireMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true });
  const ico  = new THREE.Mesh(new THREE.IcosahedronGeometry(3.6, 1), wireMat);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(2.8, 0.65, 130, 16), wireMat);
  scene.add(ico, knot);

  // --- Grilla tipo Tron (solo modo oscuro) ---
  const grid = new THREE.GridHelper(70, 44);
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  grid.position.y = -11;
  scene.add(grid);

  // --- Aplicar tema (sutil) ---
  function applyTheme() {
    const light = isLight();
    const c = light ? palette.light : palette.dark;
    pMat.color.setHex(c.particles);
    wireMat.color.setHex(c.wire);
    grid.material.color.setHex(c.grid);

    pMat.opacity   = light ? 0.5 : 0.85;
    wireMat.opacity = light ? 0.28 : 0.5;
    ico.visible  = light;
    knot.visible = !light;
    grid.visible = !light;
  }
  applyTheme();

  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });

  // --- Parallax con mouse ---
  const target = { x: 0, y: 0 };
  if (!isTouch) {
    addEventListener('mousemove', (e) => {
      target.x = (e.clientX / innerWidth - 0.5) * 2;
      target.y = (e.clientY / innerHeight - 0.5) * 2;
    });
  }

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // --- Pausar cuando la pestaña no es visible ---
  let running = true;
  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
    if (running) loop();
  });

  // --- Loop ---
  const clock = new THREE.Clock();
  function loop() {
    if (!running) return;
    const t = clock.getElapsedTime();

    points.rotation.y = t * 0.02;
    points.rotation.x = t * 0.01;
    ico.rotation.x  = t * 0.12;
    ico.rotation.y  = t * 0.16;
    knot.rotation.x = t * 0.18;
    knot.rotation.y = t * 0.22;
    grid.position.z = (t * 1.6) % 3.5;

    camera.position.x += (target.x * 2 - camera.position.x) * 0.04;
    camera.position.y += (-target.y * 2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

  requestAnimationFrame(() => canvas.classList.add('loaded'));
}
