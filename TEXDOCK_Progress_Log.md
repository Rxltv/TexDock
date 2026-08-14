# TexDock Progress Log

## Fecha

13 de agosto de 2026

## Fase Global

Fase 1 — Plataforma pública básica sin cuentas.

## Estado De Fases

- Fase 1A: cerrada.
- Fase 1B: cerrada definitivamente.
- Fase 1C: cerrada.
- Fase 1D: cerrada en `feature/phase-1d-public-experience`.
- Fase 1E: pendiente; no iniciada.

## Cierre De La Fase 1C

Se completó la validación editorial y estructural de los ejercicios publicados.

Correcciones realizadas:

- Detección de comandos desconocidos en texto, abstract, tablas, figuras, subfiguras, notas y bibliografía.
- Rechazo de entornos desconocidos y nombres mal escritos, conservando los entornos soportados.
- Validación de clases, preámbulo, cuerpo y texto visible en `03-05-02`.
- Modo `VISIBLE_PROSE` limitado a `03-05-02`, sin cambiar el comportamiento histórico de `REQUIRE_TEXT`.
- Rechazo de spans de tabla cero, negativos, fuera de rango, solapados o truncados.
- Rechazo de columnas sobrantes o faltantes, paquetes ausentes y entornos de tabla mal cerrados.
- Propagación de diagnósticos estructurales hasta `REQUIRE_TABLE_STRUCTURE`.
- Asociación correcta de imágenes, captions y labels en subfiguras.
- Validación contextual de referencias textuales y bibliografía significativa, distinta, citada y resuelta.
- Corrección de la consigna de `15-06-04` para declarar todos sus requisitos.
- Cobertura automática de todas las soluciones canónicas publicadas.

## Convención Matemática Oficial

- `$...$` para matemáticas inline dentro de una oración.
- `\[...\]` para matemáticas display o independientes.
- `\(...\)` únicamente como compatibilidad interna del parser.
- `$$...$$` únicamente como compatibilidad interna del parser.
- El contenido canónico educativo no recomienda ni usa `\(...\)` o `$$...$$`.

## Cobertura Y Validación

- Soluciones canónicas: 236/236 aprobadas.
- Tests: 930 aprobados en 41 archivos.
- Astro Check: 0 errores, 0 warnings y 0 hints.
- Build estático: 407 páginas generadas.
- `git diff --check`: correcto, sin errores.
- Rutas públicas bajo `/TexDock/`, `/TexDock/aprender/` y `/TexDock/biblioteca/`: HTTP 200.

## Archivos Relevantes

Archivos modificados relevantes:

- `src/lib/exercises/validateExercise.ts`
- `src/lib/latex/safeLatexPreview.ts`
- `src/lib/latex/safeTablePreview.ts`
- `src/lib/latex/safeMathPreview.ts`
- `src/lib/latex/safeFigurePreview.ts`
- `src/lib/latex/safeReferencePreview.ts`
- Ejercicios de las secciones 3, 4, 5, 10, 13 y 15 afectados por la auditoría.
- Tests de validación de ejercicios, tablas, matemáticas, contenido y regresiones históricas.

Archivos nuevos relevantes:

- `src/tests/phase1cValidation.test.ts`
- `src/tests/publishedCanonicalValidation.test.ts`
- `TEXDOCK_Progress_Log.md`

## Estado Actual

- Rama: `feature/phase-1d-public-experience`.
- Fase 1D cerrada y lista para integrar.
- No se ha realizado push.
- Progreso local mediante `localStorage` nativo.
- La aprobación se registra al pulsar `Comprobar respuesta` y obtener `valid: true`.
- Biblioteca pública con plantillas copiables mediante la acción `Copiar`.
- Navegación pública y página `/acerca/` disponibles.
- La Fase 1C permanece cerrada.
- La Fase 1E permanece pendiente y no está iniciada.

## Alcance Aprobado De La Fase 1D

- Progreso local mediante `localStorage` nativo; no se guarda código incompleto.
- La aprobación solo se registra al pulsar `Comprobar respuesta` y obtener `valid: true`.
- Las lecciones sin ejercicios obligatorios se completan al visitar su última página.
- La Sección 1 sigue la misma regla y no recibe un integrador artificial.
- La barra lateral permanece clicable; el progreso es informativo y orientativo.
- Biblioteca pública con plantillas de tarea académica y apuntes de clase, copiables y sin descargas públicas.
- Se conserva `/acerca/` y el repositorio canónico es `https://github.com/Rxltv/TexDock`.

## Problemas Pendientes

- El build mantiene el warning conocido de chunks superiores a 500 kB.
- La optimización de chunks queda fuera de esta fase y corresponde a la Fase 1E.

## Próximos Pasos

1. Integrar la Fase 1D mediante la revisión correspondiente.
2. Planificar la Fase 1E sin iniciarla anticipadamente.

La Fase 1D está cerrada y validada. La Fase 1E permanece pendiente y no ha sido iniciada.
