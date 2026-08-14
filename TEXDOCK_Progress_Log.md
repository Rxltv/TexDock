# TexDock Progress Log

## Fecha

14 de agosto de 2026

## Fase Global

Fase 1 — Plataforma pública básica sin cuentas.

## Estado De Fases

- Fase 1A: cerrada.
- Fase 1B: cerrada definitivamente.
- Fase 1C: cerrada.
- Fase 1D: cerrada e integrada en `main`.
- Fase 1E: en proceso en `fix/phase-1e-final-public-polish`; no cerrada.

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
- Tests: 945 aprobados en 40 archivos.
- Tests browser: 2 aprobados en navegador real; ninguno omitido en la validación local.
- Astro Check: 0 errores, 0 warnings y 0 hints.
- Build estático: 405 páginas generadas tras retirar dos rutas.
- `git diff --check`: correcto, sin errores.
- Rutas requeridas: `/TexDock/`, `/TexDock/aprender/` y `/TexDock/laboratorio/` con HTTP 200.
- Rutas retiradas: `/TexDock/biblioteca/` y `/TexDock/acerca/` con HTTP 404.
- `robots.txt` y `sitemap.xml`: HTTP 200, bajo `/TexDock/`, sin localhost ni rutas retiradas.

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

- Rama: `fix/phase-1e-final-public-polish`.
- Fases 1C y 1D cerradas.
- Fase 1E en proceso; no se declara cerrada.
- Aprender es el área pública principal.
- Progreso local mediante `localStorage` nativo y desbloqueo por predecesor inmediato.
- La aprobación se registra únicamente al pulsar `Comprobar respuesta` y obtener `valid: true`.
- La barra lateral conserva visibles los contenidos no disponibles, sin enlaces ni controles operables.
- Fórmulas conserva copia LaTeX y exportación SVG/PNG con overflow interno.
- La navegación pública queda limitada a Inicio, Aprender, Fórmulas y GitHub.
- No se ha realizado commit ni push de la Fase 1E.

## Alcance Aprobado De La Fase 1D

Este apartado conserva el alcance histórico cerrado de 1D. La estabilización de 1E reemplaza su superficie pública de Biblioteca y Acerca de y convierte los desbloqueos informativos en navegación no operable mientras el contenido no esté disponible.

- Progreso local mediante `localStorage` nativo; no se guarda código incompleto.
- La aprobación solo se registra al pulsar `Comprobar respuesta` y obtener `valid: true`.
- Las lecciones sin ejercicios obligatorios se completan al visitar su última página.
- La Sección 1 sigue la misma regla y no recibe un integrador artificial.
- La barra lateral permanece clicable; el progreso es informativo y orientativo.
- Biblioteca pública con plantillas de tarea académica y apuntes de clase, copiables y sin descargas públicas.
- Se conserva `/acerca/` y el repositorio canónico es `https://github.com/Rxltv/TexDock`.

## Problemas Pendientes

- El build mantiene el warning conocido de chunks superiores a 500 kB.
- La auditoría browser local cubre 320 px, reflow equivalente, teclado, claro/oscuro, fórmulas largas y simetría editor/preview; falta la comprobación posterior al despliegue HTTPS.
- Falta verificar el despliegue HTTPS del commit candidato.
- Biblioteca y plantillas quedan aplazadas para una fase futura.
- Acerca de queda retirada de la versión pública actual.

## Próximos Pasos

1. Ejecutar la auditoría final sobre el despliegue HTTPS.
2. Verificar las rutas desplegadas bajo `/TexDock/`.
3. Cerrar 1E únicamente después de documentar todos los resultados y aprobar la auditoría final.

La Fase 1D está cerrada y validada. La Fase 1E está en proceso y no ha sido cerrada.
