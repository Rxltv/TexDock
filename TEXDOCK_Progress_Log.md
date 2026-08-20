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
- Fase 2: Editor en desarrollo por fases.
- Fase 2A — Viabilidad y benchmark del compilador: aprobada y cerrada.
- Fase 2B — Núcleo mínimo de compilación: aprobada y cerrada.

### Roadmap vigente

```text
Fase 1 — Plataforma educativa básica
  CERRADA

Fase 2 — Editor
  EN CURSO

  2A — Viabilidad y benchmark       CERRADA
  2B — Núcleo mínimo de compilación CERRADA
  2C — Editor monofichero PRÓXIMA
  2D — PDF y logs
  2E — Responsive y móvil
  2F — Filesystem temporal
  2G — Proyectos multifichero
  2H — Imágenes y assets
  2I — Bibliografía
  2J — Exportación
  2K — Compatibilidad y rendimiento
  2L — Estabilización y publicación

Fase 3 — Biblioteca ampliada
  PENDIENTE

Fase 4 — Renderizado LaTeX avanzado
  PENDIENTE

Fase 5 — Rutas especializadas
  PENDIENTE
```

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
- Fase 2A cerrada; Fase 2B cerrada.
- Fase 2C — Editor monofichero: próxima fase autorizada.
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

La Fase 2A queda cerrada documentalmente. En ese momento, la Fase 2B permanecía sin iniciar y requería autorización para comenzar.

---

## Cierre: 2026-08-19 — Fase 2A: viabilidad y benchmark del compilador

### Objetivo

Determinar la viabilidad de un compilador LaTeX real en navegador, ejecutado en Web Worker y compatible con hosting estático, antes de implementar el Editor.

### Investigación realizada

Se consolidaron el benchmark inicial, la optimización de BusyTeX y el benchmark móvil real. Se evaluaron pdfLaTeX, PDF válido, paquetes académicos, Babel español, errores, logs, multifichero, imágenes, Biber, offline, GitHub Pages y compatibilidad de navegadores.

### Motores evaluados

- BusyTeX `1.4.0`, seleccionado.
- SwiftLaTeX, descartado por depender de un formato TeX Live y endpoint no reproducibles en la prueba.

### Motor y arquitectura seleccionados

- BusyTeX con TeX Live 2026 y pdfLaTeX real.
- Ejecución en Web Worker.
- `core + texlive-basic` precargado.
- Paquetes TeX Live selectivos mediante `https://texlive2026.texlyre.org/`.
- Biber WASM bajo demanda.
- Validación propia de PDF, firma, log, errores fatales y diagnósticos.
- Sin persistencia de proyecto; compatible con hosting estático/GitHub Pages, sujeto a CORS y disponibilidad del endpoint.

Payload inicial medido: `127,658,408` bytes (`121.75 MiB`).

### Resultados desktop

- Chromium: Minimal `582 ms`, Math `753 ms`, Academic `4.080 s`, Stress `1.235 s` de mediana.
- Firefox: funcional, pero más lento: Minimal `2.109 s`, Math `2.641 s`, Academic `19.158 s`, Stress `4.914 s`.
- Navegador prioritario: Chromium; Firefox queda soportado funcionalmente.

### Resultados móvil

Chrome Android real produjo `32/32` PDFs válidos en las ejecuciones normales. Inicialización observada: aproximadamente `4.77 s`. Medianas warm: Minimal `0.463 s`, Math `0.600 s`, Academic `3.23 s`, Stress `0.91 s`.

No hubo crashes, recargas, congelamientos notorios ni calentamiento apreciable; la página permaneció responsive. El modelo y la RAM del teléfono no fueron identificados.

### Decisiones técnicas

- `\usepackage[spanish]{babel}` funciona mediante carga selectiva de `spanish.ldf`; Babel español deja de ser un problema abierto de 2A.
- La futura capa del Editor no confiará únicamente en `success` y `exitCode`; exigirá PDF válido, firma `%PDF-`, log y diagnósticos.
- `biblatex + Biber` es funcional, con Biber WASM bajo demanda, aproximadamente `30.32 MiB` y mediana desktop optimizada de `~7.37 s`.
- Los guardrails provisionales de proyecto, archivo, imagen, PDF, aviso y timeout se conservan sin implementación. El total de imágenes y la cantidad máxima de archivos quedan pendientes.
- El PDF se genera correctamente, pero el prototipo móvil mostró una tarjeta con botón `Abrir` en lugar de un visor inline adecuado. Es un pendiente de Fase 2D, no un bloqueo de BusyTeX ni de 2A.

### Riesgos conocidos

- Payload inicial de aproximadamente `121.75 MiB`.
- Dependencia de endpoint remoto, CORS y disponibilidad.
- Memoria WASM no aislada con precisión.
- Firefox considerablemente más lento.
- Visor PDF inline móvil pendiente.
- Límites de archivos/imágenes y auditoría de licencias pendientes.

Estos riesgos no bloquean el cierre de Fase 2A.

### Estado

**Fase 2A — APROBADA Y CERRADA.**

### Próximo paso

**En ese cierre documental, la Fase 2B — Núcleo mínimo de compilación no se había iniciado.** No se implementó en el cierre de 2A.

---

## Cierre: 2026-08-20 — Fase 2B: núcleo mínimo de compilación

### Fecha

20 de agosto de 2026.

### Fase

Fase 2B — Núcleo mínimo de compilación.

**Estado: CERRADA.**

### Integración

- PR: `#14 — feat: add editor phase 2b compiler core`.
- Merge/squash commit: `929b0ac`.

### Implementación

- Ruta técnica `/editor/`.
- Componente `EditorCompilerCore`.
- Clase `BusyTeXCompiler`.
- Política de clasificación independiente del resultado.
- BusyTeX `1.4.0` exacto.
- pdfLaTeX real en Web Worker.
- Inicialización mediante `initialize(true)`.
- `core + texlive-basic`.
- Endpoint remoto: `https://texlive2026.texlyre.org/`.
- `shellEscape: false`.
- Compilación manual, sin auto compile.
- Documento inicial `main.tex`.
- Enlace `Abrir PDF` mediante Blob URL.
- Limpieza correcta del Blob URL anterior en errores, recompilaciones y desmontaje.
- Estado `engineReady` separado del estado de compilación.
- Sin persistencia del source ni del proyecto.

La clasificación propia exige conjuntamente:

- `wrapper success`.
- `exitCode === 0`.
- Existencia y tamaño positivo del PDF.
- Firma `%PDF-`.
- Ausencia de errores fatales conocidos en el log.

Esto permite detectar falsos éxitos de BusyTeX aunque el wrapper informe éxito y código de salida cero.

### Assets

- Payload aproximado: `122 MiB`.
- `texlive-basic.data`: `92,785,062` bytes.
- `public/engine/busytex/` se genera localmente y está ignorado por Git.
- Preparación mediante `scripts/prepare-busytex-assets.mjs`.
- Release exacta `assets-v1.4.0`.
- Checksum SHA-256 fijado y verificado.
- No hay blobs grandes en el historial Git.

### Seguridad

Después de corregir las dependencias transitivas patch:

```text
npm audit: 0 vulnerabilities
npm audit --omit=dev: 0 vulnerabilities
```

BusyTeX permanece exactamente en:

```text
texlyre-busytex@1.4.0
```

### Validación

- Astro Check: `0 errors / 0 warnings / 0 hints`.
- Vitest: `41 suites`.
- Tests: `957 passed`.
- Build estático: `406` páginas.
- `verify-production`: correcto.
- `/TexDock/editor/`: correcto.
- Assets BusyTeX: HTTP `200`.
- Smoke de PDF válido: correcto.
- Error `\fracc`: correctamente rechazado.
- Secuencia válido → error → válido: correcta.
- Desktop: correcto.
- Viewport móvil: correcto.
- Navegación global: correcta después de reiniciar una instancia obsoleta de Astro/Vite.

### Rendimiento observado durante integración

Estas cifras son observaciones de integración, no un benchmark contractual:

- Inicialización aproximada: desarrollo `~3.9 s`; producción `~9.1 s` en una ejecución.
- Primera compilación típica observada: `~2.3–2.8 s`.
- Compilación warm observada: `~1.0–1.3 s`.

El benchmark formal continúa siendo el informe de 2A: [`docs/reports/TEXDOCK_EDITOR_PHASE_2A_FINAL_REPORT.md`](docs/reports/TEXDOCK_EDITOR_PHASE_2A_FINAL_REPORT.md).

### Riesgos pendientes

- Payload del engine de aproximadamente `122 MiB`.
- Dependencia del endpoint remoto para paquetes no precargados.
- Memoria WASM no medida con precisión.
- Visor PDF móvil definitivo pendiente de 2D.
- Hardening futuro del script de assets: validación adicional de extracción tar, checksum de assets locales ya existentes y timeout/reintentos de descarga.
- Revisión de obligaciones y licencias de distribución pendiente como tarea de estabilización antes de la publicación definitiva.

Estos riesgos no son bloqueadores de la Fase 2B.

### Próxima fase

**2C — Editor monofichero.**

Alcance previsto:

- Sustituir el textarea por una experiencia de edición basada en CodeMirror 6.
- Mantener únicamente `main.tex`.
- Usar un nombre temporal de proyecto si corresponde al diseño aprobado.
- Mantener el botón `Compilar` manual.
- Añadir advertencia de pérdida al cerrar o recargar.
- Preservar el compilador real construido en 2B.

La Fase 2C no se implementa en este cierre documental.
