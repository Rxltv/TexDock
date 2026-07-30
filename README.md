# TexDock

> Aprende LaTeX escribiendo.

TexDock es una plataforma web educativa y minimalista para aprender LaTeX mediante explicaciones breves, ejemplos editables, ejercicios prácticos y visualización inmediata del resultado.

El proyecto está dirigido a estudiantes, docentes, tesistas e investigadores que desean comprender LaTeX antes de utilizar herramientas de producción como Overleaf, TeXstudio o VS Code.

[![Sitio web](https://img.shields.io/badge/Sitio_web-Abrir_TexDock-111111?style=flat-square)](https://rxltv.github.io/TexDock/)
[![Despliegue](https://github.com/Rxltv/TexDock/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/Rxltv/TexDock/actions/workflows/deploy-pages.yml)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)](https://astro.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-estricto-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

## Sitio público

- **Inicio:** <https://rxltv.github.io/TexDock/>
- **Curso de LaTeX:** <https://rxltv.github.io/TexDock/aprender/>
- **Fórmulas LaTeX:** <https://rxltv.github.io/TexDock/laboratorio/>
- **Biblioteca y plantillas:** <https://rxltv.github.io/TexDock/biblioteca/>

## Estado actual

TexDock se encuentra en la **Fase 1: plataforma pública sin cuentas**.

La versión actual incluye:

- Curso principal de LaTeX organizado en **15 secciones**.
- Teoría breve distribuida en páginas pequeñas.
- Ejemplos y ejercicios progresivos.
- Editor basado en CodeMirror 6.
- Vista previa inmediata con KaTeX.
- Validación pedagógica de ejercicios.
- Diferenciación visual entre el preámbulo y el cuerpo del documento.
- Navegación por secciones, lecciones y páginas.
- Temas claro y oscuro.
- Diseño responsive.
- Biblioteca inicial con plantillas descargables en `.tex`.
- Herramienta **Fórmulas LaTeX** para:
  - copiar el código;
  - descargar la fórmula como SVG;
  - descargarla como PNG transparente.
- Despliegue estático mediante GitHub Pages y GitHub Actions.

## Filosofía educativa

La experiencia central de TexDock sigue este flujo:

```text
Teoría breve
    ↓
Ejemplo editable
    ↓
Práctica
    ↓
Visualización inmediata
    ↓
Comprobación
    ↓
Explicación del resultado o del error
```

El contenido se construye de forma acumulativa: cada página introduce una idea concreta y reutiliza lo aprendido anteriormente.

## Qué enseña el curso

El recorrido actual cubre, entre otros temas:

1. Introducción a LaTeX.
2. Estructura.
3. Paquetes.
4. Datos y Resumen.
5. Organización del contenido.
6. Formato de texto.
7. Listas.
8. Escritura matemática.
9. Entornos matemáticos y teoremas.
10. Tablas.
11. Imágenes y figuras.
12. Notas al pie.
13. Referencias internas.
14. Bibliografía básica.
15. Reopaso

## Qué no pretende ser TexDock

TexDock no busca convertirse en:

- un clon de Overleaf;
- un editor colaborativo en tiempo real;
- una plataforma para almacenar proyectos privados completos;
- un procesador de textos general;
- una herramienta centrada en producir documentos PDF completos.

Su prioridad es el **aprendizaje guiado de LaTeX**.

## Tecnologías

### Interfaz y contenido

- [Astro](https://astro.build/)
- [React](https://react.dev/) en componentes interactivos
- [TypeScript](https://www.typescriptlang.org/)
- Astro Content Collections
- CSS propio y variables de diseño

### Editor y renderizado

- [CodeMirror 6](https://codemirror.net/)
- [KaTeX](https://katex.org/) para la vista previa inmediata
- [MathJax](https://www.mathjax.org/) para la exportación SVG
- Canvas del navegador para la exportación PNG

### Calidad

- [Vitest](https://vitest.dev/)
- Astro Check
- Pruebas unitarias, de integración y de contenido
- GitHub Actions
- GitHub Pages

## Arquitectura actual

TexDock es una aplicación estática. Astro genera el contenido educativo y React se utiliza únicamente donde se necesita interacción.

```text
Navegador
├── Astro
│   ├── páginas públicas
│   ├── curso
│   ├── biblioteca
│   └── plantillas
├── React
│   ├── editor
│   ├── vista previa
│   └── acciones interactivas
├── KaTeX
│   └── renderizado matemático inmediato
└── MathJax
    └── exportación SVG bajo demanda
```

No existe backend en esta fase. Django, Django REST Framework y PostgreSQL pertenecen a etapas posteriores.

## Instalación local

### Requisitos

- Node.js 22
- npm 10 o superior
- Git

### Clonar e instalar

```bash
git clone https://github.com/Rxltv/TexDock.git
cd TexDock
npm ci
```

### Ejecutar en desarrollo

```bash
npm run dev
```

Astro mostrará la dirección local disponible, normalmente:

```text
http://localhost:4321
```

## Comandos principales

```bash
npm run dev
npm run test
npm run build
npm run validate
```

`npm run validate` ejecuta las comprobaciones definidas por el proyecto antes de integrar cambios.

## Estructura resumida

```text
TexDock/
├── .github/
│   └── workflows/
├── docs/
├── public/
│   └── plantillas/
├── src/
│   ├── components/
│   ├── content/
│   ├── layouts/
│   ├── lib/
│   ├── pages/
│   ├── styles/
│   └── tests/
├── astro.config.mjs
├── package.json
├── README.md
└── TEXDOCK_Progress_Log.md
```

## Desarrollo y contribuciones

Antes de modificar el proyecto:

1. Revisa `AGENTS.md`.
2. Lee el último `TEXDOCK_Progress_Log.md`.
3. Confirma la fase y el alcance de la tarea.
4. Trabaja en una rama independiente.
5. Ejecuta las validaciones antes de crear un Pull Request.

Flujo recomendado:

```bash
git switch main
git pull --ff-only
git switch -c feature/nombre-del-cambio

npm run validate
```

No deben incorporarse funciones fuera de la fase aprobada ni cambios que conviertan TexDock en un editor general de documentos.

Los errores, propuestas y contribuciones pueden enviarse mediante [Issues](https://github.com/Rxltv/TexDock/issues) y Pull Requests.

## Próximos objetivos

- Consolidar la revisión editorial del curso.
- Ampliar la biblioteca de guías y plantillas.
- Definir las reglas pedagógicas de progreso.
- Mejorar la documentación pública para colaboradores.
- Realizar auditorías adicionales de accesibilidad, rendimiento y compatibilidad.
- Preparar la siguiente fase sin adelantar cuentas, backend o renderizado avanzado.

## Autor

Proyecto creado y mantenido por **Nicolas Vilca**.
