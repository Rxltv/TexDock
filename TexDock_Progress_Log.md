# TexDock — Registro de progreso

## Sesión: 2026-07-20

| Campo                 | Valor                                        |
| :-------------------- | :------------------------------------------- |
| Fase actual           | Fase 0.2B — Pulido educativo del prototipo   |
| Rama                  | `feature/phase-0-polish`                     |
| Objetivo de sesión    | Añadir panel de preámbulo, selector de ejemplos y pruebas |
| Estado inicial        | Árbol limpio, laboratorio funcional, Vitest configurado |
| Stack actual          | Node.js 22+, Astro 7, React 19, KaTeX 0.18, Vitest, HTML, CSS |

### Archivos creados

- `src/components/playground/PreamblePanel.astro` — panel plegable informativo del preámbulo
- `src/lib/latex/mathExamples.ts` — lista tipada de ejemplos matemáticos
- `src/lib/latex/mathExamples.test.ts` — pruebas unitarias para los ejemplos

### Archivos modificados

- `src/components/playground/MathPlayground.tsx` — añadido selector de ejemplos con botones
- `src/pages/laboratorio.astro` — integrado PreamblePanel y estilos del selector
- `TexDock_Progress_Log.md` — registro de esta sesión

### Panel del preámbulo

- Elemento `<details>` con `Preámbulo utilizado`
- Muestra `\documentclass{article}`, `\usepackage{amsmath}`, `\usepackage{amssymb}`
- Explica brevemente cada línea
- Aclara que el laboratorio usa KaTeX, no un compilador LaTeX
- Sin JavaScript, accesible por teclado

### Ejemplos añadidos

| ID            | Label               | Expresión principal                              |
| :------------ | :------------------ | :----------------------------------------------- |
| `fraction`    | Fracción            | `\frac{a}{b}`                                    |
| `limit`       | Límite              | `\lim_{x \to 0} \frac{\sin x}{x} = 1`            |
| `integral`    | Integral            | `\int_0^1 x^2\,dx = \frac{1}{3}`                |
| `summation`   | Sumatoria           | `\sum_{k=1}^{n} k = \frac{n(n+1)}{2}`            |
| `matrix`      | Matriz              | Matriz 2×2 con `pmatrix`                         |
| `determinant` | Determinante        | Determinante 2×2                                 |
| `cases`       | Sistema con cases   | Función definida a trozos                        |

### Funcionamiento del selector

- Botones reales con `aria-pressed` para el seleccionado
- Al hacer clic: reemplaza el textarea, renderiza inmediatamente
- Los botones tienen `aria-label` con descripción
- Se anuncia mediante la región `aria-live` existente
- Compatible con debounce, Ctrl + Enter y botón Renderizar

### Pruebas añadidas

- La lista no está vacía
- Los IDs son únicos
- Todos los ejemplos tienen `label`, `description` y `latex`
- No existen valores vacíos
- Cada expresión se renderiza con `katex.renderToString()` sin errores

### Comprobaciones

- [ ] `npm run test` completado sin errores
- [ ] `npm run build` completado sin errores
- [ ] `git status --short` verificado
- [ ] `git diff --stat` verificado
- [ ] `git diff --check` sin conflictos de Whitespace

### Limitaciones actuales

- No hay ejercicios estructurados ni validación programática
- No hay resaltado de sintaxis en el textarea
- El panel de preámbulo es informativo y no editable
- No hay persistencia de la expresión entre sesiones
- No hay soporte para TikZ, PGFPlots ni generación de PDF

### Siguiente paso

Avanzar a la siguiente fase del plan de desarrollo del proyecto.
