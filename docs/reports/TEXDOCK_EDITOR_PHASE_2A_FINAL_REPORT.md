# TexDock Fase 2A: informe final consolidado

## 1. Fecha y objetivo

Fecha de cierre: 19 de agosto de 2026.

El objetivo fue determinar si un compilador LaTeX real puede ejecutarse en navegador, en Worker y con hosting estático, produciendo PDF fiable para el futuro Editor de TexDock. Se consolidan las rondas 2A, 2A.2 y el benchmark móvil real 2A.3. No se implementó el Editor ni se inició Fase 2B.

## 2. Contexto

Todo el trabajo se realizó en `/tmp/texdock-editor-benchmark`. El repositorio `~/Proyectos/TexDock` no recibió cambios, dependencias, ramas, commits ni integración de producto.

La evidencia histórica se conserva en:

- `results/TEXDOCK_EDITOR_PHASE_2A_REPORT.md`
- `results/TEXDOCK_EDITOR_PHASE_2A2_REPORT.md`
- `results/phase-2a2/summary.json`
- `results/phase-2a2/mobile.json`

## 3. Candidatos evaluados

### BusyTeX

BusyTeX `1.4.0`, TeX Live 2026 y pdfTeX `3.141592653-2.6-1.40.29`. Produce PDF real, logs, multifichero, imágenes, rerun y Biber WASM dentro del navegador.

### SwiftLaTeX

El runtime es pequeño, pero la release probada necesita un formato TeX Live externo y un endpoint operativo. No produjo de forma reproducible el PDF mínimo `article` en el escenario evaluado. No se selecciona.

## 4. Motor seleccionado

**BusyTeX es el motor recomendado.** La evidencia cubre pdfLaTeX real, PDF válido, paquetes académicos, Babel español, Worker, errores, multifichero, imágenes, Biber, offline con recursos ya cargados, Chromium desktop, Firefox desktop y Chrome Android real.

## 5. Arquitectura seleccionada

```text
BusyTeX pdfLaTeX en Worker
core + texlive-basic precargado
TEXLIVE_REMOTE_ENDPOINT para paquetes selectivos
Biber WASM bajo demanda
validación propia de PDF, log y diagnóstico
```

No se recomienda precargar `recommended` ni `extra` completos para el primer Editor.

## 6. Payload

| Componente | Tamaño |
| --- | ---: |
| Core + `texlive-basic` | 127,658,408 bytes, 121.75 MiB |
| Recursos académicos remotos observados | 710,469 bytes, aproximadamente 0.68 MiB |
| Core + basic + recursos académicos | aproximadamente 122.43 MiB |
| Biber bajo demanda | 31,793,487 bytes, 30.32 MiB |

El payload inicial es grande, pero el teléfono probado inicializó el motor en `4,768.5 ms` y completó los fixtures sin crash. Se clasifica como un tradeoff aceptable para viabilidad técnica, no como una experiencia óptima de descarga.

## 7. Paquetes

Precargados en `basic`: `amsmath`, `amssymb`, `geometry`, Babel base, `amsthm`, `graphicx` y `hyperref`.

Remotos selectivos: `mathtools`, `mhsetup`, `booktabs`, fuentes T1 y `spanish.ldf`.

`biblatex` se carga bajo demanda junto con Biber.

## 8. Babel español

```latex
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[spanish]{babel}
```

Funciona en Chromium, Firefox y Academic móvil. La causa original era la ausencia de `tex/generic/babel-spanish/spanish.ldf` en las colecciones locales. La solución validada es obtenerlo desde `https://texlive2026.texlyre.org/`.

## 9. Chromium desktop

Brave Chromium 151, ejecución headless:

| Fixture | n | Mediana |
| --- | ---: | ---: |
| Minimal | 5 | 582 ms |
| Math | 5 | 753 ms |
| Academic | 5 | 4.080 s |
| Stress | 3 | 1.235 s |

Todos los fixtures normales produjeron PDF válido. Error deliberado: `0/5` PDF válidos y clasificado correctamente por la política propia.

## 10. Firefox desktop

Firefox Playwright fallback 153.0, funcional y más lento:

| Fixture | n | Mediana |
| --- | ---: | ---: |
| Minimal | 5 | 2.109 s |
| Math | 5 | 2.641 s |
| Academic | 5 | 19.158 s |
| Stress | 3 | 4.914 s |

Firefox no presenta bloqueo funcional ni arquitectónico. Chromium queda como objetivo prioritario de rendimiento; Firefox queda soportado funcionalmente.

## 11. Benchmark móvil

Archivo correcto utilizado:

```text
/home/gateux/Descargas/texdock-mobile-1787174916057.json
```

Copia de trabajo:

```text
/tmp/texdock-editor-benchmark/results/phase-2a2/mobile.json
```

Dispositivo no identificado por modelo. User agent exacto:

```text
Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36
```

`hardwareConcurrency`: 8. `deviceMemory`: no disponible. No se inventan modelo ni RAM.

Inicialización observada:

| Métrica | Valor |
| --- | ---: |
| `engineReadyMs` | 4,768.5 ms |
| `pageToReadyMs` | 4,776.8 ms |
| Modo declarado | `not_marked` |

No se etiquetan estas cifras como cold o warm. Una sesión anterior de aproximadamente 14.6 s se conserva solo como contexto y no se mezcla: probablemente representaba otro estado de caché.

## 12. Resultados Minimal

10 ejecuciones, 10 PDFs válidos.

| Lectura | Mínimo | Mediana | Media | Máximo | Desv. estándar |
| --- | ---: | ---: | ---: | ---: | ---: |
| Todas | 381.3 ms | 463.7 ms | 621.1 ms | 2.053 s | 478.9 ms |
| Posteriores a la primera, n=9 | 381.3 ms | 463.2 ms | 462.0 ms | 549.3 ms | 40.4 ms |

La primera ejecución fue `2.053 s`. El flujo básico es **excelente después de inicializar** y **aceptable incluyendo la primera compilación**.

## 13. Resultados Math

10 ejecuciones, 10 PDFs válidos.

| Lectura | Mínimo | Mediana | Media | Máximo | Desv. estándar |
| --- | ---: | ---: | ---: | ---: | ---: |
| Todas | 575.2 ms | 600.3 ms | 886.3 ms | 3.510 s | 874.6 ms |
| Posteriores a la primera, n=9 | 575.2 ms | 600.0 ms | 594.8 ms | 614.9 ms | 12.9 ms |

La primera ejecución fue `3.510 s`; las posteriores fueron estables alrededor de `0.6 s`, consistente con carga/caché de paquetes.

## 14. Resultados Academic

6 ejecuciones, 6 PDFs válidos. El fixture incluye Babel español, `fontenc`, `inputenc`, `amsmath`, `amssymb`, `mathtools`, `geometry`, `amsthm`, `graphicx`, `booktabs`, `hyperref`, imagen y referencias.

| Lectura | Mínimo | Mediana | Media | Máximo | Desv. estándar |
| --- | ---: | ---: | ---: | ---: | ---: |
| Todas | 3.194 s | 3.229 s | 4.484 s | 10.793 s | 2.822 s |
| Posteriores a la primera, n=5 | 3.194 s | 3.228 s | 3.222 s | 3.231 s | 13.8 ms |

La primera ejecución fue `10.793 s`, compatible con carga remota de paquetes, fuentes y estado del Worker. Las cinco posteriores quedaron entre `3.194 s` y `3.231 s`. Academic móvil es **lento pero viable en primera carga y aceptable en warm**.

## 15. Resultados Stress

6 ejecuciones, 6 PDFs válidos. El documento representa estrés moderado de aproximadamente 20 páginas.

| Lectura | Mínimo | Mediana | Media | Máximo | Desv. estándar |
| --- | ---: | ---: | ---: | ---: | ---: |
| Todas | 872.1 ms | 910.6 ms | 1.115 s | 2.154 s | 464.9 ms |
| Posteriores a la primera, n=5 | 872.1 ms | 908.8 ms | 907.0 ms | 935.2 ms | 20.2 ms |

La primera ejecución fue `2.154 s`; el comportamiento warm fue estable y produjo PDF válido en todos los casos.

## 16. Estabilidad móvil

Clasificación global: **ACEPTABLE**, con compilaciones warm entre excelentes y aceptables y una primera carga razonable pero costosa por el payload.

Observaciones manuales:

- La página siguió respondiendo: **sí**.
- La pestaña se cerró o recargó: **no**.
- Congelamientos notorios: **no**.
- Temperatura: **normal**.

No hubo crash ni cierre de pestaña en las pruebas normales.

## 17. Worker y main thread

Las ejecuciones normales reportan `worker=true`. En los 32 casos normales, el gap mediano del timer fue `0.9 ms` y el máximo `8.9 ms`. La evidencia es consistente con que la compilación pesada se ejecuta en Worker y la página permanece utilizable.

Esto no es una garantía absoluta para el futuro Editor: CodeMirror, visor PDF, logs, proyectos grandes y presión de memoria todavía deben diseñarse y validarse en sus fases correspondientes.

## 18. PDF

**Generación PDF: funciona.** Los 32 casos normales móviles produjeron PDFs válidos con firma `%PDF-`.

El fixture Academic móvil demuestra generación con imagen, paquetes y Babel español. Multifichero e imágenes también se validaron previamente en desktop.

## 19. Limitación del visor inline móvil

El PDF se generó correctamente, pero la vista previa embebida no apareció como se esperaba dentro de la página. Android mostró una tarjeta/objeto PDF con un botón `Abrir`.

Esto no es un fallo de BusyTeX ni de pdfLaTeX. Es una limitación del método actual de visualización inline del prototipo móvil. Se registra como requisito futuro de visor PDF y logs, correspondiente a una fase posterior de producto; no invalida el motor ni la generación.

## 20. Logs

BusyTeX devuelve log combinado con comandos, salida, `EXITCODE`, TeX Live y mensajes del engine. La página móvil conservó el log por compilación. La política de producto debe validar PDF y log, no solo el estado del wrapper.

## 21. Política de errores

La clasificación experimental requiere:

```text
wrapper success
exitCode === 0
PDF existente y con firma válida
ausencia de firma fatal conocida
```

El wrapper por sí solo sigue siendo insuficiente: puede devolver `reportedSuccess=true`, `exitCode=0` y PDF vacío.

## 22. Archivo y línea

Las siete ejecuciones móviles deliberadamente erróneas fueron consistentes:

- `reportedSuccess=true`: 7/7.
- `exitCode=0`: 7/7.
- `pdfValid=false`: 7/7.
- `fatal=true`: 7/7.
- Diagnóstico `Undefined control sequence`, línea 5: 7/7.
- Mensaje de PDF no producido: 7/7.

La evidencia histórica cubre además errores de paquete, imagen, entorno y multifichero, incluyendo `chapters/broken.tex`, línea 2. La extracción archivo/línea es suficiente para una futura acción `Ir a línea`, con las limitaciones del log documentadas.

## 23. Multifichero

`additionalFiles`, carpetas, `\input`, `\include`, `.bib` y rutas anidadas funcionan en BusyTeX. Se validó con `multifile.tex` y `chapters/*` en desktop. El error incluido confirma también el diagnóstico dentro de un archivo secundario.

## 24. Imágenes

JPG y datos binarios mediante `Uint8Array` funcionan. Academic móvil generó PDF con imagen y el fixture de imagen fue válido en desktop. La visualización inline posterior no debe confundirse con la generación correcta del PDF.

## 25. Bibliografía y Biber

`biblatex` + Biber funcionan en desktop con carga selectiva:

- Biber WASM bajo demanda.
- Payload adicional: `31,793,487` bytes, `30.32 MiB`.
- Mediana optimizada desktop: aproximadamente `7.366 s`.
- PDF válido: `5/5`.

No se repitió Biber en móvil porque no era requisito crítico de esta ronda.

## 26. Offline

Offline funciona después de que BusyTeX, paquetes, fuentes y Biber requeridos hayan sido cargados en el mismo runtime. Se validaron previamente minimal, math, academic y bibliografía en esa condición. No se afirma offline para una primera sesión ni para recursos no cacheados.

## 27. GitHub Pages

La arquitectura es compatible con hosting estático equivalente a GitHub Pages:

- WASM, JS, Worker y `texlive-basic.data` estáticos.
- Rutas relativas compatibles con una ruta anidada.
- `.wasm` servido con MIME `application/wasm`.
- Sin backend necesario para generar PDF.
- Endpoint remoto requiere CORS, disponibilidad y exposición de `fileid`.

## 28. Privacidad

La compilación y el PDF ocurren localmente. No se observó envío del contenido de `main.tex` al endpoint. El endpoint recibe rutas de paquetes, fuentes y algunos nombres auxiliares generados. BusyTeX mantiene caché técnica de assets, separada del proyecto. La política de producción debe documentar esa dependencia remota.

## 29. Licencias

BusyTeX y sus modificaciones requieren revisar AGPL-3.0, junto con MIT del código original, licencias heterogéneas de TeX Live, Biber y dependencias. Deben conservarse notices, manifests y fuentes correspondientes antes de distribuir el motor. Este informe no constituye asesoramiento legal.

## 30. Límites preliminares

| Límite | Decisión | Motivo |
| --- | --- | --- |
| Proyecto total: 5 MiB | MANTENER | Guardrail conservador; no hubo prueba de fuente grande |
| Archivo individual: 1 MiB | MANTENER | Evita entradas anómalas y presión sobre UI/Worker |
| Imagen individual: 5 MiB | MANTENER | Imagen pequeña validada; margen operativo razonable |
| Imágenes totales: 20 MiB | PENDIENTE | No se estresó un conjunto grande de imágenes en móvil |
| Archivos: 100 | PENDIENTE | Multifichero funciona, pero no se estresó el volumen |
| PDF: 25 MiB | MANTENER | Guardrail operativo para Blob/visor; no limita el engine probado |
| Aviso de compilación: 15 s | MANTENER | Academic móvil inicial fue 10.8 s; Biber desktop inicial puede superar el aviso |
| Timeout experimental: 60 s | MANTENER | Protección de UI; ningún caso normal se acercó al límite |

Estos valores siguen siendo guardrails, no implementación ni contrato definitivo.

## 31. Riesgos restantes

1. El primer payload es aproximadamente 121.75 MiB y puede ser costoso en redes lentas.
2. Academic depende operacionalmente del endpoint remoto para paquetes, Babel y fuentes.
3. CORS, disponibilidad, cambios de TeX Live y caché remota pueden afectar la experiencia.
4. No existe una medición fiable de memoria WASM/RSS aislada del navegador.
5. Firefox es funcional, pero materialmente más lento que Chromium.
6. El visor PDF inline móvil requiere una solución de producto posterior.
7. Los límites de archivos, imágenes y memoria requieren pruebas específicas en fases futuras.
8. Debe completarse la auditoría de licencias y artefactos redistribuidos.

Ninguno de estos riesgos es un bloqueo de viabilidad para continuar: son decisiones de producto, robustez y distribución.

## 32. Decisión final

| Criterio | Estado |
| --- | --- |
| pdfLaTeX real | OK |
| PDF | OK |
| Worker | OK |
| Paquetes académicos | OK con carga selectiva |
| Babel español exacto | OK mediante endpoint |
| Payload conocido | OK |
| Payload razonablemente viable | OK con tradeoff documentado |
| Chromium desktop | OK |
| Firefox desktop | OK funcional |
| Chrome Android real | OK |
| Academic móvil | OK, 6/6 |
| Stress móvil | OK, 6/6 |
| Sin crash móvil | OK |
| UI móvil responsive | OK por observación y gaps |
| Logs | OK |
| Error policy | OK experimental |
| Archivo/línea | OK con limitaciones |
| Multifichero | OK |
| Imágenes | OK |
| Biber | OK bajo demanda |
| GitHub Pages | OK con endpoint CORS |

**FASE 2A — APROBADA Y CERRADA.**

La viabilidad arquitectónica está demostrada en desktop y en un teléfono Android real. El visor inline no invalida la decisión porque el PDF se genera correctamente y el problema pertenece a la visualización de producto.

## 33. Próximo paso autorizado

```text
Fase 2B — Núcleo mínimo de compilación
```

Esta autorización queda documentada como próximo paso del roadmap. No se inició Fase 2B en esta tarea.
