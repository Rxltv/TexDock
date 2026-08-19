# TexDock Progress Log

## Fecha

19 de agosto de 2026

## Fase Global

Fase 1 — COMPLETAMENTE CERRADA.

## Estado De Fases

- Fase 1A: cerrada.
- Fase 1B: cerrada definitivamente.
- Fase 1C: cerrada.
- Fase 1D: cerrada e integrada en `main`.
- Fase 1E: cerrada y aprobada.
- Fase 2: no iniciada.

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
- Tests: 952 aprobados en 40 archivos.
- Tests browser: 3 aprobados en navegador real; ninguno omitido en la validación local.
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

- Rama de cierre: `fix/phase-1e-final-public-polish`.
- Fases 1A, 1B, 1C, 1D y 1E cerradas.
- Fase 1 completamente cerrada.
- Fase 2 no iniciada.
- Aprender es el área pública principal.
- Progreso local mediante `localStorage` nativo y desbloqueo por predecesor inmediato.
- La aprobación se registra únicamente al pulsar `Comprobar respuesta` y obtener `valid: true`.
- La barra lateral conserva visibles los contenidos no disponibles, sin enlaces ni controles operables.
- Fórmulas conserva copia LaTeX y exportación SVG/PNG con overflow interno.
- La navegación pública queda limitada a Inicio, Aprender, Fórmulas y GitHub.
- La versión de Fase 1 está integrada en `main` y desplegada en GitHub Pages.

## Alcance Aprobado De La Fase 1D

Este apartado conserva el alcance histórico cerrado de 1D. La estabilización de 1E reemplaza su superficie pública de Biblioteca y Acerca de y convierte los desbloqueos informativos en navegación no operable mientras el contenido no esté disponible.

- Progreso local mediante `localStorage` nativo; no se guarda código incompleto.
- La aprobación solo se registra al pulsar `Comprobar respuesta` y obtener `valid: true`.
- Las lecciones sin ejercicios obligatorios se completan al visitar su última página.
- La Sección 1 sigue la misma regla y no recibe un integrador artificial.
- La barra lateral permanece clicable; el progreso es informativo y orientativo.
- Biblioteca pública con plantillas de tarea académica y apuntes de clase, copiables y sin descargas públicas.
- Se conserva `/acerca/` y el repositorio canónico es `https://github.com/Rxltv/TexDock`.

## Cierre Formal De La Fase 1

- El build mantiene el warning conocido de chunks superiores a 500 kB.
- La comprobación HTTPS posterior al despliegue fue satisfactoria.
- La revisión visual de producción confirmó portada, curso, laboratorio, rutas profundas, tema claro, tema oscuro y responsive.
- `robots.txt` y `sitemap.xml` funcionan correctamente bajo `/TexDock/`.
- `/biblioteca/` y `/acerca/` permanecen fuera de la superficie pública y responden `404` intencionalmente.
- Biblioteca y plantillas quedan aplazadas para una fase futura; Acerca de permanece retirada.

También se verificaron satisfactoriamente el progreso local, la reanudación del curso, los desbloqueos pedagógicos, el sistema de ejercicios, GitHub Actions y GitHub Pages.

La Fase 1 queda formalmente cerrada.

TexDock dispone ahora de una versión pública, estática y estable del curso básico, sin cuentas ni backend.

La Fase 2 no ha comenzado y deberá definirse antes de implementar nuevas funcionalidades.
