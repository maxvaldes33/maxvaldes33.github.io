# Portfolio — Maximiliano Valdés

Portfolio personal de **Maximiliano Valdés**, Ingeniero en Informática (DUOC UC) especializado en automatización de procesos, desarrollo con Python, IA aplicada (Claude API) y análisis de datos con Power BI.

🔗 **En vivo:** [maxvaldes33.github.io](https://maxvaldes33.github.io)

---

## ✨ Qué muestra el portfolio

Sitio de una sola página (single-page) con navegación por anclas y las siguientes secciones:

| Sección | Contenido |
|---|---|
| **Hero** | Presentación, badges de disponibilidad, CTAs (experiencia, contacto, CV), redes y widgets de clima + contador de visitas |
| **Sobre mí** | Perfil profesional, idiomas y modalidad de trabajo (remoto / híbrido / presencial) |
| **Habilidades** | Barras de dominio por tecnología + tarjetas por área (Python, Datos & Reportes, IA & Automatización, Web, Cloud/DevOps, FastAPI) con tecnologías como **botones 3D interactivos** |
| **Experiencia** | Línea de tiempo con las posiciones laborales y logros |
| **Educación & Certificados** | Formación académica + galería de certificados verificables (lightbox) |
| **Proyectos & Roadmap** | Proyectos construidos y en desarrollo, con su stack y enlaces a GitHub |
| **Áreas de desarrollo** | Ejes de crecimiento técnico en foco |
| **Datos en tiempo real (APIs)** | Integraciones en vivo: cripto (Binance), actividad en GitHub, noticias tech (Hacker News), ubicación por IP (ipinfo.io), tipo de cambio (Banco Central de Chile vía mindicador.cl) y un chiste dev (JokeAPI) |
| **Contacto** | Enlaces directos (email, LinkedIn, teléfono) y formulario |
| **Visor de CV** | CV en `cv-viewer/` con versión PDF descargable |

---

## 🎨 Experiencia visual e interactividad

- **Dos modos de tema** con switcher (sistema / claro / oscuro), sin parpadeo al cargar.
  - **Modo claro:** diseño limpio y moderno, paleta indigo sobre fondo crema.
  - **Modo oscuro:** estética *hacker cyberpunk futurista* — neón **cyan + magenta**, glow en títulos, scanlines y glitch sutil.
- **Fondo 3D con Three.js** (sutil): campo de partículas + geometría wireframe (icosaedro en claro, torus-knot + grilla tipo Tron en oscuro) con parallax al mover el mouse. Reacciona al cambio de tema en tiempo real.
- **Tecnologías como botones 3D:** inclinación que sigue al cursor, borde luminoso y brillo radial.
- Otros efectos: botones magnéticos, tilt 3D en tarjetas, parallax del hero, animación *text-scramble* del nombre y grano (noise) sutil sobre todo el sitio.
- **Accesible:** respeta `prefers-reduced-motion` (desactiva el fondo/animaciones) y degrada de forma limpia en dispositivos táctiles o sin conexión.

---

## 🛠️ Stack técnico

- **HTML5 + CSS3 + JavaScript** (vanilla, sin frameworks ni build step)
- **[Three.js](https://threejs.org/)** r160 (vía CDN jsDelivr, como módulo ES)
- Tipografías: **Archivo** + **Space Grotesk** (Google Fonts)
- Hospedaje: **GitHub Pages** (deploy automático desde `main`)

---

## 📁 Estructura

```
.
├── index.html        # Página principal (todas las secciones)
├── styles.css        # Estilos base + sistema de tema (claro/oscuro)
├── interactive.css   # Botones 3D, fondo Three.js y acentos cyberpunk
├── main.js           # Lógica: tema, widgets, APIs en vivo, efectos
├── three-bg.js       # Fondo animado Three.js + tilt 3D de tecnologías
├── cv-data.js        # Datos del CV
├── cv-viewer/        # Visor de CV (HTML + PDF)
└── Certificados/     # Imágenes/PDF de certificados
```

---

## 🚀 Ejecutar en local

No requiere build. Basta con servir la carpeta (Three.js usa módulos ES, así que conviene un servidor en vez de abrir el archivo directo):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

---

## 📬 Contacto

- **Email:** musrri.valdes.maxi03@gmail.com
- **LinkedIn:** [Maximiliano Valdés](https://www.linkedin.com/in/maximiliano-alejandro-valdes-musrri-716678271/)
- **GitHub:** [@maxvaldes33](https://github.com/maxvaldes33)
