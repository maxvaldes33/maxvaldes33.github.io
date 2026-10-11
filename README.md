# Portfolio — Maximiliano Valdés

Portfolio personal de **Maximiliano Valdés**, Ingeniero en Informática (DUOC UC) especializado en automatización de procesos, desarrollo con Python, IA aplicada (Claude API) y análisis de datos con Power BI.

🔗 **En vivo:** [maxvaldes33.github.io](https://maxvaldes33.github.io)

---

## ✨ Qué muestra el portfolio

Sitio de una sola página con navegación por anclas:

| Sección | Contenido |
|---|---|
| **Inicio** | Presentación, enfoque profesional, modalidad de trabajo y accesos a CV, LinkedIn y GitHub |
| **01 · Trabajo** | Tres casos reales (problema → solución → resultado) y otros proyectos personales con enlace a GitHub |
| **02 · Experiencia** | Trayectoria con logros concretos por cargo |
| **03 · Habilidades** | Herramientas agrupadas por tipo de problema; las que están en aprendizaje aparecen marcadas |
| **04 · Formación** | Título, cursos, idiomas y certificados verificables (visor con teclado) |
| **05 · Contacto** | Datos directos y formulario con validación en línea (Web3Forms) |
| **Visor de CV** | CV en `cv-viewer/` con versión PDF descargable |

Los casos de trabajo omiten clientes, proveedores y montos por confidencialidad.

---

## 🎨 Diseño

- **Estética editorial:** fondo tipo papel, tinta cálida y un solo color de acento (verde profundo).
- **Tipografía:** Newsreader (títulos), Geist (texto) y Geist Mono (fechas, etiquetas y datos).
- **Tema claro y oscuro** que sigue al sistema, con selector Sistema / Claro / Oscuro en el pie de página y sin parpadeo al cargar.
- **Accesible:** enlace para saltar al contenido, foco visible con teclado, landmarks semánticos y respeto a `prefers-reduced-motion`.
- **Liviano:** sin fondo 3D ni widgets externos; el grano de papel es un SVG estático.
- **Vista previa para redes:** `og-image.png` (1200 × 630) para LinkedIn y otras plataformas.

---

## 🥚 Easter egg

<details>
<summary>Hay una sección oculta de hobbies… (spoiler)</summary>

Haz **5 clicks en el logo "MV."** para desbloquear una zona secreta con dos minijuegos:
- 🏎️ **F1 · Largada & Dash** — espera a que se apaguen las 5 luces, mide tu reacción y esquiva el tráfico (← → / A D).
- 📚 **Biblioteca pixel-art con físicas** — arrastra los libros: caen, chocan y se apilan de verdad; si los agitas, sueltan hojas (Matter.js).

</details>

---

## 🛠️ Stack técnico

- **HTML5 + CSS3 + JavaScript** (vanilla, sin frameworks ni build step)
- **[Matter.js](https://brm.io/matter-js/)** (físicas 2D de la biblioteca pixel-art del easter egg)
- Tipografías: **Newsreader**, **Geist** y **Geist Mono** (Google Fonts)
- Hospedaje: **GitHub Pages** (deploy automático desde `main`)

---

## 📁 Estructura

```
.
├── index.html        # Página principal (todas las secciones)
├── styles.css        # Sistema de diseño: tokens, tema claro/oscuro y componentes
├── main.js           # Tema, navegación, visor de certificados y formulario
├── hobbies.css/.js   # Sección oculta (minijuegos)
├── og-image.png      # Imagen de vista previa para redes
├── cv-viewer/        # Visor de CV (HTML + PDF)
└── Certificados/     # Imágenes/PDF de certificados
```

---

## 🚀 Ejecutar en local

No requiere build. Basta con servir la carpeta (el easter egg usa módulos ES, así que conviene un servidor en vez de abrir el archivo directo):

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

---

## 📬 Contacto

- **Email:** musrri.valdes.maxi03@gmail.com
- **LinkedIn:** [Maximiliano Valdés](https://www.linkedin.com/in/maximiliano-alejandro-valdes-musrri-716678271/)
- **GitHub:** [@maxvaldes33](https://github.com/maxvaldes33)
