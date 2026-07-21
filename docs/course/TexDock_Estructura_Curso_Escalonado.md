# TexDock — Estructura escalonada del curso básico de LaTeX por páginas

## Propósito del documento

Este documento reorganiza el curso básico de TexDock con una progresión acumulativa:

**Sección → Subsección → Página**

Cada página presenta una sola idea breve, un ejemplo puntual o un ejercicio concreto. Los conocimientos se introducen una sola vez y, a partir de ese momento, se reutilizan en actividades posteriores con una dificultad creciente.

El curso trabaja principalmente con la clase `article` y con una compilación compatible con pdfLaTeX.

---

## Principios pedagógicos de esta versión

### 1. Un concepto nuevo aparece una sola vez

Cuando un comando, entorno o paquete se presenta por primera vez, se explica de manera breve y directa. En las páginas posteriores puede volver a utilizarse, pero ya no se presenta como contenido nuevo.

### 2. El curso funciona como una escalera

Cada práctica puede reutilizar elementos dominados anteriormente. Por ejemplo:

- Después de aprender potencias, subíndices, fracciones y raíces, esos recursos se incorporan en sumatorias, integrales, matrices y ejercicios resueltos.
- Después de crear secciones, las prácticas de tablas, figuras y bibliografía se insertan dentro de un documento ya organizado.
- Después de aprender etiquetas y referencias, se aplican a ecuaciones, tablas y figuras que el estudiante ya sabe construir.

### 3. Los paquetes se introducen justo cuando hacen falta

No se carga desde el inicio una colección de paquetes que el estudiante todavía no comprende. Cada paquete se presenta en el momento en que habilita una necesidad concreta.

| Momento del curso | Paquete nuevo | Necesidad |
|---|---|---|
| Sección 3 | `fontenc`, `inputenc`, `babel` | Escritura y convenciones en español con pdfLaTeX |
| Sección 8 | `amssymb` | Conjuntos numéricos y símbolos adicionales |
| Sección 8 | `amsmath` | Alineaciones, casos, matrices y herramientas matemáticas |
| Sección 9 | `amsthm` | Definiciones, teoremas y demostraciones |
| Sección 10 | `booktabs` | Tablas de estilo académico |
| Sección 10 | `multirow` | Celdas que ocupan varias filas |
| Sección 11 | `graphicx` | Inserción de imágenes |
| Sección 11 | `subcaption` | Paneles de imágenes |
| Sección 13 | `hyperref` | Enlaces internos y referencias clicables |
| Sección 13 | `cleveref` | Referencias que reconocen el tipo de objeto |

### 4. Las prácticas tienen tres niveles

- **Práctica guiada:** modifica un fragmento pequeño.
- **Práctica acumulativa:** combina el concepto nuevo con conocimientos anteriores.
- **Reto breve:** resuelve una tarea sin indicar cada comando que debe usarse.

### 5. El editor conserva una base acumulativa

Cada práctica debe partir del documento mínimo necesario. Cuando una sección requiere conocimientos anteriores, el editor puede incluirlos ya escritos para que el estudiante se concentre en el objetivo nuevo.

No se debe obligar al estudiante a volver a escribir toda la plantilla en cada página.

### 6. Ruta principal y práctica ampliada

Para conservar un recorrido básico manejable:

- Las páginas de **Teoría breve** y **Práctica guiada** forman la ruta principal.
- Las páginas de **Práctica acumulativa**, **Reto** y **Depuración** amplían el entrenamiento.
- La plataforma puede permitir completar una subsección con la ruta principal y dejar los retos como práctica recomendada.
- Los retos no introducen teoría nueva; únicamente combinan conocimientos anteriores.

### 7. Criterios de diseño de las páginas

- Una página debe caber en el viewport del panel educativo.
- La teoría debe contener únicamente lo necesario para realizar la práctica inmediata.
- Una práctica debe tener una instrucción principal clara.
- Las soluciones permanecen disponibles mediante **Ver solución**.
- Los ejercicios no pueden depender de conceptos todavía no enseñados.
- Se empleará `\(...\)` para matemáticas en línea y `\[...\]` para matemáticas en bloque.
- No se empleará `$$...$$`.
- Los ejemplos deben evitar código decorativo que no sea necesario para el objetivo de la página.

---

# Sección 1. Introducción a LaTeX

## Objetivo de la sección

Comprender qué es LaTeX, para qué sirve, cómo funciona su flujo de trabajo y qué clase de documento conviene elegir. Esta sección es completamente conceptual: no contiene ejercicios interactivos, botones ni controles evaluables. Todos los ejemplos se presentan resueltos directamente en la página. La práctica interactiva comienza en la Sección 2.

## Subsección 1.1. ¿Qué es LaTeX?

### Página 1 — La idea principal

- **Tipo:** Teoría breve.
- **Nuevo:** Concepto general de LaTeX.
- **Contenido:** LaTeX es un sistema de preparación de documentos. El usuario escribe contenido estructurado y el sistema genera un documento final, normalmente en PDF.
- **Idea clave:** El usuario indica qué representa cada elemento; LaTeX se encarga de componerlo.

### Página 2 — LaTeX y un procesador visual

- **Tipo:** Comparación.
- **Nuevo:** Diferencia entre edición visual y edición mediante estructura.
- **Contenido:**
  - En un procesador visual se modifica directamente la apariencia.
  - En LaTeX se describe que algo es un título, una sección, una fórmula o una tabla.
- **Idea clave:** LaTeX separa el contenido de gran parte de las decisiones de formato.

### Página 3 — Ventajas en documentos académicos

- **Tipo:** Teoría breve.
- **Nuevo:** Beneficios principales.
- **Contenido puntual:**
  - Fórmulas matemáticas de alta calidad.
  - Numeración automática.
  - Estructura consistente.
  - Referencias que se actualizan.
  - Buen funcionamiento en documentos extensos.
- **Ejemplos resueltos:** cada ventaja se relaciona directamente con su dependencia principal (automatización o tipografía).

### Página 4 — Cuándo resulta especialmente útil

- **Tipo:** Casos de uso.
- **Reutiliza:** Beneficios de la página anterior.
- **Contenido:** Tareas universitarias, informes, artículos, tesis, libros, apuntes, exámenes y presentaciones.
- **Ejemplos resueltos:** cada proyecto se clasifica directamente según si LaTeX aporta una ventaja pequeña, media o grande, con la explicación correspondiente.

## Subsección 1.2. El flujo de trabajo

### Página 1 — Archivo fuente, compilación y resultado

- **Tipo:** Secuencia visual.
- **Nuevo:** Flujo general de trabajo.
- **Contenido:**
  1. Escribir o modificar el archivo `.tex`.
  2. Compilar.
  3. Revisar el resultado.
  4. Corregir o continuar.
- **Idea clave:** El `.tex` es la fuente editable; el PDF es el resultado.

### Página 2 — Compilar no significa terminar

- **Tipo:** Teoría breve.
- **Nuevo:** Ciclo iterativo.
- **Contenido:** Es normal compilar varias veces durante la escritura. Algunas funciones, como índices y referencias, pueden necesitar una compilación adicional para actualizarse.
- **Ejemplo resuelto:** el ciclo de corrección se presenta en el orden correcto como una secuencia numerada.

### Página 3 — Errores como parte del proceso

- **Tipo:** Introducción conceptual.
- **Nuevo:** Diferencia entre error de código y resultado no deseado.
- **Contenido:**
  - Un error de sintaxis puede impedir la compilación.
  - Un documento puede compilar y aun así necesitar una corrección visual o de contenido.
- **Ejemplos resueltos:** cada situación se clasifica directamente como error de compilación, resultado incorrecto o documento correcto.

## Subsección 1.3. Clases de documento

### Página 1 — Qué decide una clase

- **Tipo:** Teoría breve.
- **Nuevo:** Concepto de clase de documento.
- **Contenido:** La clase establece la estructura general disponible y varias reglas de presentación.
- **Idea clave:** La clase se elige según el tipo de documento, no únicamente por su longitud.

### Página 2 — `article`

- **Tipo:** Caso de uso.
- **Nuevo:** Clase principal del curso.
- **Contenido:** Adecuada para tareas, informes breves, artículos y apuntes sin capítulos.
- **Decisión del curso:** Las prácticas usarán `article`.

### Página 3 — `report` y `book`

- **Tipo:** Comparación.
- **Nuevo:** Clases para documentos con capítulos.
- **Contenido:**
  - `report`: informes extensos, proyectos y tesis.
  - `book`: libros y documentos con estructura editorial más amplia.
- **Idea clave:** Ambas permiten capítulos; `book` añade decisiones orientadas a libros.

### Página 4 — `beamer`

- **Tipo:** Caso de uso.
- **Nuevo:** Clase para presentaciones.
- **Contenido:** `beamer` genera diapositivas en PDF y utiliza una estructura distinta a la de una tarea.
- **Alcance:** Se reconoce su función, pero no se desarrolla en este curso básico.

### Página 5 — Elegir una clase

- **Tipo:** Ejemplos resueltos.
- **Reutiliza:** Usos y clases.
- **Contenido:** cada proyecto se asocia directamente con su clase recomendada:
  - Una tarea de cinco páginas → `article`.
  - Una tesis con capítulos → `report`.
  - Un libro de álgebra → `book`.
  - Una presentación de clase → `beamer`.

### Página 6 — Reto de decisión

- **Tipo:** Ejemplos analizados.
- **Contenido:** se presentan tres proyectos ambiguos con sus clases razonables y los criterios que conviene considerar para decidir.
- **Propósito:** Comprender que algunas decisiones admiten más de una solución razonable.

---

# Sección 2. Primer documento y sintaxis esencial

## Objetivo de la sección

Crear el primer archivo compilable, reconocer el preámbulo y el cuerpo, comprender la anatomía de comandos y entornos, y controlar espacios y párrafos.

## Subsección 2.1. El primer documento compilable

### Página 1 — Las tres instrucciones indispensables

- **Tipo:** Teoría breve.
- **Nuevo:** Estructura mínima.
- **Código:**

```latex
\documentclass{article}

\begin{document}
\end{document}
```

- **Contenido:** La primera línea selecciona la clase. Las otras dos abren y cierran el cuerpo.
- **Idea clave:** El contenido visible se escribe entre `\begin{document}` y `\end{document}`.

### Página 2 — Primera compilación

- **Tipo:** Práctica guiada.
- **Editor inicial:** Vacío.
- **Instrucción:** Escribir la estructura mínima y añadir dentro del cuerpo:

```latex
Este es mi primer documento en LaTeX.
```

- **Criterio de éxito:** El PDF muestra la oración y no presenta errores.

### Página 3 — Modificar y recompilar

- **Tipo:** Práctica breve.
- **Reutiliza:** Documento mínimo.
- **Instrucción:** Cambiar la oración por dos datos personales o académicos y volver a compilar.
- **Propósito:** Confirmar el ciclo editar → compilar → revisar.

## Subsección 2.2. Preámbulo y cuerpo

### Página 1 — El preámbulo

- **Tipo:** Teoría breve.
- **Nuevo:** Primera zona del archivo.
- **Contenido:** El preámbulo comienza con la clase y termina antes de `\begin{document}`. Allí se añadirán paquetes, datos y configuraciones.
- **Idea clave:** Prepara el documento, pero no contiene el texto principal.

### Página 2 — El cuerpo

- **Tipo:** Teoría breve.
- **Nuevo:** Segunda zona del archivo.
- **Contenido:** El cuerpo contiene todo lo que debe aparecer en el documento: párrafos, secciones, fórmulas, listas, tablas y figuras.
- **Regla:** El contenido colocado después de `\end{document}` se ignora.

### Página 3 — Clasificar líneas

- **Tipo:** Ejercicio.
- **Reutiliza:** Estructura mínima.
- **Actividad:** Clasificar cinco líneas como:
  - Clase.
  - Preámbulo.
  - Inicio del cuerpo.
  - Contenido visible.
  - Cierre.
- **Criterio de éxito:** Reconocer la posición correcta de cada línea.

## Subsección 2.3. Anatomía de un comando

### Página 1 — Nombre y argumento

- **Tipo:** Teoría breve.
- **Nuevo:** Forma general de un comando.
- **Contenido:**
  - `\` inicia el nombre del comando.
  - `{...}` contiene un argumento obligatorio.
- **Ejemplo conocido:** En `\documentclass{article}`, `documentclass` es el comando y `article` es el argumento.
- **Idea clave:** Todavía no se introducen comandos de formato; se analiza uno que el estudiante ya usa.

### Página 2 — Opciones entre corchetes

- **Tipo:** Teoría breve.
- **Nuevo:** Argumento opcional.
- **Ejemplo:**

```latex
\documentclass[12pt]{article}
```

- **Contenido:** Los corchetes contienen opciones. En este caso se solicita un tamaño base de 12 puntos.
- **Idea clave:** Las llaves suelen contener información obligatoria; los corchetes, opciones.

### Página 3 — Modificar una opción

- **Tipo:** Práctica guiada.
- **Reutiliza:** Clase `article`.
- **Instrucción:** Añadir la opción `12pt`, compilar y comparar el tamaño del texto con el documento anterior.
- **Criterio de éxito:** El documento sigue compilando y el cambio se observa globalmente.

### Página 4 — Identificar partes de un comando

- **Tipo:** Ejercicio.
- **Actividad:** Señalar barra invertida, nombre, opción y argumento en tres comandos mostrados.
- **Nota:** Los comandos adicionales se presentan solo como objetos de análisis, sin exigir que el estudiante conozca todavía su función.

## Subsección 2.4. Entornos

### Página 1 — Abrir y cerrar una región

- **Tipo:** Teoría breve.
- **Nuevo:** Concepto de entorno.
- **Contenido:** Un entorno comienza con `\begin{nombre}` y termina con `\end{nombre}`.
- **Ejemplo conocido:** `document`.
- **Idea clave:** El nombre de apertura y cierre debe coincidir.

### Página 2 — Error por cierre incorrecto

- **Tipo:** Práctica de depuración.
- **Editor inicial:** Documento con `\begin{document}` y un cierre escrito con un nombre diferente.
- **Instrucción:** Corregir el cierre.
- **Criterio de éxito:** El documento compila.

### Página 3 — Buscar una pareja faltante

- **Tipo:** Reto breve.
- **Reutiliza:** Entornos y estructura.
- **Actividad:** Encontrar cuál de cuatro líneas debe añadirse a un fragmento incompleto.
- **Propósito:** Desarrollar el hábito de revisar aperturas y cierres.

## Subsección 2.5. Espacios, saltos y párrafos

### Página 1 — Espacios consecutivos

- **Tipo:** Teoría breve.
- **Nuevo:** Tratamiento de espacios.
- **Contenido:** Varios espacios escritos con la barra espaciadora suelen producir un solo espacio visible.
- **Ejemplo:** Comparar una línea con uno y con diez espacios.

### Página 2 — Un salto de línea no crea un párrafo

- **Tipo:** Teoría breve.
- **Nuevo:** Diferencia entre línea de código y párrafo.
- **Contenido:** Una sola pulsación de Enter normalmente no inicia un párrafo nuevo.

### Página 3 — Una línea vacía separa párrafos

- **Tipo:** Práctica guiada.
- **Reutiliza:** Documento mínimo.
- **Editor inicial:** Dos oraciones en líneas consecutivas.
- **Instrucción:** Dejar una línea completamente vacía entre ellas.
- **Criterio de éxito:** El PDF muestra dos párrafos.

### Página 4 — Construir tres párrafos

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir una introducción de tres párrafos breves usando únicamente líneas vacías para separarlos.
- **Criterio de éxito:** No se utilizan espacios repetidos para intentar controlar el diseño.

### Página 5 — Reto de corrección

- **Tipo:** Reto breve.
- **Editor inicial:** Texto con espacios repetidos y saltos simples usados incorrectamente.
- **Actividad:** Reorganizarlo en dos párrafos legibles.
- **Criterio de éxito:** El código queda limpio y el resultado coincide con la estructura solicitada.

---

# Sección 3. Paquetes necesarios para escribir en español

## Objetivo de la sección

Comprender qué es un paquete y construir la plantilla base en español. En esta sección se cargan únicamente los paquetes necesarios para esta necesidad.

## Subsección 3.1. Qué es un paquete

### Página 1 — Extender la clase

- **Tipo:** Teoría breve.
- **Nuevo:** Concepto de paquete.
- **Contenido:** Un paquete añade funciones o configuraciones a la clase seleccionada.
- **Sintaxis general:**

```latex
\usepackage[opciones]{paquete}
```

- **Ubicación:** En el preámbulo.

### Página 2 — Ubicación correcta

- **Tipo:** Ejercicio.
- **Reutiliza:** Preámbulo y cuerpo.
- **Actividad:** Elegir entre cuatro posiciones dónde debe insertarse una línea `\usepackage`.
- **Criterio de éxito:** Después de `\documentclass` y antes de `\begin{document}`.

### Página 3 — Corregir un paquete mal colocado

- **Tipo:** Práctica de depuración.
- **Editor inicial:** Una línea `\usepackage` dentro del cuerpo.
- **Instrucción:** Moverla al preámbulo.
- **Propósito:** Reforzar la división estructural sin volver a explicar el documento mínimo.

## Subsección 3.2. Codificación de salida con `fontenc`

### Página 1 — Fuentes T1

- **Tipo:** Teoría breve.
- **Nuevo:** `fontenc`.
- **Código:**

```latex
\usepackage[T1]{fontenc}
```

- **Contenido:** En pdfLaTeX, la codificación T1 mejora el tratamiento tipográfico y la extracción de muchas letras acentuadas.
- **Idea clave:** Se configura una característica de las fuentes del PDF.

### Página 2 — Añadir `fontenc`

- **Tipo:** Práctica guiada.
- **Reutiliza:** Ubicación de paquetes.
- **Instrucción:** Añadir la línea en el preámbulo del documento acumulativo.
- **Criterio de éxito:** Compila sin cambiar el contenido visible.

## Subsección 3.3. Entrada UTF-8 con `inputenc`

### Página 1 — Interpretar los caracteres escritos

- **Tipo:** Teoría breve.
- **Nuevo:** `inputenc`.
- **Código:**

```latex
\usepackage[utf8]{inputenc}
```

- **Contenido:** En una plantilla pedagógica de pdfLaTeX, permite indicar que el archivo fuente utiliza UTF-8.
- **Nota:** Las versiones modernas de LaTeX suelen asumir UTF-8, pero el paquete se conserva para hacer explícita la configuración del curso.

### Página 2 — Probar tildes y la letra ñ

- **Tipo:** Práctica guiada.
- **Reutiliza:** Plantilla acumulativa.
- **Instrucción:** Añadir el paquete y escribir una oración con `á`, `é`, `í`, `ó`, `ú`, `ñ`, `¿` y `¡`.
- **Criterio de éxito:** Los caracteres aparecen correctamente.

## Subsección 3.4. Convenciones en español con `babel`

### Página 1 — Idioma del documento

- **Tipo:** Teoría breve.
- **Nuevo:** `babel`.
- **Código:**

```latex
\usepackage[spanish]{babel}
```

- **Contenido:** Adapta nombres automáticos y convenciones tipográficas al español.
- **Idea clave:** No se limita a reconocer tildes; configura el idioma de varias funciones del documento.

### Página 2 — Añadir `babel`

- **Tipo:** Práctica guiada.
- **Reutiliza:** Paquetes previos.
- **Instrucción:** Añadir `babel` debajo de la configuración de entrada.
- **Criterio de éxito:** El documento sigue compilando en español.

### Página 3 — Reconocer las funciones de cada paquete

- **Tipo:** Ejercicio.
- **Actividad:** Relacionar:
  - `fontenc` con fuentes de salida.
  - `inputenc` con codificación de entrada.
  - `babel` con idioma y convenciones.
- **Propósito:** Evitar que los tres paquetes se memoricen como líneas indistinguibles.

## Subsección 3.5. Plantilla base del curso

### Página 1 — Construcción acumulativa

- **Tipo:** Ejemplo.
- **Reutiliza:** Todo lo aprendido en la sección.
- **Código:**

```latex
\documentclass{article}

\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[spanish]{babel}

\begin{document}
Texto del documento.
\end{document}
```

- **Idea clave:** Esta será la base para las secciones siguientes.

### Página 2 — Completar líneas faltantes

- **Tipo:** Práctica acumulativa.
- **Editor inicial:** Plantilla con tres espacios vacíos en el preámbulo.
- **Instrucción:** Completar los paquetes en el orden mostrado.
- **Criterio de éxito:** Compila un texto con tildes.

### Página 3 — Reto de plantilla

- **Tipo:** Reto breve.
- **Editor inicial:** Vacío.
- **Instrucción:** Construir una plantilla en español sin copiar un bloque completo.
- **Criterio de éxito:** Incluye clase, tres paquetes y entorno `document`.

---

# Sección 4. Datos principales y resumen

## Objetivo de la sección

Declarar el título, el autor y la fecha, mostrarlos con `\maketitle` y añadir un resumen mediante `abstract`.

## Subsección 4.1. Declarar el título

### Página 1 — `\title`

- **Tipo:** Teoría breve.
- **Nuevo:** Metadato de título.
- **Código:**

```latex
\title{Título del trabajo}
```

- **Ubicación:** Preámbulo.
- **Idea clave:** Declarar el dato no lo muestra todavía.

### Página 2 — Añadir un título propio

- **Tipo:** Práctica guiada.
- **Reutiliza:** Plantilla base.
- **Instrucción:** Declarar el título `Introducción a las funciones`.
- **Criterio de éxito:** El documento compila aunque el título todavía no aparezca.

## Subsección 4.2. Autor y fecha

### Página 1 — `\author` y `\date`

- **Tipo:** Teoría breve.
- **Nuevo:** Metadatos de autor y fecha.
- **Código:**

```latex
\author{Nombre del autor}
\date{\today}
```

- **Contenido:** `\today` genera la fecha actual según el idioma configurado. También puede escribirse una fecha fija.

### Página 2 — Completar los datos

- **Tipo:** Práctica guiada.
- **Reutiliza:** Título y `babel`.
- **Instrucción:** Añadir nombre y fecha automática.
- **Criterio de éxito:** Los tres datos quedan declarados en el preámbulo.

### Página 3 — Fecha automática o fija

- **Tipo:** Ejercicio.
- **Actividad:** Cambiar entre `\today` y una fecha escrita manualmente; comparar el resultado después de mostrar el título en la siguiente subsección.
- **Propósito:** Distinguir datos dinámicos y fijos.

## Subsección 4.3. Mostrar los datos con `\maketitle`

### Página 1 — Imprimir el encabezado

- **Tipo:** Teoría breve.
- **Nuevo:** `\maketitle`.
- **Contenido:** Toma los datos declarados y los imprime con el formato de la clase.
- **Ubicación:** Dentro del cuerpo, normalmente al inicio.

### Página 2 — Generar el título visual

- **Tipo:** Práctica guiada.
- **Reutiliza:** Título, autor y fecha.
- **Instrucción:** Añadir `\maketitle` después de `\begin{document}`.
- **Criterio de éxito:** Aparecen los tres datos.

### Página 3 — Reto de corrección

- **Tipo:** Reto breve.
- **Editor inicial:** Documento con `\maketitle` colocado en el preámbulo.
- **Actividad:** Moverlo al lugar correcto.
- **Criterio de éxito:** Compila y muestra el encabezado.

## Subsección 4.4. El entorno `abstract`

### Página 1 — Función del resumen

- **Tipo:** Teoría breve.
- **Nuevo:** Entorno `abstract`.
- **Contenido:** Presenta una síntesis breve al inicio de un artículo.
- **Código:**

```latex
\begin{abstract}
Resumen del documento.
\end{abstract}
```

### Página 2 — Añadir un resumen

- **Tipo:** Práctica guiada.
- **Reutiliza:** Entornos y `\maketitle`.
- **Instrucción:** Colocar `abstract` debajo del título y escribir dos oraciones.
- **Criterio de éxito:** El encabezado automático aparece en español.

### Página 3 — Mejorar un resumen

- **Tipo:** Práctica de redacción.
- **Actividad:** Reducir un texto de cuatro oraciones a dos oraciones que indiquen tema y objetivo.
- **Propósito:** Mantener la teoría de LaTeX conectada con una tarea académica real.

## Subsección 4.5. Mini proyecto: portada académica

### Página 1 — Construir el bloque inicial

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Crear título, autor, fecha, `\maketitle` y resumen a partir de la plantilla española.
- **Criterio de éxito:** Todos los elementos aparecen en el orden correcto.

### Página 2 — Detectar datos mal ubicados

- **Tipo:** Ejercicio de depuración.
- **Actividad:** Corregir un documento donde `\author` está en el cuerpo y `abstract` en el preámbulo.
- **Criterio de éxito:** Cada elemento queda en su zona correspondiente.

---

# Sección 5. Organización del contenido

## Objetivo de la sección

Crear una jerarquía mediante secciones y subsecciones, generar títulos no numerados y construir un índice automático.

## Subsección 5.1. Secciones

### Página 1 — Nivel principal

- **Tipo:** Teoría breve.
- **Nuevo:** `\section`.
- **Código:**

```latex
\section{Introducción}
```

- **Contenido:** Crea un encabezado principal y asigna un número automáticamente.

### Página 2 — Crear dos secciones

- **Tipo:** Práctica guiada.
- **Reutiliza:** Documento con título y resumen.
- **Instrucción:** Añadir `Introducción` y `Desarrollo`.
- **Criterio de éxito:** Aparecen numeradas en orden.

### Página 3 — Reordenar sin renumerar manualmente

- **Tipo:** Práctica breve.
- **Actividad:** Intercambiar las dos secciones y recompilar.
- **Idea clave:** La numeración se actualiza sola.

## Subsección 5.2. Subsecciones y subsubsecciones

### Página 1 — Niveles secundarios

- **Tipo:** Teoría breve.
- **Nuevo:** `\subsection` y `\subsubsection`.
- **Contenido:** Permiten dividir una sección sin escribir números a mano.

### Página 2 — Construir una jerarquía

- **Tipo:** Práctica guiada.
- **Reutiliza:** Secciones.
- **Instrucción:** Dentro de `Desarrollo`, añadir `Definiciones`, `Ejemplos` y una subsubsección `Primer caso`.
- **Criterio de éxito:** La numeración refleja la jerarquía.

### Página 3 — Elegir el nivel correcto

- **Tipo:** Ejercicio.
- **Actividad:** Elegir entre sección, subsección y subsubsección para seis títulos.
- **Propósito:** Evitar usar niveles solo por tamaño visual.

## Subsección 5.3. Encabezados no numerados

### Página 1 — Variante con asterisco

- **Tipo:** Teoría breve.
- **Nuevo:** `\section*`.
- **Contenido:** El asterisco conserva la apariencia del encabezado y elimina la numeración.
- **Ejemplo:** `\section*{Agradecimientos}`.

### Página 2 — Convertir un encabezado

- **Tipo:** Práctica guiada.
- **Instrucción:** Convertir una sección numerada de agradecimientos en una sección sin número.
- **Criterio de éxito:** Mantiene el estilo y pierde el número.

### Página 3 — Decidir cuándo numerar

- **Tipo:** Ejercicio.
- **Actividad:** Clasificar Introducción, Desarrollo, Conclusiones, Agradecimientos y Anexo según una propuesta de numeración.
- **Nota:** Se admite más de una convención si se justifica.

## Subsección 5.4. Índice automático

### Página 1 — `\tableofcontents`

- **Tipo:** Teoría breve.
- **Nuevo:** Tabla de contenidos.
- **Contenido:** Recopila encabezados numerados y sus páginas.
- **Ubicación recomendada:** Después de `\maketitle` y antes del contenido.

### Página 2 — Generar el índice

- **Tipo:** Práctica guiada.
- **Reutiliza:** Secciones y subsecciones.
- **Instrucción:** Añadir `\tableofcontents`.
- **Criterio de éxito:** El índice muestra la jerarquía existente.

### Página 3 — Actualizar el índice

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir una subsección nueva y compilar las veces necesarias hasta que aparezca.
- **Idea clave:** Algunos datos auxiliares se actualizan en una compilación posterior.

### Página 4 — Observar una sección con asterisco

- **Tipo:** Ejercicio.
- **Actividad:** Comprobar que una `\section*` no aparece automáticamente en el índice.
- **Propósito:** Relacionar numeración e índice sin introducir todavía comandos avanzados para modificarlo.

## Subsección 5.5. Reto de estructura

### Página 1 — Esqueleto de una tarea

- **Tipo:** Reto acumulativo.
- **Instrucción:** Crear:
  - Título y resumen.
  - Índice.
  - Tres secciones.
  - Dos subsecciones dentro de la segunda.
  - Un encabezado final sin número.
- **Criterio de éxito:** La jerarquía es coherente y la numeración es automática.

### Página 2 — Corregir una jerarquía plana

- **Tipo:** Depuración estructural.
- **Editor inicial:** Todos los títulos están escritos como `\section`.
- **Actividad:** Convertir los títulos secundarios al nivel correcto.
- **Criterio de éxito:** El índice refleja una estructura de dos niveles.

---

# Sección 6. Escritura y formato de texto

## Objetivo de la sección

Aplicar estilos tipográficos con intención, controlar alineación y sangría, añadir comentarios y escribir caracteres reservados.

## Subsección 6.1. Negrita

### Página 1 — `\textbf`

- **Tipo:** Teoría breve.
- **Nuevo:** Texto en negrita.
- **Código:** `\textbf{concepto importante}`.
- **Uso:** Destacar términos o etiquetas breves, no párrafos completos.

### Página 2 — Destacar términos

- **Tipo:** Práctica guiada.
- **Reutiliza:** Párrafos y secciones.
- **Instrucción:** Aplicar negrita a dos conceptos dentro de un párrafo.
- **Criterio de éxito:** Solo se resaltan los términos solicitados.

### Página 3 — Evitar exceso de énfasis

- **Tipo:** Ejercicio editorial.
- **Actividad:** Elegir cuáles de seis fragmentos merecen negrita.
- **Propósito:** Enseñar uso funcional, no solo sintaxis.

## Subsección 6.2. Cursiva y énfasis

### Página 1 — `\textit` y `\emph`

- **Tipo:** Teoría breve.
- **Nuevo:** Cursiva directa y énfasis semántico.
- **Contenido:**
  - `\textit{...}` fuerza cursiva.
  - `\emph{...}` marca énfasis y se adapta al contexto.
- **Idea clave:** Para enfatizar una idea suele preferirse `\emph`.

### Página 2 — Aplicar cursiva y énfasis

- **Tipo:** Práctica guiada.
- **Instrucción:** Usar `\textit` para un título de obra y `\emph` para una advertencia.
- **Criterio de éxito:** Ambos fragmentos muestran diferencias de intención.

### Página 3 — Énfasis dentro de énfasis

- **Tipo:** Práctica acumulativa.
- **Actividad:** Colocar `\emph` dentro de una frase ya enfatizada y observar el cambio.
- **Propósito:** Mostrar que el énfasis responde al contexto.

## Subsección 6.3. Subrayado y anidación

### Página 1 — `\underline`

- **Tipo:** Teoría breve.
- **Nuevo:** Subrayado básico.
- **Contenido:** `\underline{...}` dibuja una línea bajo el contenido.
- **Advertencia:** Debe usarse con moderación porque puede reducir la legibilidad.

### Página 2 — Combinar estilos

- **Tipo:** Práctica guiada.
- **Reutiliza:** Negrita y cursiva.
- **Instrucción:** Crear una frase en negrita y cursiva mediante comandos anidados.
- **Criterio de éxito:** Los cierres de llaves están correctamente ordenados.

### Página 3 — Reparar llaves desbalanceadas

- **Tipo:** Práctica de depuración.
- **Editor inicial:** Comandos de formato con una llave faltante.
- **Actividad:** Corregir el equilibrio de llaves.
- **Criterio de éxito:** El documento compila y el formato se limita al fragmento esperado.

## Subsección 6.4. Sangría

### Página 1 — Comportamiento predeterminado

- **Tipo:** Teoría breve.
- **Nuevo:** Sangría de párrafo.
- **Contenido:** LaTeX suele añadir sangría al inicio de un párrafo nuevo.

### Página 2 — `\noindent`

- **Tipo:** Teoría breve.
- **Nuevo:** Eliminación puntual de sangría.
- **Contenido:** `\noindent` al inicio de un párrafo evita la sangría solo en ese párrafo.

### Página 3 — Comparar dos párrafos

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir dos párrafos y aplicar `\noindent` únicamente al segundo.
- **Criterio de éxito:** Solo el segundo comienza sin sangría.

## Subsección 6.5. Alineación de bloques

### Página 1 — `center`

- **Tipo:** Teoría breve.
- **Nuevo:** Entorno centrado.
- **Contenido:** `center` centra un bloque completo.

### Página 2 — `flushleft` y `flushright`

- **Tipo:** Teoría breve.
- **Nuevo:** Alineación lateral mediante entornos.
- **Contenido:** Permiten alinear bloques a izquierda o derecha.

### Página 3 — Maquetar una cita

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Entornos, cursiva y párrafos.
- **Instrucción:** Centrar una cita, escribirla en cursiva y colocar el autor alineado a la derecha.
- **Criterio de éxito:** Cada entorno se cierra antes de continuar el texto normal.

### Página 4 — Reto de tres alineaciones

- **Tipo:** Reto breve.
- **Actividad:** Mostrar tres frases con alineaciones distintas sin usar espacios repetidos.

## Subsección 6.6. Comentarios

### Página 1 — El símbolo `%`

- **Tipo:** Teoría breve.
- **Nuevo:** Comentarios.
- **Contenido:** Todo lo situado a la derecha de `%` en esa línea se ignora al compilar.
- **Uso:** Notas privadas, recordatorios y desactivación temporal de una línea.

### Página 2 — Añadir una nota privada

- **Tipo:** Práctica guiada.
- **Instrucción:** Añadir un comentario que explique por qué una sección está incompleta.
- **Criterio de éxito:** El comentario no aparece en el PDF.

### Página 3 — Desactivar una línea

- **Tipo:** Práctica breve.
- **Actividad:** Comentar temporalmente una oración y recompilar.
- **Propósito:** Usar comentarios como herramienta de prueba.

## Subsección 6.7. Caracteres reservados

### Página 1 — Símbolos con función especial

- **Tipo:** Teoría breve.
- **Nuevo:** Caracteres reservados.
- **Contenido:** `%`, `$`, `&`, `_`, `#`, `{` y `}` participan en la sintaxis de LaTeX.

### Página 2 — Escapar caracteres

- **Tipo:** Teoría breve.
- **Nuevo:** Escritura literal.
- **Contenido:** Usar `\%`, `\$`, `\&`, `\_`, `\#`, `\{` y `\}` para mostrar esos símbolos como texto.

### Página 3 — Reparar una oración

- **Tipo:** Práctica guiada.
- **Editor inicial:** `El descuento fue del 50% y el precio fue $20.`
- **Instrucción:** Escapar los dos símbolos problemáticos.
- **Criterio de éxito:** Compila y muestra `50%` y `$20`.

### Página 4 — Escribir una dirección y una etiqueta

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir en texto una dirección de correo con `_`, una etiqueta con `#` y una empresa separada por `&`.
- **Criterio de éxito:** Todos los caracteres se muestran literalmente.

## Subsección 6.8. Reto de edición de texto

### Página 1 — Corregir un bloque completo

- **Tipo:** Reto acumulativo.
- **Actividad:** Editar un párrafo que contiene:
  - Énfasis excesivo.
  - Una llave faltante.
  - Un porcentaje sin escapar.
  - Un comentario que debería permanecer privado.
- **Criterio de éxito:** Compila y conserva una jerarquía visual clara.

### Página 2 — Redactar una introducción breve

- **Tipo:** Producción.
- **Instrucción:** Escribir dos párrafos con un concepto en negrita, un término en cursiva y un comentario de código.
- **Propósito:** Consolidar formato sin volver a practicar la plantilla.

---

# Sección 7. Listas

## Objetivo de la sección

Construir listas con viñetas, listas numeradas y combinaciones jerárquicas, reutilizando la estructura de entornos.

## Subsección 7.1. Listas con viñetas

### Página 1 — El entorno `itemize`

- **Tipo:** Teoría breve.
- **Nuevo:** Lista no ordenada.
- **Código:**

```latex
\begin{itemize}
  \item Primer elemento
  \item Segundo elemento
\end{itemize}
```

- **Idea clave:** Cada elemento comienza con `\item`.

### Página 2 — Crear una lista de materiales

- **Tipo:** Práctica guiada.
- **Reutiliza:** Entornos.
- **Instrucción:** Convertir cuatro materiales escritos en un párrafo en una lista `itemize`.
- **Criterio de éxito:** Aparecen cuatro viñetas.

### Página 3 — Añadir y eliminar elementos

- **Tipo:** Práctica breve.
- **Actividad:** Añadir un elemento entre el segundo y el tercero y eliminar el último.
- **Propósito:** Observar que no se numeran manualmente.

## Subsección 7.2. Listas numeradas

### Página 1 — El entorno `enumerate`

- **Tipo:** Teoría breve.
- **Nuevo:** Lista ordenada.
- **Contenido:** Asigna números automáticamente a cada `\item`.

### Página 2 — Escribir un procedimiento

- **Tipo:** Práctica guiada.
- **Instrucción:** Convertir tres pasos de compilación en una lista `enumerate`.
- **Criterio de éxito:** Los pasos aparecen como 1, 2 y 3.

### Página 3 — Reordenar un procedimiento

- **Tipo:** Práctica acumulativa.
- **Actividad:** Mover el tercer paso al inicio.
- **Criterio de éxito:** La numeración se actualiza sin editar números.

## Subsección 7.3. Listas anidadas

### Página 1 — Una lista dentro de otra

- **Tipo:** Teoría breve.
- **Nuevo:** Anidamiento de listas.
- **Contenido:** Un entorno de lista puede abrirse dentro de un `\item`.

### Página 2 — Añadir subpuntos

- **Tipo:** Práctica guiada.
- **Reutiliza:** `enumerate` e `itemize`.
- **Instrucción:** Dentro del primer paso numerado, añadir dos observaciones con viñetas.
- **Criterio de éxito:** La sangría distingue los niveles.

### Página 3 — Cerrar en el orden correcto

- **Tipo:** Práctica de depuración.
- **Editor inicial:** Lista anidada con cierres intercambiados.
- **Actividad:** Cerrar primero la lista interior y luego la exterior.
- **Criterio de éxito:** Compila y mantiene la estructura.

## Subsección 7.4. Listas con texto formateado

### Página 1 — Destacar palabras dentro de `\item`

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Negrita, cursiva y listas.
- **Instrucción:** Crear una lista de tres conceptos, escribir cada nombre en negrita y su explicación en texto normal.

### Página 2 — Lista de objetivos académicos

- **Tipo:** Producción.
- **Actividad:** Escribir tres objetivos numerados; incluir dos subobjetivos en el segundo.
- **Criterio de éxito:** La jerarquía es clara y el formato no sustituye a la estructura.

### Página 3 — Elegir el tipo de lista

- **Tipo:** Ejercicio.
- **Actividad:** Decidir entre `itemize` y `enumerate` para seis casos.
- **Propósito:** Relacionar sintaxis con significado.

## Subsección 7.5. Reto acumulativo de listas

### Página 1 — Plan de una tarea

- **Tipo:** Reto.
- **Instrucción:** Dentro de una sección llamada `Plan de trabajo`, crear:
  - Una lista numerada de tres etapas.
  - Dos tareas con viñetas dentro de cada etapa.
  - Un término importante en negrita.
- **Criterio de éxito:** Todos los entornos están correctamente anidados.

### Página 2 — Corregir una lista incompleta

- **Tipo:** Depuración.
- **Editor inicial:** Falta un `\item`, hay un entorno sin cerrar y un elemento está fuera de la lista.
- **Actividad:** Corregir los tres problemas.
- **Criterio de éxito:** Compila y muestra la estructura esperada.

---

# Sección 8. Escritura matemática progresiva

## Objetivo de la sección

Aprender notación matemática desde expresiones simples hasta estructuras de varias líneas. Cada página reutiliza símbolos ya aprendidos y añade una sola herramienta nueva.

## Subsección 8.1. Matemáticas en línea

### Página 1 — Abrir y cerrar el modo matemático

- **Tipo:** Teoría breve.
- **Nuevo:** `\(...\)`.
- **Contenido:** Las expresiones matemáticas dentro de un párrafo se escriben entre `\(` y `\)`.
- **Ejemplo:** `Sea \(x\) un número real.`
- **Idea clave:** El texto normal permanece fuera de los delimitadores.

### Página 2 — Insertar variables en un párrafo

- **Tipo:** Práctica guiada.
- **Reutiliza:** Párrafos.
- **Instrucción:** Escribir una oración que incluya las variables `x`, `y` y la igualdad `x+y=5` en línea.
- **Criterio de éxito:** Solo la notación matemática aparece en modo matemático.

### Página 3 — Corregir delimitadores

- **Tipo:** Depuración.
- **Editor inicial:** Una expresión con apertura `\(` y sin cierre.
- **Actividad:** Añadir el delimitador faltante.
- **Criterio de éxito:** Compila y el texto posterior no queda afectado.

## Subsección 8.2. Matemáticas en bloque

### Página 1 — Destacar una expresión

- **Tipo:** Teoría breve.
- **Nuevo:** `\[...\]`.
- **Contenido:** Coloca una fórmula centrada en una línea independiente y sin número.

### Página 2 — Pasar una igualdad a bloque

- **Tipo:** Práctica guiada.
- **Reutiliza:** Modo en línea.
- **Instrucción:** Escribir una oración introductoria y mostrar después `x+y=5` en bloque.
- **Criterio de éxito:** El párrafo y la fórmula ocupan zonas distintas.

### Página 3 — Elegir línea o bloque

- **Tipo:** Ejercicio.
- **Actividad:** Elegir el formato adecuado para cinco expresiones según su función en el texto.
- **Propósito:** Evitar usar bloques para símbolos aislados.

## Subsección 8.3. Superíndices y subíndices

### Página 1 — Un solo carácter

- **Tipo:** Teoría breve.
- **Nuevo:** `^` y `_`.
- **Ejemplos:** `x^2`, `a_n`.
- **Idea clave:** Sin llaves, solo el carácter siguiente queda afectado.

### Página 2 — Agrupar varios caracteres

- **Tipo:** Teoría breve.
- **Nuevo:** Agrupación matemática con llaves.
- **Ejemplos:** `x^{n+1}`, `a_{i,j}`.

### Página 3 — Combinar índice y potencia

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir:

```latex
\[
X_{i,j}^{2}+Y_{n+1}
\]
```

- **Criterio de éxito:** Los grupos completos aparecen en la posición correcta.

### Página 4 — Reto de índices

- **Tipo:** Reto breve.
- **Actividad:** Escribir una expresión que combine `a_1`, `a_2`, `a_{n-1}` y `a_n`.
- **Propósito:** Practicar índices simples y compuestos sin introducir todavía puntos de continuación.

## Subsección 8.4. Fracciones

### Página 1 — `\frac`

- **Tipo:** Teoría breve.
- **Nuevo:** Fracciones.
- **Código:** `\frac{numerador}{denominador}`.
- **Idea clave:** Numerador y denominador son argumentos separados.

### Página 2 — Crear una fracción simple

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir `\frac{x+1}{n}` en bloque.
- **Criterio de éxito:** Toda la suma aparece en el numerador.

### Página 3 — Fracción con índices y potencias

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Subíndices y potencias.
- **Instrucción:** Escribir:

```latex
\[
\frac{x_n^2+1}{n-1}
\]
```

### Página 4 — Reparar argumentos

- **Tipo:** Depuración.
- **Editor inicial:** Una fracción sin llaves alrededor del denominador compuesto.
- **Actividad:** Delimitar correctamente ambos argumentos.

## Subsección 8.5. Raíces

### Página 1 — Raíz cuadrada

- **Tipo:** Teoría breve.
- **Nuevo:** `\sqrt`.
- **Ejemplo:** `\sqrt{x+1}`.

### Página 2 — Raíz de índice distinto

- **Tipo:** Teoría breve.
- **Nuevo:** Índice opcional.
- **Ejemplo:** `\sqrt[3]{x}`.

### Página 3 — Combinar raíz y fracción

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Fracciones, índices y potencias.
- **Instrucción:** Escribir:

```latex
\[
\sqrt{\frac{x_n^2+1}{n-1}}
\]
```

- **Criterio de éxito:** La fracción completa queda dentro de la raíz.

## Subsección 8.6. Letras griegas y relaciones

### Página 1 — Letras griegas frecuentes

- **Tipo:** Referencia breve.
- **Nuevo:** `\alpha`, `\beta`, `\mu`, `\sigma`, `\lambda`, `\theta`, `\varepsilon`.
- **Actividad rápida:** Relacionar cada comando con su símbolo.

### Página 2 — Relaciones matemáticas

- **Tipo:** Referencia breve.
- **Nuevo:** `\le`, `\ge`, `\neq`, `\in`, `\notin`.
- **Ejemplo:** `x\in A` y `x\neq 0`.

### Página 3 — Escribir condiciones

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir en línea una oración que incluya `\mu\ge 0` y `\sigma\neq 0`.

### Página 4 — Reto de parámetro

- **Tipo:** Reto breve.
- **Actividad:** Representar una condición para `\theta` y `\varepsilon` usando al menos dos relaciones.

## Subsección 8.7. Conjuntos y cuantificadores con `amssymb`

### Página 1 — Necesidad de un paquete nuevo

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `amssymb`.
- **Contenido:** Para usar notación como `\mathbb{R}` se añade:

```latex
\usepackage{amssymb}
```

- **Ubicación:** Preámbulo.
- **Idea clave:** El paquete se incorpora porque ahora existe una necesidad concreta.

### Página 2 — Conjuntos numéricos

- **Tipo:** Referencia breve.
- **Nuevo:** `\mathbb{N}`, `\mathbb{Z}`, `\mathbb{Q}`, `\mathbb{R}`.
- **Reutiliza:** Pertenencia.

### Página 3 — Cuantificadores

- **Tipo:** Referencia breve.
- **Nuevo:** `\forall` y `\exists`.

### Página 4 — Dominio y condición

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
\forall x\in\mathbb{R},\qquad x^2\ge 0
\]
```

### Página 5 — Reto de existencia

- **Tipo:** Reto breve.
- **Actividad:** Escribir una afirmación que use `\exists`, `\mathbb{Z}`, subíndice y potencia.
- **Criterio de éxito:** El paquete está cargado y la expresión es sintácticamente válida.

## Subsección 8.8. Delimitadores

### Página 1 — Paréntesis, corchetes y llaves

- **Tipo:** Teoría breve.
- **Nuevo:** Delimitadores matemáticos y escape de llaves.
- **Contenido:** `(` y `)`, `[` y `]`, `\{` y `\}`.

### Página 2 — Tamaño automático

- **Tipo:** Teoría breve.
- **Nuevo:** `\left` y `\right`.
- **Ejemplo:**

```latex
\left(\frac{a}{b}\right)
```

### Página 3 — Agrupar una expresión conocida

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Fracciones, subíndices, letras griegas y potencias.
- **Instrucción:** Escribir:

```latex
\[
\left(\frac{X_i-\mu}{\sigma}\right)^2
\]
```

### Página 4 — Construir un conjunto

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir un conjunto con llaves ajustables y la condición `x\ge 0`.
- **Criterio de éxito:** Las llaves se muestran y no se interpretan como agrupadores invisibles.

## Subsección 8.9. Operadores con límites

### Página 1 — Límite y flecha

- **Tipo:** Teoría breve.
- **Nuevo:** `\lim` y `\to`.
- **Ejemplo:** `\lim_{x\to 0}`.

### Página 2 — Sumatoria y productoria

- **Tipo:** Teoría breve.
- **Nuevo:** `\sum` y `\prod`.
- **Contenido:** Los límites inferior y superior reutilizan `_` y `^`.

### Página 3 — Integral

- **Tipo:** Teoría breve.
- **Nuevo:** `\int` y diferencial con espacio fino `\,`.
- **Ejemplo:** `\int_a^b f(x)\,dx`.

### Página 4 — Sumatoria de fracciones

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
\sum_{i=1}^{n}
\left(\frac{x_i-\mu}{\sigma}\right)^2
\]
```

### Página 5 — Integral con raíz

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir una integral entre `0` y `1` cuyo integrando contenga una raíz y una fracción.
- **Propósito:** Reutilizar estructuras sin explicarlas nuevamente.

## Subsección 8.10. `amsmath` y ecuaciones alineadas

### Página 1 — Incorporar `amsmath`

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `amsmath`.
- **Necesidad:** Escribir desarrollos alineados y utilizar entornos matemáticos avanzados.
- **Código:**

```latex
\usepackage{amsmath}
```

### Página 2 — El entorno `align*`

- **Tipo:** Teoría breve.
- **Nuevo:** Alineación sin numeración.
- **Contenido:**
  - `&` marca el punto de alineación.
  - `\\` termina una línea.

### Página 3 — Alinear dos pasos

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir:

```latex
\begin{align*}
(x+1)^2 &= x^2+2x+1 \\
        &= x(x+2)+1
\end{align*}
```

### Página 4 — Desarrollo con fracciones

- **Tipo:** Práctica acumulativa.
- **Actividad:** Alinear tres pasos de una igualdad que incluya una fracción.
- **Criterio de éxito:** Los signos iguales quedan en una columna.

### Página 5 — Corregir `&` y `\\`

- **Tipo:** Depuración.
- **Editor inicial:** Un `align*` con puntos de alineación inconsistentes y un salto faltante.
- **Actividad:** Corregir la estructura.

## Subsección 8.11. Texto dentro de fórmulas

### Página 1 — `\text`

- **Tipo:** Teoría breve.
- **Nuevo:** Texto normal dentro del modo matemático.
- **Código:** `\text{si } x>0`.
- **Necesidad:** Evitar que las palabras se interpreten como variables en cursiva.
- **Dependencia:** `amsmath` ya fue añadido.

### Página 2 — Corregir una condición

- **Tipo:** Práctica guiada.
- **Editor inicial:** `x^2 si x>0`.
- **Actividad:** Colocar la palabra dentro de `\text`.

### Página 3 — Conectores en un desarrollo

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir una igualdad con las expresiones `para` y `si` mediante `\text`.

## Subsección 8.12. Funciones por partes

### Página 1 — El entorno `cases`

- **Tipo:** Teoría breve.
- **Nuevo:** Funciones por tramos.
- **Contenido:** `&` separa expresión y condición; `\\` cambia de fila.
- **Dependencia:** `amsmath`.

### Página 2 — Función de dos casos

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir:

```latex
\[
f(x)=
\begin{cases}
x^2, & \text{si } x\ge 0,\\
-x,  & \text{si } x<0.
\end{cases}
\]
```

### Página 3 — Función con fracción

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear una función que use una fracción en el primer caso y `0` en el segundo.
- **Criterio de éxito:** Las condiciones están en texto recto.

### Página 4 — Reto de valor absoluto

- **Tipo:** Reto breve.
- **Instrucción:** Escribir la definición por casos de `|x|` sin proporcionar el código completo.

## Subsección 8.13. Matrices

### Página 1 — Filas y columnas

- **Tipo:** Teoría breve.
- **Nuevo:** Estructura interna de una matriz.
- **Contenido:** `&` separa columnas y `\\` separa filas.

### Página 2 — `pmatrix` y `bmatrix`

- **Tipo:** Teoría breve.
- **Nuevo:** Matrices con paréntesis y corchetes.
- **Dependencia:** `amsmath`.

### Página 3 — Matriz `2\times2`

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir:

```latex
\[
A=
\begin{bmatrix}
a_{11} & a_{12}\\
a_{21} & a_{22}
\end{bmatrix}
\]
```

### Página 4 — Vector columna

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear un vector columna de tres componentes mediante `pmatrix`.

### Página 5 — Sistema matricial

- **Tipo:** Reto breve.
- **Actividad:** Escribir `Ax=b` y representar `x` y `b` como matrices columna.
- **Propósito:** Practicar matrices sin introducir todavía la notación vectorial en negrita.

## Subsección 8.14. Acentos y vectores

### Página 1 — Barras, sombreros y tildes

- **Tipo:** Referencia breve.
- **Nuevo:** `\bar`, `\hat`, `\tilde`.
- **Ejemplos:** `\bar{x}`, `\hat{\theta}`, `\tilde{x}`.

### Página 2 — Flechas y negrita

- **Tipo:** Referencia breve.
- **Nuevo:** `\vec` y `\mathbf`.
- **Ejemplos:** `\vec{v}`, `\mathbf{v}`.

### Página 3 — Puntos de derivación

- **Tipo:** Referencia breve.
- **Nuevo:** `\dot{x}` y `\ddot{x}`.

### Página 4 — Estimador con índice

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
\hat{\mu}_n=\bar{X}_n
\]
```

### Página 5 — Reto vectorial

- **Tipo:** Reto breve.
- **Actividad:** Escribir una igualdad entre un vector con flecha y un vector columna.

## Subsección 8.15. Combinatoria y operadores con nombre

### Página 1 — Coeficiente binomial

- **Tipo:** Teoría breve.
- **Nuevo:** `\binom`.
- **Dependencia:** `amsmath`.
- **Ejemplo:** `\binom{n}{k}`.

### Página 2 — Nombres de operadores

- **Tipo:** Teoría breve.
- **Nuevo:** `\operatorname`.
- **Ejemplos:** `\operatorname{Var}(X)`, `\operatorname{Cov}(X,Y)`.
- **Idea clave:** El nombre aparece en letra recta y con espaciado de operador.

### Página 3 — Probabilidad binomial

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** `\mathbb`, potencias y coeficiente binomial.
- **Instrucción:** Escribir:

```latex
\[
\mathbb{P}(X=k)=
\binom{n}{k}p^k(1-p)^{n-k}
\]
```

### Página 4 — Varianza de una transformación

- **Tipo:** Reto breve.
- **Actividad:** Escribir una expresión con `\operatorname{Var}`, una potencia y una constante griega.

## Subsección 8.16. Puntos de continuación

### Página 1 — Puntos horizontales

- **Tipo:** Teoría breve.
- **Nuevo:** `\dots` y `\cdots`.
- **Contenido:**
  - `\dots` para listas.
  - `\cdots` para operaciones.

### Página 2 — Puntos en matrices

- **Tipo:** Teoría breve.
- **Nuevo:** `\vdots` y `\ddots`.

### Página 3 — Matriz general

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
A=
\begin{bmatrix}
a_{11} & \cdots & a_{1n}\\
\vdots & \ddots & \vdots\\
a_{n1} & \cdots & a_{nn}
\end{bmatrix}
\]
```

## Subsección 8.17. Lógica y flechas

### Página 1 — Implicación y equivalencia

- **Tipo:** Teoría breve.
- **Nuevo:** `\Rightarrow`, `\implies`, `\Leftrightarrow`, `\iff`.
- **Dependencia:** Las variantes `\implies` y `\iff` están disponibles con `amsmath`.

### Página 2 — Flechas con anotación

- **Tipo:** Teoría breve.
- **Nuevo:** `\xrightarrow{...}`.
- **Ejemplo:** `X_n\xrightarrow{d}X`.

### Página 3 — Condición épsilon-delta

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
|x-x_0|<\delta
\implies
|f(x)-f(x_0)|<\varepsilon
\]
```

### Página 4 — Reto lógico

- **Tipo:** Reto breve.
- **Actividad:** Escribir una equivalencia que contenga cuantificadores, pertenencia y una potencia.

## Subsección 8.18. Integrales múltiples

### Página 1 — `\iint`, `\iiint` y `\oint`

- **Tipo:** Teoría breve.
- **Nuevo:** Operadores de cálculo multivariable.
- **Dependencia:** `amsmath`.

### Página 2 — Integral doble

- **Tipo:** Práctica guiada.
- **Instrucción:** Escribir:

```latex
\[
\iint_R f(x,y)\,dx\,dy
\]
```

### Página 3 — Integral triple acumulativa

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir una integral triple con límites, una raíz y tres diferenciales.

## Subsección 8.19. Anotaciones sobre expresiones

### Página 1 — `\underbrace`

- **Tipo:** Teoría breve.
- **Nuevo:** Llave inferior con etiqueta.
- **Código:** `\underbrace{expresión}_{\text{texto}}`.

### Página 2 — `\overbrace`

- **Tipo:** Teoría breve.
- **Nuevo:** Llave superior con etiqueta.

### Página 3 — Identificar un término

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
Y_i=\beta_0+\beta_1X_i+
\underbrace{\varepsilon_i}_{\text{error}}
\]
```

### Página 4 — Reto de descomposición

- **Tipo:** Reto breve.
- **Actividad:** Marcar con `\overbrace` la parte cuadrática de una expresión y con `\underbrace` el término constante.

## Subsección 8.20. Espaciado y notación de conjuntos

### Página 1 — Espacios matemáticos

- **Tipo:** Referencia breve.
- **Nuevo:** `\!`, `\,`, `\:`, `\quad`, `\qquad`.
- **Idea clave:** Se usan con moderación para resolver una necesidad tipográfica.

### Página 2 — Barra de condición

- **Tipo:** Teoría breve.
- **Nuevo:** `\mid`.
- **Contenido:** Es una relación matemática apropiada para “tal que”.

### Página 3 — Conjunto por comprensión

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
A=\left\{x\in\mathbb{R}\mid x^2-1=0\right\}
\]
```

### Página 4 — Producto interno y norma

- **Tipo:** Teoría breve.
- **Nuevo:** `\langle x,y\rangle` y `\lVert x\rVert`.
- **Dependencia:** La plantilla matemática ya contiene `amsmath`.

### Página 5 — Reto de ortogonalidad

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir una implicación que relacione producto interno cero y ortogonalidad.

## Subsección 8.21. Fuentes y congruencias

### Página 1 — Letras caligráficas y góticas

- **Tipo:** Teoría breve.
- **Nuevo:** `\mathcal{F}` y `\mathfrak{p}`.
- **Dependencia:** `amssymb` ya está disponible.

### Página 2 — Congruencias

- **Tipo:** Teoría breve.
- **Nuevo:** `\equiv` y `\pmod`.
- **Ejemplo:** `a\equiv b\pmod m`.

### Página 3 — Práctica de teoría de números

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir una congruencia que incluya potencia, subíndice y módulo.

## Subsección 8.22. Reto integrador de notación

### Página 1 — Fórmula estadística

- **Tipo:** Reto acumulativo.
- **Actividad:** Escribir una fórmula que combine:
  - Sumatoria.
  - Fracción.
  - Media con barra.
  - Subíndices.
  - Potencia.
  - Delimitadores ajustables.

### Página 2 — Función por partes con conjuntos

- **Tipo:** Reto acumulativo.
- **Actividad:** Definir una función por partes cuyo dominio use `\mathbb{R}` y cuyas condiciones incluyan desigualdades.

### Página 3 — Matriz y vector

- **Tipo:** Reto acumulativo.
- **Actividad:** Escribir una matriz general y un vector columna en el mismo bloque matemático.

### Página 4 — Depuración matemática

- **Tipo:** Depuración.
- **Editor inicial:** Fórmula con:
  - Un subíndice compuesto sin llaves.
  - Un `\text` ausente.
  - Una fila de matriz sin `\\`.
  - Un delimitador `\left` sin pareja.
- **Criterio de éxito:** Compila y conserva el significado matemático.

---

# Sección 9. Redacción matemática y entornos formales

## Objetivo de la sección

Usar la notación conocida para redactar soluciones completas, numerar ecuaciones, crear atajos y estructurar definiciones, teoremas y demostraciones.

## Subsección 9.1. Estructura de un ejercicio resuelto

### Página 1 — Enunciado, desarrollo y respuesta

- **Tipo:** Teoría breve.
- **Nuevo:** Organización de una solución.
- **Contenido:**
  1. Enunciado identificable.
  2. Explicación breve.
  3. Desarrollo matemático.
  4. Resultado final.

### Página 2 — Destacar el resultado

- **Tipo:** Teoría breve.
- **Nuevo:** `\boxed`.
- **Dependencia:** `amsmath`.
- **Contenido:** Encierra una expresión matemática final.

### Página 3 — Maquetar una solución

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Negrita, cursiva, `align*` y potencias.
- **Actividad:** Presentar un ejercicio algebraico de dos pasos y terminar con una respuesta en `\boxed`.

### Página 4 — Explicar un paso

- **Tipo:** Práctica de redacción.
- **Actividad:** Añadir una oración antes de cada línea importante del desarrollo.
- **Propósito:** Evitar soluciones formadas únicamente por símbolos.

## Subsección 9.2. Ecuaciones numeradas

### Página 1 — El entorno `equation`

- **Tipo:** Teoría breve.
- **Nuevo:** Numeración automática de ecuaciones.
- **Contenido:** `equation` centra y numera una fórmula.

### Página 2 — Convertir un bloque

- **Tipo:** Práctica guiada.
- **Editor inicial:** Una fórmula escrita con `\[...\]`.
- **Actividad:** Sustituirla por `equation`.
- **Criterio de éxito:** Aparece un número lateral.

### Página 3 — Elegir qué numerar

- **Tipo:** Ejercicio editorial.
- **Actividad:** Decidir cuáles de cinco fórmulas deberían numerarse en un informe.
- **Idea clave:** No toda expresión necesita un número.

### Página 4 — Dos ecuaciones consecutivas

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear dos entornos `equation` y comprobar la numeración automática.
- **Nota:** Las referencias a esos números se enseñarán en la Sección 13.

## Subsección 9.3. Comandos propios

### Página 1 — `\newcommand`

- **Tipo:** Teoría breve.
- **Nuevo:** Atajos personalizados.
- **Sintaxis:** `\newcommand{\nombre}{definición}`.
- **Ubicación:** Preámbulo.

### Página 2 — Atajos para conjuntos

- **Tipo:** Práctica guiada.
- **Reutiliza:** `\mathbb`.
- **Actividad:** Definir `\R` y `\N`.

### Página 3 — Atajo para el diferencial

- **Tipo:** Práctica guiada.
- **Nuevo:** Reutilización de espaciado dentro de un comando.
- **Actividad:** Definir `\dx` como `\,dx`.

### Página 4 — Integral con atajos

- **Tipo:** Práctica acumulativa.
- **Instrucción:** Escribir:

```latex
\[
\int_{\R} f(x)\dx
\]
```

### Página 5 — Evitar nombres existentes

- **Tipo:** Teoría breve.
- **Contenido:** Un comando nuevo debe tener un nombre claro y no sobrescribir accidentalmente un comando existente.
- **Ejercicio:** Elegir el mejor nombre entre cuatro alternativas.

## Subsección 9.4. Introducción de `amsthm`

### Página 1 — Necesidad de entornos formales

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `amsthm`.
- **Código:**

```latex
\usepackage{amsthm}
```

- **Necesidad:** Definiciones, teoremas y demostraciones con formato consistente.

### Página 2 — Definir un entorno

- **Tipo:** Teoría breve.
- **Nuevo:** `\newtheorem`.
- **Código:**

```latex
\newtheorem{teorema}{Teorema}
```

- **Ubicación:** Preámbulo.

### Página 3 — Escribir un teorema

- **Tipo:** Práctica guiada.
- **Actividad:** Crear un entorno `teorema` con un resultado elemental sobre números pares.

### Página 4 — Definir un entorno de definición

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir `\newtheorem{definicion}{Definición}` y escribir una definición breve.

## Subsección 9.5. Demostraciones

### Página 1 — El entorno `proof`

- **Tipo:** Teoría breve.
- **Nuevo:** Demostración automática.
- **Contenido:** Añade el encabezado y el símbolo final de demostración.

### Página 2 — Demostrar una propiedad

- **Tipo:** Práctica guiada.
- **Reutiliza:** Párrafos y notación matemática.
- **Actividad:** Demostrar que la suma de dos números pares es par.

### Página 3 — Demostración con `align*`

- **Tipo:** Práctica acumulativa.
- **Actividad:** Incluir un desarrollo de dos líneas alineadas dentro de `proof`.

### Página 4 — Reto formal

- **Tipo:** Reto.
- **Instrucción:** Escribir una definición, un teorema y una demostración relacionados.
- **Criterio de éxito:** Cada entorno tiene una función distinta y está correctamente cerrado.

## Subsección 9.6. Operadores personalizados

### Página 1 — `\DeclareMathOperator`

- **Tipo:** Teoría breve.
- **Nuevo:** Declaración de operadores reutilizables.
- **Dependencia:** `amsmath`.
- **Código:**

```latex
\DeclareMathOperator{\Ker}{Ker}
```

### Página 2 — Usar un operador

- **Tipo:** Práctica guiada.
- **Actividad:** Declarar `\Ker` y usarlo en `\Ker(T)`.

### Página 3 — Reto de álgebra lineal

- **Tipo:** Práctica acumulativa.
- **Actividad:** Declarar un segundo operador y escribir una igualdad entre dimensiones de espacios.

## Subsección 9.7. Reto de redacción matemática

### Página 1 — Ejercicio completo

- **Tipo:** Reto acumulativo.
- **Actividad:** Crear un ejercicio con:
  - Enunciado en negrita.
  - Explicación textual.
  - Desarrollo en `align*`.
  - Resultado en `\boxed`.
  - Una ecuación numerada adicional.

### Página 2 — Texto formal

- **Tipo:** Reto.
- **Actividad:** Escribir una definición, un teorema y una prueba usando al menos una fracción y un cuantificador.

### Página 3 — Depuración formal

- **Tipo:** Depuración.
- **Editor inicial:** Entorno `proof` sin cierre, teorema no definido y comando personalizado colocado en el cuerpo.
- **Criterio de éxito:** Cada declaración queda en la zona correcta.

---

# Sección 10. Tablas

## Objetivo de la sección

Construir tablas desde su estructura básica hasta una tabla académica flotante. Las referencias a tablas se añadirán posteriormente, cuando se enseñe el sistema general de referencias.

## Subsección 10.1. El entorno `tabular`

### Página 1 — Estructura general

- **Tipo:** Teoría breve.
- **Nuevo:** `tabular`.
- **Contenido:** Crea filas y columnas dentro del cuerpo.

### Página 2 — Especificación de columnas

- **Tipo:** Teoría breve.
- **Nuevo:** `l`, `c` y `r`.
- **Contenido:** Alinean una columna a izquierda, centro o derecha.

### Página 3 — Separar celdas y filas

- **Tipo:** Teoría breve.
- **Aplicación nueva:** `&` y `\\` como separadores de columnas y filas.
- **Nota:** Se reutilizan símbolos conocidos de otros entornos, pero aquí cumplen la función de columnas y filas.

### Página 4 — Primera tabla

- **Tipo:** Práctica guiada.
- **Actividad:** Crear una tabla de dos columnas con nombre y nota.

### Página 5 — Añadir una fila

- **Tipo:** Práctica breve.
- **Actividad:** Añadir un tercer estudiante sin modificar la especificación de columnas.

## Subsección 10.2. Alineación de datos

### Página 1 — Elegir alineación por contenido

- **Tipo:** Teoría breve.
- **Nuevo:** Criterio de alineación.
- **Contenido:** Texto suele alinearse a la izquierda; números pueden centrarse o alinearse a la derecha.

### Página 2 — Tabla de tres columnas

- **Tipo:** Práctica guiada.
- **Actividad:** Crear columnas para índice, variable y frecuencia usando `clr`.

### Página 3 — Corregir cantidad de celdas

- **Tipo:** Depuración.
- **Editor inicial:** Una fila tiene más `&` que la especificación permite.
- **Actividad:** Igualar la cantidad de columnas.

## Subsección 10.3. Bordes básicos

### Página 1 — Líneas verticales

- **Tipo:** Teoría breve.
- **Nuevo:** `|` en la especificación.

### Página 2 — Líneas horizontales

- **Tipo:** Teoría breve.
- **Nuevo:** `\hline`.

### Página 3 — Tabla con cuadrícula

- **Tipo:** Práctica guiada.
- **Reutiliza:** Tabla de datos.
- **Actividad:** Añadir una cuadrícula completa.

### Página 4 — Comparar estilos

- **Tipo:** Ejercicio visual.
- **Actividad:** Comparar tabla sin líneas y tabla con cuadrícula; indicar cuál facilita la lectura en dos contextos distintos.

## Subsección 10.4. Tablas académicas con `booktabs`

### Página 1 — Incorporar `booktabs`

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `booktabs`.
- **Código:**

```latex
\usepackage{booktabs}
```

- **Necesidad:** Líneas horizontales con jerarquía visual.

### Página 2 — Tres reglas principales

- **Tipo:** Teoría breve.
- **Nuevo:** `\toprule`, `\midrule`, `\bottomrule`.
- **Idea clave:** En este estilo no se usan líneas verticales.

### Página 3 — Transformar una tabla

- **Tipo:** Práctica acumulativa.
- **Editor inicial:** Tabla con cuadrícula.
- **Actividad:** Eliminar `|` y sustituir `\hline` por reglas de `booktabs`.

### Página 4 — Reto de publicación

- **Tipo:** Reto breve.
- **Actividad:** Crear una tabla limpia de tres columnas sin recibir el código completo.

## Subsección 10.5. Combinar columnas

### Página 1 — `\multicolumn`

- **Tipo:** Teoría breve.
- **Nuevo:** Celda que ocupa varias columnas.
- **Sintaxis:** `\multicolumn{n}{alineación}{texto}`.
- **Paquete:** No requiere uno nuevo.

### Página 2 — Encabezado agrupado

- **Tipo:** Práctica guiada.
- **Actividad:** Hacer que `Resultados` abarque las columnas Media y Varianza.

### Página 3 — Regla parcial

- **Tipo:** Teoría breve.
- **Nuevo:** `\cmidrule(lr){2-3}`.
- **Dependencia:** `booktabs` ya está cargado.

### Página 4 — Tabla con dos niveles de encabezado

- **Tipo:** Práctica acumulativa.
- **Actividad:** Combinar `\multicolumn`, `\cmidrule` y datos numéricos.

## Subsección 10.6. Combinar filas con `multirow`

### Página 1 — Incorporar `multirow`

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `multirow`.
- **Código:**

```latex
\usepackage{multirow}
```

- **Necesidad:** Una celda debe abarcar varias filas.

### Página 2 — Sintaxis básica

- **Tipo:** Teoría breve.
- **Nuevo:** `\multirow{filas}{ancho}{texto}`.
- **Nota:** `*` permite ancho automático.

### Página 3 — Agrupar observaciones

- **Tipo:** Práctica guiada.
- **Actividad:** Crear una categoría que abarque dos filas de resultados.

### Página 4 — Reto combinado

- **Tipo:** Reto acumulativo.
- **Actividad:** Usar una celda combinada por filas y un encabezado combinado por columnas en la misma tabla.

## Subsección 10.7. El entorno flotante `table`

### Página 1 — Diferencia entre `tabular` y `table`

- **Tipo:** Teoría breve.
- **Nuevo:** Contenedor flotante.
- **Contenido:**
  - `tabular` crea la rejilla.
  - `table` agrupa el objeto, permite título y gestiona colocación.

### Página 2 — Centrar y añadir leyenda

- **Tipo:** Teoría breve.
- **Nuevo:** `\centering` y `\caption` dentro de `table`.

### Página 3 — Preferencias de colocación

- **Tipo:** Teoría breve.
- **Nuevo:** `[htbp]`.
- **Contenido:** Son preferencias, no posiciones absolutas.

### Página 4 — Tabla académica completa

- **Tipo:** Práctica acumulativa.
- **Actividad:** Envolver una tabla `booktabs` en `table`, centrarla y añadir una leyenda.
- **Nota:** La etiqueta y la referencia se añadirán en la Sección 13.

## Subsección 10.8. Reto integrador de tablas

### Página 1 — Tabla de resultados

- **Tipo:** Reto.
- **Actividad:** Crear una tabla flotante con:
  - Tres columnas.
  - Encabezado agrupado.
  - Estilo `booktabs`.
  - Dos filas de datos.
  - Leyenda.

### Página 2 — Depuración de tabla

- **Tipo:** Depuración.
- **Editor inicial:** Número incorrecto de columnas, una fila sin cierre y `\toprule` sin paquete.
- **Criterio de éxito:** Compila y conserva el estilo académico.

### Página 3 — Elegir paquetes necesarios

- **Tipo:** Ejercicio.
- **Actividad:** Decidir si una tabla dada necesita ninguno, `booktabs`, `multirow` o ambos.
- **Propósito:** Reforzar la carga justificada de paquetes.

---

# Sección 11. Imágenes y figuras

## Objetivo de la sección

Insertar imágenes, controlar su tamaño, convertirlas en figuras y crear paneles. Las referencias se incorporarán más adelante.

## Subsección 11.1. Incorporar `graphicx`

### Página 1 — Necesidad de imágenes

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `graphicx`.
- **Código:**

```latex
\usepackage{graphicx}
```

### Página 2 — `\includegraphics`

- **Tipo:** Teoría breve.
- **Nuevo:** Inserción de archivo.
- **Código:** `\includegraphics{imagen.png}`.
- **Idea clave:** El archivo debe existir en una ruta accesible.

### Página 3 — Primera imagen

- **Tipo:** Práctica guiada.
- **Recurso:** `imagen.png`.
- **Actividad:** Insertarla después de una oración introductoria.
- **Criterio de éxito:** El archivo se encuentra y aparece.

### Página 4 — Diagnosticar una ruta

- **Tipo:** Depuración.
- **Editor inicial:** Nombre de archivo incorrecto.
- **Actividad:** Corregir nombre y extensión.

## Subsección 11.2. Control de tamaño

### Página 1 — Ancho relativo

- **Tipo:** Teoría breve.
- **Nuevo:** `width=0.5\textwidth`.

### Página 2 — Ancho fijo y escala

- **Tipo:** Teoría breve.
- **Nuevo:** `width=8cm` y `scale=0.8`.

### Página 3 — Redimensionar sin deformar

- **Tipo:** Práctica guiada.
- **Actividad:** Hacer que la imagen ocupe `0.6\textwidth`.
- **Idea clave:** Al indicar solo el ancho, la proporción se mantiene.

### Página 4 — Comparar dos tamaños

- **Tipo:** Práctica breve.
- **Actividad:** Probar `0.4\textwidth` y `0.8\textwidth`; elegir el más legible.

## Subsección 11.3. Rotación y combinación de opciones

### Página 1 — `angle`

- **Tipo:** Teoría breve.
- **Nuevo:** Rotación.
- **Ejemplo:** `angle=90`.

### Página 2 — Varias opciones

- **Tipo:** Teoría breve.
- **Nuevo:** Separación por comas.
- **Ejemplo:** `[width=5cm,angle=45]`.

### Página 3 — Ajustar y rotar

- **Tipo:** Práctica guiada.
- **Actividad:** Mostrar la imagen al `50\%` del ancho y rotarla `180` grados.

## Subsección 11.4. El entorno `figure`

### Página 1 — Convertir una imagen en figura

- **Tipo:** Teoría breve.
- **Nuevo:** `figure`.
- **Contenido:** Contenedor flotante para imágenes.

### Página 2 — Centrado y leyenda

- **Tipo:** Teoría breve.
- **Reutiliza:** `\centering` y `\caption` aprendidos con tablas.
- **Contenido:** No se vuelven a explicar; se aplican al nuevo objeto.

### Página 3 — Construir una figura

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear una figura centrada con ancho `0.7\textwidth` y una leyenda.

### Página 4 — Comparar imagen suelta y figura

- **Tipo:** Ejercicio conceptual.
- **Actividad:** Identificar cuál de dos códigos permite numeración y gestión flotante.

## Subsección 11.5. Colocación de figuras

### Página 1 — Reutilizar `[htbp]`

- **Tipo:** Aplicación.
- **Reutiliza:** Preferencias de colocación aprendidas con `table`.
- **Actividad:** Añadir `[htbp]` a una figura.
- **Idea clave:** No se presenta como concepto nuevo; se transfiere a otro flotante.

### Página 2 — Figura demasiado grande

- **Tipo:** Depuración visual.
- **Actividad:** Reducir una figura que invade los márgenes.
- **Criterio de éxito:** Cabe dentro del ancho del texto.

## Subsección 11.6. Paneles con `subcaption`

### Página 1 — Incorporar `subcaption`

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `subcaption`.
- **Código:**

```latex
\usepackage{subcaption}
```

- **Necesidad:** Varias imágenes bajo una figura principal.

### Página 2 — Entorno `subfigure`

- **Tipo:** Teoría breve.
- **Nuevo:** Subfigura con ancho propio y leyenda.

### Página 3 — Dos paneles en una fila

- **Tipo:** Práctica guiada.
- **Actividad:** Usar dos subfiguras de `0.45\textwidth` separadas con `\hfill`.

### Página 4 — Leyendas individuales y general

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir títulos `Antes`, `Después` y una leyenda para el conjunto.

### Página 5 — Reto comparativo

- **Tipo:** Reto.
- **Actividad:** Crear una comparación A/B sin copiar un bloque completo.
- **Criterio de éxito:** La suma de anchos y espacios cabe en la línea.

## Subsección 11.7. Reto integrador de figuras

### Página 1 — Figura de un informe

- **Tipo:** Reto.
- **Actividad:** Insertar una imagen, ajustar ancho, envolverla en `figure`, añadir leyenda y preferencia de colocación.

### Página 2 — Panel de resultados

- **Tipo:** Reto acumulativo.
- **Actividad:** Crear dos subfiguras y una leyenda principal.

### Página 3 — Depuración de recursos

- **Tipo:** Depuración.
- **Editor inicial:** Falta `graphicx`, la ruta es incorrecta y la suma de anchos supera `\textwidth`.
- **Criterio de éxito:** Compila y muestra ambos paneles en una fila.

---

# Sección 12. Notas al pie

## Objetivo de la sección

Añadir aclaraciones breves, controlar su colocación textual, reutilizar una nota y resolver notas dentro de tablas.

## Subsección 12.1. Nota básica

### Página 1 — `\footnote`

- **Tipo:** Teoría breve.
- **Nuevo:** Nota al pie.
- **Contenido:** Crea una marca elevada y coloca la explicación al pie de la página.

### Página 2 — Añadir una aclaración

- **Tipo:** Práctica guiada.
- **Actividad:** Añadir una nota a la palabra `convergencia`.

### Página 3 — Comprobar la numeración

- **Tipo:** Práctica breve.
- **Actividad:** Añadir una segunda nota y observar la numeración automática.

## Subsección 12.2. Posición en la oración

### Página 1 — Unión con el término

- **Tipo:** Teoría breve.
- **Nuevo:** Colocación sin espacio previo.
- **Contenido:** La nota debe quedar unida al término que aclara.

### Página 2 — Nota y puntuación

- **Tipo:** Comparación.
- **Contenido:** Aplicar la convención editorial elegida de manera consistente.
- **Nota pedagógica:** TexDock puede mostrar la convención recomendada por la guía institucional, sin presentar una única regla universal para todos los estilos.

### Página 3 — Corregir espacios

- **Tipo:** Práctica.
- **Actividad:** Eliminar un espacio incorrecto antes de `\footnote`.

## Subsección 12.3. Varias notas en un mismo texto

### Página 1 — Numeración automática

- **Tipo:** Teoría breve.
- **Nuevo:** Comportamiento de varias notas.
- **Contenido:** Cada nueva `\footnote` recibe el número siguiente sin que el estudiante lo escriba manualmente.

### Página 2 — Dos aclaraciones distintas

- **Tipo:** Práctica guiada.
- **Actividad:** Añadir dos notas diferentes en un mismo párrafo.
- **Criterio de éxito:** Cada marca conduce a su propio texto.

### Página 3 — Evitar duplicaciones innecesarias

- **Tipo:** Criterio editorial.
- **Contenido:** Si una aclaración se repite literalmente, conviene revisar si debe formularse una sola vez. La reutilización técnica de una misma marca se enseñará después de presentar el sistema general de referencias en la Sección 13.

## Subsección 12.4. Notas dentro de tablas

### Página 1 — Problema del entorno `tabular`

- **Tipo:** Teoría breve.
- **Nuevo:** Limitación práctica.
- **Contenido:** Una nota escrita directamente dentro de ciertas tablas puede no producir el texto al pie esperado.

### Página 2 — Marca y texto separados

- **Tipo:** Teoría breve.
- **Nuevo:** `\footnotemark` y `\footnotetext`.

### Página 3 — Añadir una nota a un dato

- **Tipo:** Práctica acumulativa.
- **Reutiliza:** Tablas.
- **Actividad:** Colocar la marca en una celda y el texto después de `tabular`.

### Página 4 — Reto de tabla académica

- **Tipo:** Reto.
- **Actividad:** Añadir una aclaración a una tabla `booktabs` sin duplicar la nota.

## Subsección 12.5. Reto de notas

### Página 1 — Párrafo con dos aclaraciones

- **Tipo:** Reto.
- **Actividad:** Escribir un párrafo con dos notas distintas y comprobar que la numeración sigue el orden de aparición.

### Página 2 — Depuración

- **Tipo:** Depuración.
- **Editor inicial:** Espacio indebido, una nota vacía y una nota atrapada dentro de una tabla.
- **Criterio de éxito:** Todas las marcas muestran un texto válido.

---

# Sección 13. Referencias internas y enlaces

## Objetivo de la sección

Introducir una sola vez el sistema general de etiquetas y aplicarlo a secciones, ecuaciones, tablas y figuras ya conocidas.

## Subsección 13.1. Etiquetas

### Página 1 — `\label`

- **Tipo:** Teoría breve.
- **Nuevo:** Identificador interno.
- **Contenido:** Asigna un nombre único a un objeto numerado.
- **Convenciones:** `sec:`, `eq:`, `tab:`, `fig:`, `thm:`.

### Página 2 — Dónde colocar la etiqueta

- **Tipo:** Teoría breve.
- **Nuevo:** Asociación con el contador correcto.
- **Contenido:**
  - Después de un encabezado numerado.
  - Dentro de una ecuación numerada.
  - Después de `\caption` en tablas y figuras.

### Página 3 — Etiquetar una sección

- **Tipo:** Práctica guiada.
- **Reutiliza:** Secciones.
- **Actividad:** Añadir `\label{sec:metodo}` a una sección.

## Subsección 13.2. Referencias con `\ref`

### Página 1 — Recuperar un número

- **Tipo:** Teoría breve.
- **Nuevo:** `\ref`.
- **Contenido:** Sustituye una etiqueta por el número actual del objeto.

### Página 2 — Citar una sección

- **Tipo:** Práctica guiada.
- **Actividad:** Escribir `Como se explica en la Sección \ref{sec:metodo}, ...`.

### Página 3 — Cambiar el orden

- **Tipo:** Práctica acumulativa.
- **Actividad:** Insertar una sección anterior y comprobar que la referencia se actualiza.

### Página 4 — Resolver `??`

- **Tipo:** Depuración.
- **Contenido:** Una referencia indefinida puede deberse a una etiqueta incorrecta o a que falta recompilar.
- **Actividad:** Corregir ambos casos.

## Subsección 13.3. Número de página

### Página 1 — `\pageref`

- **Tipo:** Teoría breve.
- **Nuevo:** Página del objeto etiquetado.

### Página 2 — Número y página

- **Tipo:** Práctica acumulativa.
- **Actividad:** Citar una sección con `\ref` y su ubicación con `\pageref`.

### Página 3 — Reto de navegación

- **Tipo:** Reto.
- **Actividad:** Escribir una frase que dirija al lector a una sección y página concretas sin escribir números manualmente.

## Subsección 13.4. Referencias a ecuaciones

### Página 1 — `\eqref`

- **Tipo:** Teoría breve.
- **Nuevo:** Referencia con paréntesis para ecuaciones.
- **Dependencia:** `amsmath` ya está cargado.

### Página 2 — Etiquetar una ecuación

- **Tipo:** Práctica guiada.
- **Reutiliza:** `equation`.
- **Actividad:** Añadir `\label{eq:pitagoras}` dentro de una ecuación.

### Página 3 — Citar la ecuación

- **Tipo:** Práctica acumulativa.
- **Actividad:** Mencionarla mediante `\eqref{eq:pitagoras}`.

### Página 4 — Renumeración automática

- **Tipo:** Ejercicio.
- **Actividad:** Insertar otra ecuación antes y comprobar que la cita cambia.

## Subsección 13.5. Referencias a tablas

### Página 1 — Añadir una etiqueta después de `\caption`

- **Tipo:** Aplicación.
- **Reutiliza:** `table`, `caption` y sistema de etiquetas.
- **Actividad:** Etiquetar una tabla existente.

### Página 2 — Citar la tabla

- **Tipo:** Práctica acumulativa.
- **Actividad:** Escribir una oración con `Tabla \ref{tab:resultados}`.

### Página 3 — Reto de tabla y página

- **Tipo:** Reto.
- **Actividad:** Citar el número de tabla y la página donde aparece.

## Subsección 13.6. Referencias a figuras

### Página 1 — Etiquetar una figura

- **Tipo:** Aplicación.
- **Reutiliza:** `figure`, `caption` y `label`.
- **Actividad:** Colocar la etiqueta después de la leyenda.

### Página 2 — Citar una figura

- **Tipo:** Práctica acumulativa.
- **Actividad:** Mencionar la figura desde un párrafo anterior.

### Página 3 — Referenciar una subfigura

- **Tipo:** Aplicación avanzada.
- **Actividad:** Añadir etiquetas a dos subfiguras y citarlas individualmente.
- **Dependencia:** `subcaption` ya fue introducido.

## Subsección 13.7. Reutilizar una nota mediante referencias

### Página 1 — Etiquetar la nota original

- **Tipo:** Aplicación.
- **Reutiliza:** `\footnote` y `\label`.
- **Código:** `\footnote{Aclaración.\label{nota:metodo}}`.
- **Idea clave:** La etiqueta se añade ahora porque el sistema general de referencias ya fue aprendido.

### Página 2 — Mostrar la misma marca

- **Tipo:** Teoría breve.
- **Nuevo:** `\textsuperscript{\ref{nota:metodo}}`.
- **Contenido:** Eleva el número recuperado por `\ref` sin crear un segundo texto al pie.

### Página 3 — Método A y Método B

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir una nota al Método A y reutilizar su marca junto al Método B.
- **Criterio de éxito:** Hay dos marcas con el mismo número y un solo texto de nota.

### Página 4 — Reto de nota reutilizada

- **Tipo:** Reto.
- **Actividad:** Reutilizar una aclaración en tres posiciones de una página sin duplicar su contenido.

## Subsección 13.8. Enlaces con `hyperref`

### Página 1 — Incorporar `hyperref`

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `hyperref`.
- **Código:**

```latex
\usepackage{hyperref}
```

- **Necesidad:** Convertir referencias internas y otros elementos en enlaces.

### Página 2 — Orden del paquete

- **Tipo:** Teoría breve.
- **Contenido:** Se carga cerca del final del preámbulo para reducir conflictos con otros paquetes.

### Página 3 — Probar enlaces internos

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir `hyperref`, compilar y probar una referencia a sección y otra a figura.

### Página 4 — Mantener la función sin decorar en exceso

- **Tipo:** Criterio de diseño.
- **Contenido:** La plataforma puede usar una configuración visual discreta; el objetivo de la lección es la navegación, no personalizar colores.

## Subsección 13.9. Referencias inteligentes con `cleveref`

### Página 1 — Incorporar `cleveref`

- **Tipo:** Teoría breve.
- **Nuevo:** Paquete `cleveref`.
- **Código:**

```latex
\usepackage{hyperref}
\usepackage{cleveref}
```

- **Orden:** Después de `hyperref`.

### Página 2 — `\cref` y `\Cref`

- **Tipo:** Teoría breve.
- **Nuevo:** Referencia que reconoce el tipo de objeto.
- **Contenido:** `\cref` se usa dentro de una oración; `\Cref` puede iniciar una.

### Página 3 — Citar objetos diferentes

- **Tipo:** Práctica acumulativa.
- **Actividad:** Citar una ecuación, una tabla y una figura con `\cref`.

### Página 4 — Comparar `\ref` y `\cref`

- **Tipo:** Ejercicio.
- **Actividad:** Elegir el comando más conveniente para cuatro frases.

## Subsección 13.10. Reto integrador de referencias

### Página 1 — Red de referencias

- **Tipo:** Reto.
- **Actividad:** Crear un documento con una sección, una ecuación, una tabla y una figura; etiquetar y citar los cuatro objetos.

### Página 2 — Cambiar el orden del documento

- **Tipo:** Práctica acumulativa.
- **Actividad:** Mover la figura antes de la tabla y añadir una ecuación.
- **Criterio de éxito:** Todas las referencias siguen siendo correctas.

### Página 3 — Depuración de etiquetas

- **Tipo:** Depuración.
- **Editor inicial:** Dos etiquetas duplicadas, una referencia mal escrita y un `label` antes de `caption`.
- **Criterio de éxito:** No aparecen advertencias de etiquetas duplicadas ni referencias indefinidas.

---

# Sección 14. Bibliografía básica

## Objetivo de la sección

Crear una bibliografía breve dentro del mismo archivo, registrar fuentes y citarlas de forma automática.

## Subsección 14.1. El entorno `thebibliography`

### Página 1 — Bibliografía integrada

- **Tipo:** Teoría breve.
- **Nuevo:** `thebibliography`.
- **Contenido:** Adecuado para documentos pequeños sin gestor externo.

### Página 2 — El argumento de ancho

- **Tipo:** Teoría breve.
- **Nuevo:** Significado de `{9}` o `{99}`.
- **Contenido:** Reserva espacio para la etiqueta más ancha esperada.

### Página 3 — Crear el entorno al final

- **Tipo:** Práctica guiada.
- **Actividad:** Añadir una bibliografía vacía antes de `\end{document}`.

## Subsección 14.2. Entradas con `\bibitem`

### Página 1 — Clave y datos de la fuente

- **Tipo:** Teoría breve.
- **Nuevo:** `\bibitem{clave}`.
- **Idea clave:** La clave es interna, única y breve.

### Página 2 — Registrar un libro

- **Tipo:** Práctica guiada.
- **Actividad:** Crear una entrada para un libro de cálculo.

### Página 3 — Registrar un artículo

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir una segunda entrada con revista, volumen y páginas.

### Página 4 — Elegir claves útiles

- **Tipo:** Ejercicio.
- **Actividad:** Elegir las claves más claras entre varias alternativas.

## Subsección 14.3. Citas con `\cite`

### Página 1 — Conectar texto y bibliografía

- **Tipo:** Teoría breve.
- **Nuevo:** `\cite`.

### Página 2 — Citar una fuente

- **Tipo:** Práctica guiada.
- **Actividad:** Añadir una cita al libro registrado.

### Página 3 — Citar varias fuentes

- **Tipo:** Teoría breve.
- **Nuevo:** Varias claves en una cita.
- **Ejemplo:** `\cite{clave1,clave2}`.

### Página 4 — Párrafo con dos citas

- **Tipo:** Práctica acumulativa.
- **Actividad:** Redactar un párrafo que cite el libro y el artículo.

## Subsección 14.4. Formato de referencias

### Página 1 — Datos de un libro

- **Tipo:** Teoría breve.
- **Contenido:** Autor, año, título en cursiva y editorial.

### Página 2 — Datos de un artículo

- **Tipo:** Teoría breve.
- **Contenido:** Autor, año, título, revista en cursiva, volumen, número y páginas.

### Página 3 — Caracteres especiales en referencias

- **Tipo:** Aplicación.
- **Reutiliza:** `\&` y formato de texto.
- **Actividad:** Escribir correctamente una editorial con ampersand.

### Página 4 — Unificar dos entradas

- **Tipo:** Práctica editorial.
- **Actividad:** Corregir dos referencias con orden y puntuación inconsistentes.
- **Criterio de éxito:** Ambas siguen una misma convención.

## Subsección 14.5. Citas y referencias internas

### Página 1 — Dos sistemas distintos

- **Tipo:** Comparación.
- **Nuevo:** Diferencia conceptual.
- **Contenido:**
  - `\ref` conecta objetos del documento.
  - `\cite` conecta afirmaciones con fuentes.
- **Idea clave:** Una etiqueta interna y una clave bibliográfica no cumplen la misma función.

### Página 2 — Elegir `\ref` o `\cite`

- **Tipo:** Ejercicio.
- **Actividad:** Elegir el comando adecuado para seis frases.

### Página 3 — Párrafo académico combinado

- **Tipo:** Práctica acumulativa.
- **Actividad:** Citar una ecuación mediante `\eqref` y una fuente mediante `\cite` en el mismo párrafo.

## Subsección 14.6. Reto bibliográfico

### Página 1 — Bibliografía de dos fuentes

- **Tipo:** Reto.
- **Actividad:** Crear una bibliografía con un libro y un artículo sin copiar un bloque completo.

### Página 2 — Texto con citas

- **Tipo:** Reto acumulativo.
- **Actividad:** Redactar dos párrafos y usar al menos una cita en cada uno.

### Página 3 — Depuración bibliográfica

- **Tipo:** Depuración.
- **Editor inicial:** Cita a una clave inexistente, dos claves duplicadas y bibliografía colocada después de `\end{document}`.
- **Criterio de éxito:** Todas las citas se resuelven.

---

# Sección 15. Proyecto final: una tarea académica completa

## Objetivo de la sección

Construir un documento desde una plantilla limpia, seleccionar solo los paquetes necesarios e integrar los conocimientos del curso sin volver a explicar cada comando.

## Subsección 15.1. Definir el producto final

### Página 1 — Requisitos mínimos

- **Tipo:** Presentación del proyecto.
- **El documento debe incluir:**
  - Clase `article`.
  - Configuración en español.
  - Título, autor, fecha y resumen.
  - Índice.
  - Tres secciones y al menos dos subsecciones.
  - Formato de texto.
  - Una lista anidada.
  - Matemáticas en línea y en bloque.
  - Una ecuación numerada.
  - Una tabla académica.
  - Una figura.
  - Una nota al pie.
  - Referencias internas.
  - Dos fuentes bibliográficas.

### Página 2 — Elegir un tema

- **Tipo:** Decisión.
- **Opciones:** Matemática, estadística, física, informática u otro tema académico.
- **Actividad:** Escribir título, objetivo y tres apartados posibles.

### Página 3 — Crear un esquema

- **Tipo:** Planificación.
- **Actividad:** Ordenar los bloques principales antes de escribir código.
- **Criterio de éxito:** El esquema distingue preámbulo, contenido y bibliografía.

## Subsección 15.2. Seleccionar paquetes

### Página 1 — Paquetes obligatorios por necesidad

- **Tipo:** Ejercicio.
- **Actividad:** Relacionar cada requisito del proyecto con el paquete que lo permite.

### Página 2 — Construir el preámbulo

- **Tipo:** Práctica acumulativa.
- **Selección esperada:** Paquetes de español, `amsmath`, `amssymb`, `booktabs`, `graphicx`, `hyperref`.
- **Opcionales según contenido:** `amsthm`, `multirow`, `subcaption`, `cleveref`.
- **Idea clave:** No cargar un paquete opcional si no se usa.

### Página 3 — Declaraciones propias

- **Tipo:** Práctica.
- **Actividad:** Añadir metadatos y, si hace falta, comandos o entornos propios.

### Página 4 — Comprobar el preámbulo

- **Tipo:** Punto de control.
- **Actividad:** Compilar un cuerpo vacío antes de continuar.
- **Criterio de éxito:** No hay errores de paquetes ni declaraciones.

## Subsección 15.3. Construir la estructura

### Página 1 — Título y resumen

- **Tipo:** Práctica acumulativa.
- **Actividad:** Generar el encabezado y escribir un resumen de dos o tres oraciones.

### Página 2 — Índice y secciones

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear el índice, tres secciones y dos subsecciones.

### Página 3 — Redacción principal

- **Tipo:** Producción.
- **Actividad:** Escribir al menos dos párrafos por sección usando formato con moderación.

### Página 4 — Lista de objetivos o resultados

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir una lista numerada con subpuntos.

## Subsección 15.4. Integrar matemáticas

### Página 1 — Expresión en línea y fórmula en bloque

- **Tipo:** Práctica acumulativa.
- **Actividad:** Introducir una variable dentro de un párrafo y destacar una fórmula relacionada.

### Página 2 — Desarrollo matemático

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir un desarrollo de al menos dos líneas mediante `align*`.

### Página 3 — Ecuación numerada y referencia

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear una ecuación con `label` y citarla con `eqref`.

### Página 4 — Elemento avanzado opcional

- **Tipo:** Elección.
- **Opciones:** Matriz, función por partes, teorema o integral múltiple.
- **Criterio de éxito:** Se reutilizan únicamente herramientas ya aprendidas.

## Subsección 15.5. Integrar una tabla

### Página 1 — Diseñar los datos

- **Tipo:** Planificación.
- **Actividad:** Definir encabezados y dos o más filas.

### Página 2 — Construir `tabular`

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear la rejilla con alineaciones adecuadas.

### Página 3 — Aplicar `booktabs`

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir reglas académicas sin líneas verticales.

### Página 4 — Convertirla en flotante

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir `table`, leyenda, etiqueta y referencia desde el texto.

## Subsección 15.6. Integrar una figura

### Página 1 — Elegir y dimensionar el recurso

- **Tipo:** Práctica.
- **Actividad:** Insertar una imagen disponible con un ancho apropiado.

### Página 2 — Crear la figura

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir contenedor, centrado y leyenda.

### Página 3 — Etiquetar y citar

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir `label` y una mención mediante `ref` o `cref`.

### Página 4 — Panel opcional

- **Tipo:** Extensión.
- **Actividad:** Crear dos subfiguras solo si el tema requiere una comparación.

## Subsección 15.7. Añadir notas y bibliografía

### Página 1 — Nota pertinente

- **Tipo:** Práctica acumulativa.
- **Actividad:** Añadir una nota que amplíe información sin interrumpir el párrafo.

### Página 2 — Registrar dos fuentes

- **Tipo:** Práctica acumulativa.
- **Actividad:** Crear un libro y un artículo mediante `\bibitem`.

### Página 3 — Citar las fuentes

- **Tipo:** Práctica acumulativa.
- **Actividad:** Usar ambas claves dentro del contenido.

### Página 4 — Verificar claves

- **Tipo:** Revisión.
- **Actividad:** Comprobar que no existen citas ni referencias indefinidas.

## Subsección 15.8. Revisión por capas

### Página 1 — Revisar estructura

- **Comprobaciones:**
  - Clase y paquetes en el preámbulo.
  - Entornos correctamente cerrados.
  - Contenido antes de `\end{document}`.

### Página 2 — Revisar contenido

- **Comprobaciones:**
  - Jerarquía de secciones coherente.
  - Párrafos legibles.
  - Fórmulas con delimitadores correctos.
  - Tabla y figura con función real.

### Página 3 — Revisar automatizaciones

- **Comprobaciones:**
  - Índice actualizado.
  - Ecuaciones, tablas y figuras numeradas.
  - Referencias sin `??`.
  - Citas con claves existentes.

### Página 4 — Revisar paquetes

- **Comprobaciones:**
  - Cada paquete cargado se utiliza.
  - No faltan paquetes para comandos empleados.
  - `hyperref` y `cleveref` conservan el orden adecuado si se usan.

## Subsección 15.9. Depuración final

### Página 1 — Primer error de compilación

- **Tipo:** Procedimiento.
- **Actividad:** Localizar el primer error mostrado, corregirlo y volver a compilar antes de atender errores posteriores.

### Página 2 — Errores frecuentes

- **Lista breve:**
  - Llaves sin pareja.
  - Entornos mal cerrados.
  - Archivo de imagen inexistente.
  - Comando de paquete no cargado.
  - Cantidad incorrecta de columnas.
  - Etiqueta mal escrita.

### Página 3 — Documento compila, pero no está listo

- **Tipo:** Revisión visual.
- **Actividad:** Verificar tamaño de imágenes, claridad de tablas, exceso de énfasis y orden de apartados.

### Página 4 — Reto de reparación

- **Tipo:** Evaluación.
- **Editor inicial:** Versión del proyecto con cinco errores de categorías distintas.
- **Criterio de éxito:** Compila y conserva todos los requisitos.

## Subsección 15.10. Entrega

### Página 1 — Archivos finales

- **Tipo:** Lista de entrega.
- **Contenido:** Archivo `.tex`, recursos utilizados y PDF compilado.

### Página 2 — Comprobación autónoma

- **Tipo:** Lista final.
- **Actividad:** Marcar cada requisito del proyecto antes de entregar.

### Página 3 — Resultado esperado

- **Tipo:** Cierre.
- **Contenido:** El estudiante puede partir de una plantilla base y construir una tarea académica estructurada sin repetir instrucciones línea por línea.

---

# Mapa de progresión acumulativa

| Conocimiento introducido | Se presenta por primera vez | Se reutiliza después |
|---|---|---|
| Flujo `.tex` → compilación → PDF | Sección 1 | Todo el curso |
| Documento mínimo | Sección 2 | Todas las prácticas |
| Preámbulo y cuerpo | Sección 2 | Paquetes, metadatos y comandos propios |
| Paquetes de español | Sección 3 | Todas las secciones posteriores |
| Metadatos y título | Sección 4 | Proyectos acumulativos |
| Secciones e índice | Sección 5 | Tablas, figuras, referencias y proyecto final |
| Formato de texto | Sección 6 | Listas, soluciones y redacción académica |
| Listas | Sección 7 | Proyecto final |
| Notación matemática elemental | Sección 8 | Operadores, matrices, soluciones y teoremas |
| `amssymb` | Sección 8.7 | Conjuntos, probabilidad y fuentes matemáticas |
| `amsmath` | Sección 8.10 | Alineaciones, casos, matrices y referencias de ecuaciones |
| Redacción matemática | Sección 9 | Proyecto final |
| `amsthm` | Sección 9.4 | Teoremas y demostraciones |
| Tablas | Sección 10 | Notas, referencias y proyecto final |
| Imágenes | Sección 11 | Referencias y proyecto final |
| Notas al pie | Sección 12 | Proyecto final |
| Etiquetas y referencias | Sección 13 | Todo objeto numerado del proyecto final |
| Bibliografía | Sección 14 | Proyecto final |

## Resultado pedagógico esperado

Al finalizar el curso, el estudiante debe ser capaz de:

- Crear un documento académico desde una plantilla base.
- Seleccionar una clase y cargar únicamente los paquetes necesarios.
- Organizar contenido mediante una jerarquía coherente.
- Escribir texto, listas y notación matemática.
- Incorporar tablas, figuras y notas.
- Utilizar numeración, referencias y bibliografía automáticas.
- Identificar y corregir errores básicos de estructura, sintaxis y dependencias.
- Reutilizar conocimientos anteriores para resolver tareas más complejas sin tratarlos como contenidos nuevos.

# Resumen cuantitativo de la versión escalonada

| Sección | Subsecciones | Páginas |
|---|---:|---:|
| 1. Introducción a LaTeX | 3 | 13 |
| 2. Primer documento y sintaxis esencial | 5 | 18 |
| 3. Paquetes necesarios para escribir en español | 5 | 13 |
| 4. Datos principales y resumen | 5 | 13 |
| 5. Organización del contenido | 5 | 15 |
| 6. Escritura y formato de texto | 8 | 25 |
| 7. Listas | 5 | 14 |
| 8. Escritura matemática progresiva | 22 | 87 |
| 9. Redacción matemática y entornos formales | 7 | 27 |
| 10. Tablas | 8 | 31 |
| 11. Imágenes y figuras | 7 | 25 |
| 12. Notas al pie | 5 | 15 |
| 13. Referencias internas y enlaces | 10 | 35 |
| 14. Bibliografía básica | 6 | 21 |
| 15. Proyecto final: una tarea académica completa | 10 | 38 |
| **Total** | **111** | **390** |

## Lectura de las cifras

- El total incluye teoría, prácticas guiadas, ejercicios acumulativos, retos y páginas de depuración.
- La ruta principal puede limitarse a teoría y práctica guiada.
- Las páginas adicionales permiten reforzar el aprendizaje sin volver a enseñar los conceptos como si fueran nuevos.

## Comprobación de progresión

- El primer documento compilable aparece únicamente en la Sección 2.
- La introducción no adelanta la plantilla mínima.
- Los comandos de formato se presentan por primera vez en la Sección 6.
- Los paquetes matemáticos se incorporan dentro de la Sección 8 cuando aparece la necesidad correspondiente.
- Las etiquetas y referencias se enseñan una sola vez en la Sección 13 y luego se aplican a objetos conocidos.
- Los retos reutilizan contenidos previos y no añaden dependencias ocultas.
