# TexDock — Registro de progreso

> Registro histórico archivado. El estado vigente se documenta en `TEXDOCK_Progress_Log.md`.

## Sesión: 2026-07-20

| Campo                 | Valor                                        |
| :-------------------- | :------------------------------------------- |
| Fase actual           | Fase 0.2D — Corrección de errores TypeScript |
| Rama                  | `feature/phase-0-polish`                     |
| Objetivo de sesión    | Corregir 19 errores reportados por `astro check` |
| Estado inicial        | `astro check` falla con 19 errores en MathPlayground.tsx |
| Stack actual          | Node.js 22+, Astro 7, React 19, KaTeX 0.18, Vitest, @astrojs/check, HTML, CSS |

### Errores corregidos

| Tipo                | Cantidad | Corrección aplicada               |
| :------------------ | -------: | :-------------------------------- |
| `class` → `className` | 17      | Atributo JSX corregido            |
| `for` → `htmlFor`   | 1        | Atributo JSX corregido            |
| `spellcheck` → `spellCheck` | 1 | Atributo JSX corregido            |
| `useRef` sin inicial | 1       | Añadido `| null` y `(null)`       |

### Archivos modificados

- `src/components/playground/MathPlayground.tsx` — correcciones JSX y useRef
- `README.md` — actualizado (check ya no está bloqueado)
- `TexDock_Progress_Log.md` — registro de esta sesión
- `docs/phases/TexDock_Fase_0_Cierre.md` — actualizado (check ya no es limitación)

### Comprobaciones finales

- [x] `npm run check` — 0 errores, 0 advertencias, 0 hints
- [x] `npm run test` — 16 tests pasan
- [x] `npm run build` — 2 páginas, sin errores
- [x] `npm run validate` — check + test + build pasan sin errores
- [x] `git status --short` verificado
- [x] `git diff --stat` verificado
- [x] `git diff --check` sin conflictos de Whitespace

### Estado final de la Fase 0

**Fase 0 — Cerrada oficialmente.**

Todos los criterios de cierre se cumplen, incluyendo `astro check` con 0 errores. El prototipo valida el concepto de render matemático inmediato con KaTeX en Astro + React.

---

## Cierre: 2026-07-20 — Subfase 1A

| Campo                 | Valor                                        |
| :-------------------- | :------------------------------------------- |
| Fase                 | Fase 1 — Curso básico de LaTeX              |
| Subfase              | 1A — Fundamentos de interfaz y arquitectura |
| Estado               | **Completada y fusionada en `main`** |
| Rama de cierre       | `docs/phase-1A-closeout`                    |
| Próxima subfase      | 1B — Implementación vertical educativa      |

### Pull requests y commits

| Referencia | Descripción |
| :--------- | :---------- |
| PR #1 (`40fee61`) | Especificación de la Fase 1 |
| PR #2 (`0627f87`) | Implementación de fundamentos 1A |

### Cambios implementados

- Navegación global (Header con enlaces a Inicio, Aprender, Biblioteca, Acerca de y GitHub)
- Páginas: Inicio (`/`), Aprender (`/aprender`), Biblioteca (`/biblioteca`), Acerca de (`/acerca`)
- Panel lateral de navegación del curso (Sidebar) con lista de 15 secciones y `aria-current`
- Cabecera provisional de progreso (ProgressHeader) con barra accesible y texto "Sección X de 15"
- Temas claro y oscuro con `data-theme`, `localStorage` y `prefers-color-scheme` como fallback
- ThemeToggle resistente a fallos de almacenamiento (try/catch en localStorage)
- Content Collections con schemas Zod (3 colecciones: course, section, lesson)
- Metadatos de las 15 secciones del curso básico
- Una lección provisional (status: `draft`) por cada sección
- CourseLayout con sidebar + contenido + cabecera de progreso
- Tipos iniciales de progreso (`ProgressState`, `SectionState`)
- GitHub Actions ejecutando `npm run validate` en PR y push a `main`
- Pruebas de contenido (15 secciones, IDs únicos, orden) y de tipos de progreso

### Validaciones finales

- [x] `astro check` — 0 errores, 0 warnings, 0 hints
- [x] `vitest run` — 4 test files, 25 pruebas aprobadas
- [x] `astro build` — 20 páginas estáticas generadas
- [x] `npm run validate` — correcto
- [x] Árbol de trabajo limpio

### Elementos pendientes para fases siguientes

- CodeMirror como editor con resaltado de sintaxis
- Dexie e IndexedDB para persistencia
- Progreso persistente y desbloqueo real de lecciones y secciones
- Validación de ejercicios (reglas declarativas)
- Renderizador educativo completo (KaTeX + SAFE_LATEX_PREVIEW)
- Contenido definitivo de las 15 secciones
- Biblioteca con dos plantillas (tarea académica, apuntes de clase)
- Despliegue público

### Notas

- 1A está aprobada tras auditoría documental. Los cambios están fusionados en `main`.
- La Fase 1 completa todavía no está terminada.
- 1B implementará una experiencia vertical limitada con las Secciones 1 y 2, incluyendo CodeMirror, Dexie, renderizador y validación.

### Siguiente paso

**Subfase 1B — Implementación vertical educativa (Secciones 1 y 2).**

---

## Sesión: 2026-07-21 — Fase 1B: motor vertical de aprendizaje

| Campo                 | Valor                                                    |
| :-------------------- | :------------------------------------------------------- |
| Fase activa           | Fase 1B — Motor vertical de aprendizaje                  |
| Rama                  | `feature/phase-1B`                                       |
| Fecha                 | 2026-07-21                                               |
| Árbol de trabajo      | Limpio (`git status --short` sin cambios)                |

### 1. Estado previo de la rama

La rama `feature/phase-1B` se creó a partir de `main` tras el cierre de 1A. Al inicio de la sesión el árbol estaba limpio, sin cambios sin seguimiento y con la configuración base de 1A funcionando: navegación global, CourseLayout, Sidebar, ThemeToggle, Content Collections con 15 secciones y 15 lecciones borrador, 25 tests pasando y 20 páginas generadas.

### 2. Integración de CodeMirror

Se incorporó **CodeMirror 6** como editor de LaTeX en el laboratorio y en la vista de ejercicios.

**Archivos creados:**
- `src/components/editor/LatexCodeEditor.tsx` — componente React que envuelve CodeMirror 6 con:
  - Tema claro (`oneDark`) adaptado a la paleta del curso
  - Tema oscuro con retroiluminación suave (`oneDark` con ajustes)
  - Extensión de resaltado de sintaxis LaTeX
  - `lineWrapping` activado
  - Altura dinámica (`min-height: 120px`)
  - Evento `onChange` tipado para comunicación con el workspace
- `src/components/editor/SafeLatexWorkspace.tsx` — contenedor que orquesta editor + vista previa + acciones

**Dependencias añadidas:**
- `codemirror` (^6.0.1)
- `@codemirror/lang-json` (resaltado adicional)
- `@codemirror/lang-xml` (resaltado adicional)
- `@codemirror/language-data` (contiene `@codemirror/legacy-modes` para resaltado LaTeX)
- `@codemirror/legacy-modes` (modo LaTeX para CodeMirror 6)

### 3. Acciones Copiar, Limpiar y Restaurar

El `SafeLatexWorkspace` incluye tres botones de acción:

| Acción     | Comportamiento                                              |
|:-----------|:------------------------------------------------------------|
| **Copiar** | Copia el contenido del editor al portapapeles (`navigator.clipboard.writeText`). Muestra retroalimentación visual breve ("¡Copiado!"). |
| **Limpiar**| Vacía el editor. Si hay contenido, pide confirmación con `window.confirm` para evitar borrados accidentales. |
| **Restaurar** | Vuelve al contenido inicial (`initialLatex`) pasado como prop. Útil tras limpiar o modificar. |

Los botones usan `type="button"` para evitar envíos de formulario y tienen `aria-label` descriptivo.

### 4. Parser `SAFE_LATEX_PREVIEW`

Archivo: `src/lib/latex/safeLatexPreview.ts`

Función pura que parsea un subset seguro de LaTeX para vista previa:

- Extrae contenido de entornos conocidos: `equation*`, `equation`, `align*`, `align`, `gather*`, `gather`, `multline*`, `multline`.
- Sustituye comandos inseguros por una marca `<COMMAND_REMOVED>`:
  - Comandos prohibidos: `\input`, `\include`, `\def`, `\edef`, `\gdef`, `\xdef`, `\newcommand`, `\renewcommand`, `\let`, `\write`, `\read`, `\newwrite`, `\immediate`, `\catcode`, `\lccode`, `\uccode`, `\special`, `\directlua`, `\verbatiminput`, `\listing`, `\lstinputlisting`, `\includegraphics`, `\includegraphics*`.
- Mantiene el preámbulo (`\documentclass`, `\usepackage`) por compatibilidad pero no se renderiza.
- Elimina `\begin{document}` y `\end{document}`.
- El resultado incluye: `{ preview: string; display: boolean; safe: boolean; removed: string[] }`.

### 5. Vista previa automática con debounce

Archivo: `src/components/preview/SafeLatexPreviewPanel.tsx`

Componente React que:

- Recibe el código LaTeX como prop.
- Aplica **debounce de 400 ms** antes de parsear y renderizar.
- Mientras se espera el debounce muestra "Previsualizando…" con `role="status"` y `aria-live="polite"`.
- En caso de error de KaTeX muestra el mensaje de error en rojo con `role="alert"`.
- Si el parser detecta comandos inseguros, muestra una advertencia accesible con `role="status"`.
- El renderizado KaTeX se ejecuta en `useEffect` con `katex.renderToString`.
- Usa `display: false` para las vistas previas (estilo inline, centrado).

### 6. Accesibilidad de la vista previa

- `role="status"` en contenedor principal
- `aria-live="polite"` para anunciar cambios sin interrumpir
- `role="alert"` para errores de sintaxis LaTeX
- Mensaje de carga con `role="status"`
- Todos los botones con `aria-label`
- Contraste suficiente en ambos modos (claro y oscuro)

### 7. Motor puro de validación pedagógica

Archivo: `src/lib/exercises/validateExercise.ts`

Función pura `validateExercise(input, exercise)` que:

- Recibe el código LaTeX del alumno y el ejercicio (con campos `rules`).
- Evalúa reglas declarativas una a una.
- Cada regla produce un resultado: `{ passed: boolean; message: string; type: 'success' | 'error' | 'info' }`.
- Devuelve `{ passed: boolean; results: RuleResult[] }`.
- No tiene efectos secundarios ni estado.

### 8. Reglas soportadas y no soportadas

**Reglas implementadas:**

| Regla | Descripción |
|:------|:------------|
| `contains` | El código debe contener un fragmento de texto (ej. `\sum`) |
| `not_contains` | El código no debe contener un fragmento |
| `contains_all` | Debe contener todos los fragmentos de una lista |
| `contains_none` | No debe contener ninguno de los fragmentos |
| `render_count` | Cuenta cuántas veces aparece una cadena |
| `environment_count` | Verifica que un entorno LaTeX aparece N veces |
| `length_between` | La longitud del código está entre min y max |
| `regex` | El código debe coincidir con una expresión regular |
| `not_regex` | El código no debe coincidir con una expresión regular |

**Reglas NO implementadas (pendientes para fases futuras):**

| Regla | Motivo |
|:------|:-------|
| `max_commands` | No hay caso de uso inmediato en secciones 1-2 |
| `forbidden_commands` | Se cubre parcialmente con `not_contains` / `not_regex` |
| `structure` | Requiere AST LaTeX; demasiado complejo para 1B |
| `semantic_equality` | Requiere normalización algebraica; fuera de alcance |
| `katex_error` | Depende de integración con motor de renderizado |

### 9. Pruebas del validador

Archivo: `src/lib/exercises/validateExercise.test.ts`

66 tests que cubren:

- Cada regla individual con casos positivos y negativos
- Combinaciones de reglas (`AND` lógico: todas deben pasar)
- Ejercicios sin reglas (pasan por defecto)
- Reglas con configuraciones inválidas (mensaje de error descriptivo)
- Todos los tests usan la función pura sin mockear nada

Archivo adicional: `src/lib/latex/safeLatexPreview.test.ts` — 16 tests para el parser.
Archivo adicional: `src/lib/latex/previewDisplay.test.ts` — 12 tests para la función de display.

Total de la sesión: **+94 tests** (de 25 a 119, luego reestructurados a **176**).

### 10. Corrección del layout del curso

El CourseLayout (`src/layouts/CourseLayout.astro`) se rediseñó completamente:

```
┌─────────────────────────────────────────────┐
│  Header (fixed, z-40)                       │
├──────────┬──────────────────────────────────┤
│ Sidebar  │  Contenido principal             │
│ (sticky  │  (overflow-y: auto, altura fija) │
│  top,    │                                  │
│  w-72,   │  [ProgressHeader]                │
│  h-full) │  [slot]                          │
│          │                                  │
│          │  ┌──────────┬─────────────┐      │
│          │  │ Editor   │ Vista       │      │
│          │  │ (left)   │ Previa      │      │
│          │  │          │ (right)     │      │
│          │  └──────────┴─────────────┘      │
└──────────┴──────────────────────────────────┘
```

- **Sidebar izquierda** (`w-72`): sticky, scroll independiente, oculta en móvil
- **Scroll interno**: solo el área de contenido hace scroll (`overflow-y: auto`); el sidebar y el header permanecen fijos
- **Panel principal estable**: sin scroll general en escritorio (`html, body { overflow: hidden }`)
- **Editor izquierda + Vista previa derecha**: disposición horizontal con `grid-cols-2` o `flex`
- **Adaptación móvil provisional**: en pantallas < 768px la sidebar desaparece (toggle), el editor y la vista previa se apilan verticalmente, y el contenido principal ocupa todo el ancho
- Se eliminó el scroll general en escritorio para evitar el doble scroll

### 11. Corrección del selector claro/oscuro

El `ThemeToggle` se corrigió para:

- Leer `data-theme` del `<html>` en lugar de depender solo de `localStorage`
- Aplicar `try/catch` en todas las operaciones de `localStorage`
- Escuchar `prefers-color-scheme` como fallback
- Forzar el atributo en el HTML antes de cualquier renderizado de React (script inline en `<head>`)
- Iconos de sol/luna con `aria-hidden="true"` y texto descriptivo con `sr-only`

### 12. Nueva landing mínima

Archivo: `src/pages/index.astro`

Landing completamente rehecha:

- **Hero central grande** con título principal, subtítulo y botón "Comenzar" enlazando a `/aprender`
- **Fórmulas decorativas** renderizadas estáticamente con KaTeX (cero JavaScript de cliente)
- **Comandos LaTeX monocromáticos** como background decorativo
- **Animaciones CSS** usando únicamente `transform` (sin animar `top`, `left`, `width`, `height`)
- **Cero hidratación**: el componente es `.astro` puro, sin client directives
- **Soporte `prefers-reduced-motion`**: todas las animaciones se desactivan respetando `@media (prefers-reduced-motion: reduce)`

### 13. Tema oscuro profundo y tema claro

La paleta se definió en `src/styles/global.css` con variables CSS:

```css
:root, [data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --text-primary: #111111;
  --text-secondary: #444444;
  --border-color: #e0e0e0;
  --accent: #2563eb;
  /* … más variables … */
}

[data-theme="dark"] {
  --bg-primary: #0a0a0a;
  --bg-secondary: #141414;
  --text-primary: #e8e8e8;
  --text-secondary: #a0a0a0;
  --border-color: #2a2a2a;
  --accent: #60a5fa;
  /* … más variables … */
}
```

Características:
- **Base blanco / negro** sin matices dominantes
- **Modo oscuro cercano al negro** (`#0a0a0a` fondo principal, `#141414` secundario)
- **Varios colores repartidos por contexto** (azul para enlaces, verde para éxito, rojo para error, amarillo para advertencias)
- Sin un color global dominante

### 14. Nueva composición visual del landing

La landing (`src/pages/index.astro`) incluye:

- **Hero central**: `<h1>` con texto grande, `<p>` descriptivo, botón CTA
- **Fórmulas renderizadas estáticamente con KaTeX**: se importa KaTeX y se usa `katex.renderToString()` en tiempo de compilación
- **Comandos LaTeX monocromáticos de fondo**: texto disperso con `opacity` baja y `position: absolute`, sin interferir con el contenido
- **Animaciones CSS con `transform`**: desplazamientos suaves en hover y en carga inicial usando `translateY`, `rotate`, `scale`
- **Cero JavaScript de cliente**: el archivo .astro no usa `client:load` ni `client:visible` ni ningún directive de hidratación
- **Cero hidratación**: la página se envía como HTML estático, sin React en el cliente
- **Soporte `prefers-reduced-motion`**:

```css
@media (prefers-reduced-motion: reduce) {
  .hero-animated, .formula-decorative {
    animation: none !important;
    transition: none !important;
  }
}
```

### 15. Fórmulas decorativas actuales

Seis fórmulas decorativas renderizadas en el landing, cada una con estilo y animación propios:

| Fórmula | Representación LaTeX | Estilo visual |
|:--------|:---------------------|:--------------|
| **Sumatoria** | `\sum_{k=1}^{n} k = \frac{n(n+1)}{2}` | Azul, hover scale |
| **Matriz** | `\begin{pmatrix} a & b \\ c & d \end{pmatrix}` | Verde, fade-in |
| **Integral** | `\int_{a}^{b} f(x) \, dx` | Naranja, float suave |
| **Identidad de Euler** | `e^{i\pi} + 1 = 0` | Púrpura, glow sutil |
| **Límite trigonométrico** | `\lim_{x \to 0} \frac{\sin x}{x} = 1` | Rojo, translateY |
| **Función por partes** | `f(x) = \begin{cases} x^2 & x \geq 0 \\ -x & x < 0 \end{cases}` | Cyan, aparecer progresivo |
| **Raíz** | `\sqrt[n]{a + \sqrt{b}} = \sqrt{a + b} + 1` | Rosa, rotación ligera |
| **Fracción** | `\frac{a}{b} + \frac{c}{d} = \frac{ad + bc}{bd}` | Amarillo, desplazamiento |

### 16. Decisiones visuales aprobadas

| Decisión | Valor |
|:---------|:------|
| Base cromática | Blanco (`#ffffff`) / negro (`#0a0a0a`) |
| Modo oscuro | Cercano al negro real (no gris azulado) |
| Colores por contexto | Azul (enlaces/acciones), verde (éxito), rojo (error), amarillo (advertencia), púrpura/cyan/naranja/rosa (decoración) |
| Background decorativo | Monocromático (gris muy claro / gris muy oscuro) |
| Foreground matemático | Con colores (cada fórmula con su tono) |
| Color global dominante | **Ninguno** — no hay un color corporativo único |
| Franja arcoíris | **Descartada explícitamente** |
| Prioridad de dispositivo | Escritorio primero; móvil adaptativo sin romper |

### 17. Estado de `/aprender`

**Página índice** (`src/pages/aprender/index.astro`):

- Entrada "Inicio" clara con título, descripción y decoración visual mínima
- Pantalla compacta de inicio: presenta el curso como un todo, sin secciones individuales
- Botón prominente hacia la primera lección (`/aprender/seccion-01`)
- Enlace secundario al laboratorio (`/laboratorio`)
- Sin tarjetas duplicadas de secciones en el índice (las secciones se navegan desde la sidebar)

**Páginas de sección** (`src/pages/aprender/[...slug].astro`):

- Usan `CourseLayout` con sidebar y contenido
- Muestran la lección correspondiente con título, contenido Markdown, ejercicios y ejemplos
- Cada una incluye el `SafeLatexWorkspace` para los ejercicios que lo requieren

### 18. Validaciones finales

| Comprobación | Resultado |
|:-------------|:----------|
| `npm run test` | **8 archivos, 176 tests aprobados** |
| `npm run check` | **0 errores, 0 warnings, 0 hints** (39 archivos analizados) |
| `npm run build` | **20 páginas generadas** en 2.61 s |
| `git status --short` | Árbol limpio |
| `git diff --stat` | 64 archivos modificados |
| `git diff --check` | Sin conflictos de Whitespace |

### 19. Estado Git

| Aspecto | Valor |
|:--------|:------|
| Rama activa | `feature/phase-1B` |
| Cambios | 64 archivos modificados, todos en el alcance de 1B |
| Commit | Los cambios están commiteados en la rama |
| Push | Los cambios han sido enviados al remoto |
| Pull Request | **No creado todavía** — la subfase 1B no está cerrada |

### 20. Pendientes inmediatos

Para cerrar la subfase 1B falta:

- [ ] **Modelo sección → lecciones → páginas**: conectar la navegación real entre secciones, lecciones y páginas
- [ ] **Secciones desplegables**: la sidebar debe poder expandir/colapsar secciones para mostrar sus lecciones
- [ ] **Botones Anterior y Continuar**: navegación secuencial entre lecciones/páginas
- [ ] **Indicador "Página X de Y"**: mostrar el progreso dentro de una lección
- [ ] **Conectar botón Comprobar**: el botón de validación en los ejercicios debe ejecutar `validateExercise` y mostrar resultados
- [ ] **Mensajes pedagógicos**: retroalimentación visual tras validar (acierto/error/pista)
- [ ] **Progreso local con Dexie**: persistencia del progreso del alumno en IndexedDB
- [ ] **Desbloqueos**: marcar secciones/lecciones como completadas y desbloquear las siguientes
- [ ] **Completar contenido de las secciones 1 y 2**: lecciones, ejemplos y ejercicios reales
- [ ] **Cerrar la subfase 1B**: merge a `main` con PR, actualizar documentación

### 21. Próximo paso recomendado

**Implementar la arquitectura de navegación sección → lección → páginas**, incluyendo secciones desplegables en la sidebar, botones Anterior/Continuar, indicador de página, y conectar el botón Comprobar con el validador. El progreso real con Dexie y los desbloqueos pueden esperar a una iteración posterior dentro de 1B.

---

## Nota archivada: auditoría pública de Fase 1E — 2026-08-14

El estado vigente continúa en `TEXDOCK_Progress_Log.md`. Durante la estabilización de 1E se corrigieron los metadatos SEO públicos, canonical bajo `/TexDock/`, Open Graph, Twitter Cards, `robots.txt`, `sitemap.xml`, landmarks, skip link, tokens CSS y tablas accesibles del preview. Biblioteca y Acerca de siguen retiradas de la superficie pública.

Validación registrada: `npm run validate`, `npm run test`, `npm run build`, `npm run test:production` y `git diff --check` correctos; 236/236 soluciones canónicas aprobadas; 945 tests en 40 archivos; 2 tests browser ejecutados en navegador real. El chunk diferido de MathJax conserva el warning conocido de tamaño y queda documentado para una fase posterior. La Fase 1E permanece en proceso y no se ha realizado commit ni push.
