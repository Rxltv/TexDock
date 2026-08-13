# TexDock Progress Log

## Fecha

13 de agosto de 2026

## Fase Global

Fase 1 — Plataforma pública básica sin cuentas.

## Estado De Fases

- Fase 1A: cerrada.
- Fase 1B: cerrada definitivamente.
- Fase 1C: cerrada.
- Fase 1D: no iniciada.

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
- Tests: 911 aprobados.
- Astro Check: 0 errores, 0 warnings y 0 hints.
- Build estático: 407 páginas generadas.
- `git diff --check`: correcto, sin errores.

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

- Rama: `fix/phase-1c-validation`.
- Cambios sin commit.
- No se ha realizado push.
- El árbol conserva todos los cambios existentes.
- Los cambios están limitados a contenido, validación segura, pruebas y registro de la Fase 1C.

## Problemas Pendientes

- El build mantiene el warning conocido de chunks superiores a 500 kB.
- La optimización de chunks queda fuera de esta fase y corresponde a la Fase 1E.
- No hay bloqueantes pendientes dentro del alcance de la Fase 1C.

## Próximos Pasos

1. Revisión final de los cambios.
2. Commit de la Fase 1C.
3. Pull Request de `fix/phase-1c-validation`.
4. Después de la revisión correspondiente, planificar la Fase 1D.

La Fase 1D no está iniciada.
