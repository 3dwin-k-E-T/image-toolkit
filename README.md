# Image Toolkit

Sitio web estático para editar, mejorar y transformar imágenes. El proyecto
está en desarrollo; por ahora incluye la página principal y marcos informativos
para las herramientas, sin implementar editores.

## Estructura

```text
index.html
README.md
CSS/
  main.css
  editor.css
  favicon/
    layout.css
JS/
  main.js
  editor.js
editors/
  edicion-basica.html
  favicon.html
  fondo-ia.html
  avanzadas.html
```

## Convenciones

- Mantener los nombres de carpetas `CSS/`, `JS/` y `editors/` tal cual.
- Usar clases en inglés con nombres descriptivos; reservar el prefijo `site-`
  para el marco compartido del sitio.
- Las páginas de herramientas reutilizan `CSS/main.css` y `CSS/editor.css`.
- Desde cualquier página dentro de `editors/`, las rutas a recursos compartidos
  comienzan por `../` (por ejemplo, `../CSS/main.css`); el inicio está en
  `../index.html`.
- Los editores no deben mostrar controles activos hasta que su funcionalidad
  esté implementada.

## Ejecución local

Abre la raíz del proyecto con Live Server en VS Code, o ejecuta desde esa
carpeta:

```bash
python -m http.server
```

Después visita `http://localhost:8000`. Un servidor local permite cargar los
recursos y, cuando se incorporen, los módulos ES: los navegadores restringen
los módulos al abrir páginas con `file://`.

## Estado

### Hecho

- Página principal con navegación a las páginas existentes.
- Diseño adaptable y marco común para las páginas de herramientas.
- Avisos «Próximamente» y de desarrollo donde todavía no hay funcionalidad.
- Documentación de estructura y ejecución local.

### Pendiente

- Implementar búsqueda, tema, perfil, proyectos y favoritos.
- Implementar las herramientas de edición y las secciones informativas.
- Añadir la lógica JavaScript cuando exista funcionalidad real que conectar.