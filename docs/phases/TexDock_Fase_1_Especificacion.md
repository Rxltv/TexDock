# TexDock — Especificación de la Fase 1

## 1. Objetivo de la Fase 1

Construir el curso básico completo de LaTeX dentro de TexDock, transformando el laboratorio matemático aislado de la Fase 0 en una experiencia educativa navegable, estructurada y autónoma. La Fase 1 debe entregar una versión pública funcional sin depender de backend, cuentas de usuario ni infraestructura externa.

## 2. Resultado esperado

Al cerrar la Fase 1, TexDock será un sitio web estático con:

- Un curso básico de LaTeX compuesto por 15 secciones.
- Navegación lineal y desbloqueo progresivo de secciones.
- Lecciones internas dentro de cada sección, con teoría breve y ejemplos.
- Un ejercicio integrador obligatorio al final de cada sección.
- Editor CodeMirror con resaltado de sintaxis y números de línea.
- Biblioteca con dos plantillas descargables simbólicamente.
- Renderizado matemático con KaTeX.
- Despliegue público.
- GitHub Actions ejecutando `npm run validate`.

## 3. Alcance incluido

- Curso básico completo (15 secciones).
- CodeMirror como editor (resaltado de sintaxis y números de línea; sin cierre automático de llaves inicialmente).
- Navegación pública (Inicio, Aprender, Biblioteca, Acerca de, GitHub).
- Ruta lineal con desbloqueo progresivo (primera sección siempre disponible).
- Lecciones y ejercicios integradores por sección.
- Renderizado educativo con KaTeX, HTML y MathML.
- Biblioteca pública con categoría "Plantillas" y dos plantillas iniciales (tarea académica, apuntes de clase); permiten copiar código, no descargar archivos.
- Progreso local mediante IndexedDB con Dexie (estados de avance y desbloqueo; no guarda código incompleto de ejercicios).
- Versión pública desplegable como sitio estático.
- GitHub Actions para ejecutar `npm run validate`.
- Preparación documental para la Fase 1.

## 4. Funciones excluidas

- Cuentas de usuario, registro o inicio de sesión.
- Backend, base de datos, Django o PostgreSQL.
- Colaboración en tiempo real.
- Compilación LaTeX real ni generación de PDF.
- Editor libre de documentos completos (no es un clon de Overleaf).
- Inteligencia artificial generativa.

## 5. Navegación pública

El sitio contará con las siguientes secciones de navegación:

| Ruta          | Descripción                                      |
| :------------ | :----------------------------------------------- |
| `/`           | Inicio — portada del proyecto                    |
| `/aprender`   | Curso básico — listado de secciones              |
| `/biblioteca` | Biblioteca — plantillas y referencia rápida      |
| `/acerca`     | Acerca de — información del proyecto             |
| —             | Enlace externo a GitHub                          |

La ruta del curso será lineal. No habrá un panel de administración ni rutas protegidas.

## 6. Estructura general del curso básico

Cada sección contendrá:

- Una o más lecciones internas (páginas o subsecciones dentro de la sección).
- Un ejercicio integrador obligatorio al final de la sección.
- Ejemplos interactivos que utilicen el laboratorio de la Fase 0 cuando sea pertinente.

Las subsecciones del temario no tienen que convertirse automáticamente en lecciones separadas; el autor puede agrupar varios conceptos en una misma lección si tiene sentido pedagógico.

## 7. Lista de secciones

Las 15 secciones del curso básico son:

| #  | Sección                                               |
| –: | :---------------------------------------------------- |
| 1  | Introducción a LaTeX                                  |
| 2  | Estructura mínima de un documento                     |
| 3  | Introducción a los paquetes                           |
| 4  | Datos principales del documento                       |
| 5  | Organización del contenido                            |
| 6  | Escritura de texto                                    |
| 7  | Listas                                                |
| 8  | Introducción al modo matemático                       |
| 9  | Escritura matemática básica                           |
| 10 | Tablas                                                |
| 11 | Imágenes                                              |
| 12 | Notas al pie                                          |
| 13 | Referencias internas                                  |
| 14 | Bibliografía básica                                   |
| 15 | Elaboración de una tarea completa                     |

### Nota sobre la Sección 3 (Introducción a los paquetes)

En esta sección se explica conceptualmente qué son los paquetes y cómo se cargan con `\usepackage`. Los paquetes concretos (`amsmath`, `amssymb`, `graphicx`, `geometry`, etc.) se introducirán más adelante, en las secciones donde sean necesarios por primera vez.

## 8. Reglas sobre el orden y desbloqueo del curso

- La ruta del curso es lineal: se avanza en orden numérico de secciones.
- La Sección 1 está siempre disponible desde el inicio.
- Todos los ejercicios obligatorios de una lección deben completarse para desbloquear la siguiente lección dentro de la misma sección.
- El ejercicio integrador de una sección debe completarse para desbloquear la siguiente sección.
- Las lecciones ya desbloqueadas pueden repasarse libremente.
- No existe la opción de saltar secciones ni de desbloqueo manual.
- El progreso se almacena localmente mediante IndexedDB con Dexie. Guarda estados de avance y desbloqueo; no guarda código incompleto de ejercicios.

## 9. Decisiones pendientes

Las siguientes decisiones se completarán durante la implementación de la Fase 1:

- Formato y estructura de las lecciones internas (archivos Markdown, Astro content collections, etc.).
- Diseño visual de la página del curso, la navegación entre lecciones y el ejercicio integrador.
- Implementación del ejercicio integrador: tipología (opción múltiple, escritura de código, arrastrar y soltar, etc.) y sistema de validación.
- Estrategia de pruebas para el nuevo contenido y la navegación.
- Criterios de cierre específicos de la Fase 1.

## 10. Modelo pedagógico de una lección

Cada lección sigue una secuencia alternada de teoría y práctica:

1. Teoría breve.
2. Ejemplo.
3. Ejercicio.
4. Nueva explicación breve.
5. Nuevo ejercicio.
6. Preguntas conceptuales.
7. Ejercicios generales.
8. Cierre.

Principio rector: poca teoría → práctica → poca teoría → práctica.

Cada lección contiene normalmente 2 o 3 ejercicios, según la densidad del contenido.

Las pequeñas subpartes de una lección no aparecen en el panel lateral de navegación.

Todos los ejercicios obligatorios de una lección deben completarse para desbloquear la siguiente lección.

Cada sección termina con un ejercicio integrador obligatorio.

## 11. Ejemplos, ejercicios y soluciones

### Ejemplos

Los ejemplos pueden ser editables para que el estudiante experimente.

Deben permitir:

- copiar el código al portapapeles;
- limpiar el editor (restablecer a vacío);
- restaurar el código inicial del ejemplo.

La vista previa del ejemplo se actualiza automáticamente al escribir.

No hay botón general de renderizar ni atajo Ctrl + Enter para renderizar.

### Ejercicios

Cada ejercicio tiene un botón **"Comprobar respuesta"** que ejecuta la validación.

Cada ejercicio también tiene un botón **"Ver solución"**.

La solución:

- está disponible desde el inicio (no es necesario fallar para verla);
- se muestra en un área aparte del editor;
- no reemplaza el código que el usuario haya escrito;
- no completa automáticamente el ejercicio;
- puede copiarse al portapapeles.

No se implementa un sistema de pistas progresivas ni condicionales.

Cada tipo de ejercicio puede tener hasta 5 variantes similares que se reutilizan cíclicamente para ofrecer algo de variedad sin multiplicar el contenido.

## 12. Reglas de validación

La validación de ejercicios debe cumplir:

- ignorar espacios irrelevantes (múltiples espacios, espacios alrededor de comandos);
- ignorar saltos de línea e indentación irrelevantes;
- exigir la presencia del comando enseñado (p. ej., si se enseña `\frac`, escribir `0.5` no debe considerarse correcto);
- comprobar argumentos relevantes sin exigir una coincidencia literal exacta;
- mostrar retroalimentación pedagógica que indique qué falta o qué está mal;
- no depender de una comparación literal contra una cadena fija.

Durante la Fase 1 se utiliza una **solución pedagógica canónica** como referencia. No se admiten métodos alternativos que eviten practicar el comando solicitado.

No hay:

- nota numérica;
- estrellas ni medallas;
- ranking entre estudiantes;
- penalización por número de intentos.

Estados de una lección:

| Estado       | Significado                                           |
| :----------- | :---------------------------------------------------- |
| Bloqueado    | No accesible hasta completar la lección anterior      |
| Disponible   | Accesible pero no se ha empezado a trabajar           |
| En progreso  | Se ha empezado pero faltan ejercicios por completar   |
| Completado   | Todos los ejercicios obligatorios están correctos     |

## 13. Proyecto final de la Sección 15

La Sección 15 es un **proyecto obligatorio** que integra todo lo aprendido.

Utiliza un único editor con el documento completo. El usuario comienza prácticamente desde cero y avanza por pasos guiados:

1. `\documentclass` — elegir y escribir la clase de documento.
2. Preámbulo — cargar paquetes necesarios (`amsmath`, `amssymb`, `graphicx`).
3. Título, autor y fecha — usar `\title`, `\author`, `\date` y `\maketitle`.
4. Organización por secciones — dividir el contenido con `\section`.
5. Texto y formato — párrafos, negrita, cursiva.
6. Listas — enumerada y no enumerada.
7. Matemáticas — al menos una expresión en línea y una en display.
8. Tablas — entorno `tabular`.
9. Imagen proporcionada por TexDock — insertar con `\includegraphics`.
10. Notas al pie — usar `\footnote`.
11. Referencias internas — `\label` y `\ref`.
12. Bibliografía manual — entorno `thebibliography`.
13. Revisión final — verificar que todo compila visualmente.

TexDock valida cada paso conforme se construye. No se puede pasar al siguiente paso hasta que el actual sea correcto.

El resultado se visualiza exclusivamente dentro de TexDock. No se genera PDF ni se descarga el archivo `.tex`.

## 14. Editor educativo

El editor de código de TexDock permite al estudiante escribir y modificar código LaTeX de forma interactiva.

### 14.1. Herramienta base

Se utiliza **CodeMirror** como editor de código. Proporciona:

- Resaltado de sintaxis LaTeX.
- Números de línea visibles siempre.
- Sin cierre automático de llaves (`{`, `}`) en la configuración inicial.
- Sin autocompletado complejo de comandos en la configuración inicial.

### 14.2. Carga diferida

El editor se carga únicamente en las páginas que lo necesitan (lecciones, ejercicios, proyecto final). No se incluye en páginas informativas (Inicio, Acerca de, Biblioteca).

### 14.3. Editabilidad

Los ejemplos pueden editarse para que el estudiante experimente libremente.

### 14.4. Acciones disponibles

| Acción              | Descripción                                          |
| :------------------ | :--------------------------------------------------- |
| Copiar código       | Copia el contenido del editor al portapapeles         |
| Limpiar             | Borra todo el contenido del editor                   |
| Restaurar           | Recupera el código inicial del ejemplo               |

### 14.5. Renderizado

- La vista previa se actualiza automáticamente al escribir en el editor.
- **No** hay un botón general "Renderizar".
- **No** existe el atajo Ctrl + Enter para renderizar.

### 14.6. Ejercicios

Los ejercicios incluyen un botón separado **"Comprobar respuesta"** que ejecuta la validación descrita en la sección 12. Este botón es independiente de las acciones generales del editor.

## 15. Vista previa y renderizado controlado

La vista previa muestra al estudiante el resultado visual de su código LaTeX en tiempo real.

### 15.1. Lenguaje de entrada

El usuario escribe exclusivamente **LaTeX**. No escribe HTML, CSS ni ningún otro lenguaje de marcado.

### 15.2. Motor de renderizado

- **KaTeX** se utiliza para todo el renderizado matemático (expresiones en línea y en display).
- El texto general, listas, tablas y otras estructuras básicas se renderizan mediante un **sistema educativo controlado** que convierte comandos LaTeX permitidos en HTML semántico y MathML seguro.

### 15.3. Limitaciones

- No existe compilación TeX real.
- No se genera PDF.
- El usuario no escribe ni ve HTML.

### 15.4. Comandos no soportados

Cuando un comando o estructura no está disponible en la vista previa, se muestra el mensaje:

> Esta función todavía no está disponible en la vista previa de TexDock.

### 15.5. Seguridad

- El renderizador utiliza una **lista limitada de comandos permitidos**.
- No se acepta HTML arbitrario proveniente del contenido del usuario.
- Todo el contenido se procesa dentro del sistema controlado de renderizado.

## 16. Progreso local

El progreso del estudiante se almacena en el navegador para preservar el avance entre sesiones.

### 16.1. Tecnología de almacenamiento

Se utiliza **IndexedDB** mediante la biblioteca **Dexie**. No existe backend ni base de datos remota durante la Fase 1.

### 16.2. Datos almacenados automáticamente

El sistema guarda automáticamente:

- sección actual;
- lección actual;
- lecciones completadas;
- secciones completadas;
- ejercicios completados;
- fecha de última actualización;
- versión del esquema de almacenamiento;
- indicador de si el aviso de almacenamiento ya fue mostrado al usuario.

### 16.3. Datos no almacenados

- No se guarda código incompleto ni cambios temporales del editor.
- Al volver a un ejercicio, el editor carga el código inicial de ese ejercicio, no el estado anterior.

### 16.4. Acciones sobre el editor

El editor dispone de:

- **Restaurar código inicial**: recupera el código original del ejemplo o ejercicio.
- **Limpiar editor**: borra todo el contenido del editor.

### 16.5. Reinicio del curso

El estudiante puede **reiniciar todo el curso** mediante una acción confirmada. Al reiniciar:

- todas las secciones vuelven al estado bloqueado, excepto la Sección 1 que pasa a disponible;
- todo el progreso almacenado se elimina.

### 16.6. Repaso sin pérdida de estado

El usuario puede repetir contenido ya completado sin perder su estado de avance.

### 16.7. Preparación para migración futura

El diseño conceptual del almacenamiento contempla una futura migración a **PostgreSQL** con cuentas de usuario. No se implementa backend ni sincronización durante la Fase 1.

### 16.8. Aviso inicial

La primera vez que el usuario accede al curso, se muestra el siguiente mensaje:

> El progreso se guarda automáticamente en este navegador. Si borras sus datos o utilizas otro dispositivo, el progreso no estará disponible.

## 17. Navegación y visualización del avance

El curso se navega mediante un panel lateral que muestra todas las secciones y su estado.

### 17.1. Panel lateral

- Panel lateral izquierdo fijo en escritorio.
- Muestra las 15 secciones del curso en orden numérico.

### 17.2. Información mostrada por sección

Cada sección en el panel muestra:

- número de sección;
- título;
- descripción breve;
- estado actual.

### 17.3. Estados de sección

| Estado      | Comportamiento                                               |
| :---------- | :----------------------------------------------------------- |
| Bloqueada   | Muestra título y descripción, pero no puede abrirse          |
| Disponible  | Accesible, no se ha comenzado a trabajar                     |
| En progreso | Se ha empezado pero faltan ejercicios por completar          |
| Completada  | Todos los ejercicios obligatorios y el integrador están correctos |

### 17.4. Lecciones dentro de la sección activa

Dentro de la sección activa se muestra la lista de sus lecciones internas. Las pequeñas subpartes de una lección no aparecen en el panel. Las lecciones ya desbloqueadas pueden repasarse libremente.

### 17.5. Cabecera de progreso

La cabecera del curso muestra:

- barra de progreso visual;
- porcentaje numérico;
- texto indicando "Sección X de 15".

### 17.6. Comportamiento en la página de inicio

El botón de acceso al curso en la landing page se adapta al progreso del estudiante:

| Situación               | Texto del botón              |
| :---------------------- | :--------------------------- |
| Sin progreso            | Comenzar curso básico        |
| Con progreso            | Continuar curso básico       |
| Curso completado        | Repasar curso básico         |

## 18. Biblioteca

La biblioteca es un espacio público e independiente del curso donde los visitantes pueden explorar y copiar recursos LaTeX.

### 18.1. Acceso

- Es pública: no requiere progreso, desbloqueo ni cuenta.
- Está accesible desde la landing page y desde la navegación principal del sitio.

### 18.2. Estructura visual

- Columna izquierda: categorías o etiquetas para filtrar los recursos.
- Cuadrícula a la derecha: tarjetas de recursos correspondientes a la categoría seleccionada.

### 18.3. Tarjeta de recurso

Cada tarjeta muestra:

- vista previa o imagen representativa;
- título del recurso;
- descripción breve;
- acción para abrir o ver el recurso.

### 18.4. Limitaciones de la Fase 1

- No hay buscador.
- No hay filtros avanzados por nivel, paquete ni otros criterios.
- La única categoría inicial obligatoria es **Plantillas**.

## 19. Plantillas iniciales

La biblioteca incluye dos plantillas de documento LaTeX basadas en la clase `article`.

### 19.1. Lista de plantillas

1. **Plantilla de tarea académica** — estructura para la elaboración de trabajos y ejercicios escolares.
2. **Plantilla de apuntes de clase** — estructura para la toma de apuntes organizados durante una clase o tema.

### 19.2. Contenido de cada plantilla

Cada plantilla incluye:

- título;
- descripción;
- vista previa del documento renderizado;
- explicación de su finalidad pedagógica;
- explicación por partes del código fuente:
  - `\documentclass`;
  - paquetes incluidos y su propósito;
  - datos principales (`\title`, `\author`, `\date`);
  - estructura del documento (secciones, subsecciones);
  - cuerpo del documento;
- código completo visible;
- botón para copiar el código al portapapeles.

### 19.3. Funciones excluidas

- No hay descarga de archivos `.tex`.
- No hay descarga de archivos `.txt`.
- No hay subida de plantillas por parte de usuarios.
- No hay comentarios ni valoraciones en las plantillas.
- No hay marketplace ni sistema de intercambio.
- No hay plantillas compuestas por varios archivos.

### 19.4. Disponibilidad

Las plantillas están disponibles para cualquier visitante de la biblioteca, incluso si no ha comenzado el curso básico.

## 20. Diseño visual

El diseño visual de TexDock busca una apariencia minimalista, técnica y educativa, adecuada para un entorno de aprendizaje de LaTeX.

### 20.1. Modos de visualización

TexDock dispone de modo **claro** y modo **oscuro**. El usuario puede alternar entre ambos.

### 20.2. Paleta de colores

- La base visual es **blanco y negro** (fondo, texto, superficies principales).
- No existe un color principal obligatorio (p. ej., no hay un azul corporativo).
- Se utilizan pocos colores de acento con significado funcional:

| Color  | Uso                                                |
| :----- | :------------------------------------------------- |
| Verde  | Respuestas correctas, validación positiva          |
| Rojo   | Errores, validación fallida                        |
| Ámbar  | Advertencias, funciones limitadas o no disponibles |

### 20.3. Estilo general

- Sin gradientes, brillos ni efectos decorativos pesados.
- Interfaz minimalista, rápida y sin ornamentación innecesaria.
- El estilo no debe parecer infantil ni un dashboard empresarial.

### 20.4. Panel lateral del curso

- Fijo en escritorio.
- No plegable.

### 20.5. Cabecera de progreso

La cabecera del curso muestra:

- barra de progreso visual;
- porcentaje numérico;
- texto "Sección X de 15".

### 20.6. Prioridad de dispositivos

La prioridad inicial de diseño es **laptop y escritorio**.

## 21. Accesibilidad y adaptación responsive

TexDock debe ser utilizable por la mayor cantidad de personas posible, incluyendo usuarios de teclado, lectores de pantalla y dispositivos móviles.

### 21.1. Adaptación a móvil

La interfaz debe seguir funcionando en dispositivos móviles, aunque la prioridad principal de la Fase 1 sea escritorio y laptop.

### 21.2. Navegación por teclado

- Toda la interfaz debe ser operable completamente mediante teclado.
- El foco visible debe estar presente en todos los elementos interactivos.

### 21.3. Contraste

El contraste de color debe ser suficiente tanto en modo claro como en modo oscuro, cumpliendo con las pautas WCAG.

### 21.4. Estados no dependientes del color

Los estados (correcto, incorrecto, bloqueado, completado, etc.) no pueden comunicarse únicamente mediante color. Deben incluir texto, iconos o indicadores adicionales.

### 21.5. Regiones dinámicas

Los resultados de validación y los mensajes de error deben usar `aria-live` para que los lectores de pantalla los anuncien automáticamente.

### 21.6. HTML semántico

El contenido debe utilizar HTML semántico (encabezados, listas, tablas, landmarks) para facilitar la navegación por lectores de pantalla.

### 21.7. Matemáticas accesibles

Las expresiones matemáticas se renderizan con HTML y MathML cuando KaTeX lo permita, además de la representación visual.

### 21.8. Movimiento reducido

La interfaz debe respetar la preferencia del sistema `prefers-reduced-motion`, evitando animaciones innecesarias cuando esté activada.

### 21.9. Zoom

El sitio debe soportar zoom del navegador de hasta 200 % sin perder funcionalidad ni superposición de elementos.

### 21.10. Controles accesibles

Los botones Copiar, Limpiar, Restaurar, Comprobar respuesta y Ver solución deben ser controles accesibles reales (`<button>` o `<input>`) con texto identificable, no elementos decorativos ni iconos sin etiqueta.

## 22. Arquitectura del contenido educativo

El contenido del curso se gestiona dentro del repositorio y se separa de los componentes de presentación.

### 22.1. Principios

- El contenido oficial (teoría, ejemplos, ejercicios, soluciones) vive dentro del repositorio Git.
- La teoría no se escribe directamente dentro de componentes React.
- **Astro** genera las páginas estáticas del curso a partir del contenido.
- Se utiliza **Astro Content Collections** para organizar, validar y exponer el contenido.
- La teoría y las explicaciones se escriben en **Markdown o MDX**.
- Los metadatos se definen mediante **frontmatter** o archivos **YAML** independientes.
- Los fragmentos de código LaTeX largos (ejemplos, código inicial, soluciones) residen en **archivos `.tex` separados** y se referencian desde el contenido.
- Cada sección, lección y ejercicio tiene un **identificador estable** que no cambia con reordenaciones.
- El contenido debe poder revisarse mediante **pull requests**.
- Las 15 secciones deben poder evolucionar sin acoplarse a componentes visuales concretos.
- El schema de Content Collections debe permitir añadir nuevas rutas educativas (cursos, tracks) en el futuro sin duplicar la arquitectura.
- No existe contenido dinámico en base de datos ni backend.

### 22.2. Estructura provisional de directorios

La organización inicial propuesta es:

```
content/
└── courses/
    └── basic/
        ├── course.yaml
        └── sections/
            └── 01-introduccion/
                ├── section.yaml
                └── lessons/
                    ├── 01-que-es-latex/
                    │   ├── lesson.yaml
                    │   ├── theory.md
                    │   ├── examples/
                    │   │   └── 01-hola-mundo/
                    │   │       ├── example.yaml
                    │   │       └── initial.tex
                    │   └── exercises/
                    │       └── 01-primer-documento/
                    │           ├── exercise.yaml
                    │           ├── initial.tex
                    │           └── solution.tex
                    └── ...
```

Esta estructura es **provisional** y podrá ajustarse durante la primera implementación vertical de una sección completa. No obliga a crear una carpeta independiente para cada ejemplo o ejercicio. Los ejemplos y ejercicios pequeños podrán declararse directamente en sus metadatos (frontmatter o YAML), mientras que los fragmentos grandes o reutilizables podrán usar archivos `.tex` separados.

## 23. Modelo provisional de una lección

Cada lección se describe mediante un conjunto mínimo de campos que guían su representación y validación.

### 23.1. Campos de una lección

| Campo                  | Tipo     | Descripción                                               |
| :--------------------- | :------- | :-------------------------------------------------------- |
| `id`                   | string   | Identificador único y estable                             |
| `slug`                 | string   | Slug para la URL                                          |
| `title`                | string   | Título de la lección                                      |
| `description`          | string   | Descripción breve                                         |
| `section`              | string   | Sección a la que pertenece (id de sección)                |
| `order`                | number   | Orden dentro de la sección                                |
| `objectives`           | string[] | Objetivos de aprendizaje                                  |
| `prerequisites`        | string[] | Identificadores de lecciones o conceptos previos          |
| `estimatedDuration`    | number?  | Duración estimada en minutos (opcional)                   |
| `theory`               | string   | Contenido teórico (Markdown/MDX)                          |
| `examples`             | Example[]| Lista de ejemplos interactivos                            |
| `exercises`            | Exercise[]| Lista de ejercicios obligatorios                         |
| `integratingExercise`  | Exercise?| Ejercicio integrador (solo en la última lección de la sección) |
| `renderMode`           | enum     | Modo de renderizado (ver 23.3)                            |
| `packages`             | string[] | Paquetes LaTeX utilizados en la lección                   |
| `initialCode`          | string?  | Código inicial del editor (opcional, ruta a `.tex`)       |
| `canonicalSolution`    | string?  | Solución pedagógica canónica (ruta a `.tex`)              |
| `validationRules`      | object   | Reglas de validación específicas de la lección            |
| `status`               | enum     | Estado de publicación (ver 23.2)                          |

### 23.2. Estados de publicación

| Estado     | Significado                                                 |
| :--------- | :---------------------------------------------------------- |
| `draft`    | En desarrollo, no visible en producción                     |
| `published`| Visible y navegable en el curso                             |
| `archived` | Oculto, reemplazado por contenido posterior                 |

### 23.3. Modos de renderizado

| Modo                | Descripción                                                 |
| :------------------ | :---------------------------------------------------------- |
| `KATEX_MATH`        | Renderizado matemático mediante KaTeX dentro del subconjunto compatible |
| `SAFE_LATEX_PREVIEW`| Renderizado educativo controlado: texto, listas, tablas y comandos básicos permitidos |

No existe el modo `ADVANCED_TEX` en la Fase 1 porque no hay compilador LaTeX real ni generación de PDF.

## 24. Modelos provisionales de ejemplos y ejercicios

### 24.1. Modelo de ejemplo

Cada ejemplo se describe mediante los siguientes campos:

| Campo            | Tipo     | Descripción                                               |
| :--------------- | :------- | :-------------------------------------------------------- |
| `id`             | string   | Identificador único y estable                             |
| `title`          | string   | Título del ejemplo                                        |
| `description`    | string   | Descripción breve                                         |
| `order`          | number   | Orden dentro de la lección                                |
| `editable`       | boolean  | Si el usuario puede modificar el código                   |
| `initialCode`    | string?  | Código inicial (inline o ruta a `.tex`)                   |
| `renderMode`     | enum     | Modo de renderizado (23.3)                                |
| `packages`       | string[] | Paquetes LaTeX utilizados                                 |
| `explanation`    | string   | Explicación pedagógica del ejemplo                        |
| `expectedPreview`| string?  | Descripción del resultado pedagógico esperado (opcional)  |
| `actions`        | Action[] | Acciones disponibles                                      |

Las acciones disponibles no son extensibles durante la Fase 1:

- Ejemplo **editable**: `copy`, `clear` y `restore`.
- Ejemplo **demostrativo** o de solo lectura: únicamente `copy` cuando muestre código.

| Acción    | Descripción                                              |
| :-------- | :------------------------------------------------------- |
| `copy`    | Copiar el código al portapapeles                         |
| `clear`   | Limpiar el editor (restablecer a vacío)                  |
| `restore` | Recuperar el código inicial del ejemplo                  |

#### Reglas del ejemplo

- Un ejemplo puede ser **editable** (el usuario experimenta) o **demostrativo** (solo lectura).
- La vista previa se actualiza automáticamente al escribir.
- No tiene botón **Comprobar respuesta**.
- No afecta el progreso del estudiante.
- El código puede estar **inline** en los metadatos o en un **archivo `.tex` separado**.
- `expectedPreview` es exclusivamente **documentación pedagógica**. Describe en lenguaje natural qué debería observar el estudiante. No se utiliza para comparar imágenes ni para validación automática.

### 24.2. Modelo de ejercicio

Cada ejercicio se describe mediante los siguientes campos:

| Campo                | Tipo      | Descripción                                              |
| :------------------- | :-------- | :------------------------------------------------------- |
| `id`                 | string    | Identificador único y estable                            |
| `title`              | string    | Título del ejercicio                                     |
| `description`        | string    | Descripción breve                                        |
| `instructions`       | string    | Instrucciones detalladas para el estudiante              |
| `order`              | number    | Orden dentro de la lección                               |
| `required`           | boolean   | Si es obligatorio para completar la lección              |
| `initialCode`        | string?   | Código inicial (inline o ruta a `.tex`)                  |
| `renderMode`         | enum      | Modo de renderizado (23.3)                               |
| `packages`           | string[]  | Paquetes LaTeX utilizados                                |
| `objective`          | string    | Objetivo pedagógico específico del ejercicio             |
| `canonicalSolution`  | string?   | Solución pedagógica canónica (inline o ruta a `.tex`)    |
| `validationRules`    | object    | Reglas de validación (se definen en un apartado posterior) |
| `variants`           | Variant[] | Variantes del ejercicio (hasta 5)                        |
| `successFeedback`    | string    | Retroalimentación cuando la respuesta es correcta        |
| `solutionExplanation`| string    | Explicación asociada a la solución                       |

#### Reglas del ejercicio

- Los ejercicios con `required: true` cuentan para completar la lección y desbloquear la siguiente.
- Los ejercicios con `required: false` son opcionales y no bloquean el avance.
- En la Fase 1 normalmente hay **2 o 3 ejercicios** por lección.
- Cada tipo de ejercicio puede tener hasta **5 variantes** que se reutilizan cíclicamente.
- Una variante puede cambiar: instrucciones, código inicial, solución pedagógica canónica y valores esperados por las reglas de validación.
- Todas las variantes deben mantener: el mismo objetivo pedagógico, el mismo tipo general de ejercicio y la misma dificultad aproximada.
- El código inicial y la solución pueden estar **inline** o en **archivos `.tex` separados**.
- El botón **Ver solución** está siempre disponible. Ver la solución no completa el ejercicio.
- No hay puntuación, estrellas, medallas ni penalización por intentos.
- **Comprobar respuesta** es una acción exclusiva de los ejercicios; no aparece en los ejemplos.

La estructura interna completa de `validationRules` no se define en este apartado; quedará documentada en una sección posterior.

## 25. Modelo provisional de reglas de validación

### 25.1. Objetivo

Definir un sistema declarativo y pedagógico para validar ejercicios que analice el texto LaTeX escrito por el estudiante sin comparar literalmente todo el código y sin ejecutar un compilador LaTeX real.

### 25.2. Principios

- Las reglas proceden únicamente del contenido oficial del repositorio.
- No se ejecuta código arbitrario.
- La validación analiza el texto LaTeX escrito por el estudiante.
- Debe ignorar espacios, saltos de línea e indentación irrelevantes.
- Debe conservar diferencias que sí tengan valor pedagógico.
- Todas las reglas obligatorias deben cumplirse para completar el ejercicio.
- No hay puntuación parcial durante la Fase 1. El resultado es **correcto** o **todavía incompleto**.
- Cada error debe producir retroalimentación concreta.
- La solución canónica sirve como referencia, pero no se compara como cadena exacta.

### 25.3. Campos provisionales de ValidationRule

| Campo            | Tipo     | Descripción                                              |
| :--------------- | :------- | :------------------------------------------------------- |
| `id`             | string   | Identificador único de la regla                          |
| `type`           | enum     | Tipo de regla (ver 25.5)                                 |
| `required`       | boolean  | Si debe cumplirse obligatoriamente                       |
| `scope`          | enum     | Ámbito del documento donde aplicar la regla (ver 25.4)   |
| `target`         | string   | Comando, entorno, texto o estructura a buscar            |
| `expected`       | any      | Valor esperado (argumentos, contenido, orden)            |
| `arguments`      | object?  | Argumentos o parámetros adicionales de la regla          |
| `normalization`  | string[] | Estrategias de normalización antes de evaluar            |
| `feedback`       | string   | Mensaje de retroalimentación si la regla falla           |
| `orderSensitive` | boolean  | Si el orden relativo de los elementos es relevante       |

### 25.4. Scope (ámbito de aplicación)

| Valor            | Descripción                                              |
| :--------------- | :------------------------------------------------------- |
| `PREAMBLE`       | Sección entre `\documentclass` y `\begin{document}`      |
| `BODY`           | Contenido entre `\begin{document}` y `\end{document}`    |
| `MATH`           | Expresiones matemáticas dentro de delimitadores reconocidos (ver 25.5) |
| `FULL_DOCUMENT`  | El documento completo                                    |

### 25.5. Tipos provisionales de regla

| Tipo                      | Finalidad                                               |
| :------------------------ | :------------------------------------------------------ |
| `REQUIRE_COMMAND`         | Exige la presencia de un comando específico (p. ej., `\frac`) |
| `REQUIRE_ENVIRONMENT`     | Exige el uso de un entorno concreto comprobando tanto `\begin{entorno}` como `\end{entorno}` con el mismo nombre y orden correcto |
| `REQUIRE_ARGUMENT`        | Exige un argumento determinado dentro de un comando (p. ej., `\usepackage{graphicx}` en el preámbulo). Debe poder indicar la **posición** del argumento que se valida (comienza en 1; p. ej., en `\frac{1}{2}` el argumento 1 es el numerador y el 2 el denominador). Cuando un comando aparezca varias veces, la regla puede limitarse mediante `scope`, `target` o contexto |
| `REQUIRE_TEXT`            | Exige la presencia de un texto específico               |
| `REQUIRE_MATH_STRUCTURE`  | Exige una estructura matemática (p. ej., fracción, raíz, subíndice) |
| `REQUIRE_ORDER`           | Exige que un elemento aparezca antes que otro (p. ej., `\label` antes de `\ref`) |
| `REQUIRE_MATCHING_ARGUMENTS` | Exige que los argumentos de dos comandos relacionados coincidan (p. ej., `\label{intro}` y `\ref{intro}`). Debe identificar: primer comando, posición del argumento del primer comando, segundo comando, posición del argumento del segundo comando |
| `FORBID_ALTERNATIVE`      | Impide una alternativa válida en LaTeX pero que evita practicar el comando objetivo (p. ej., usar `0.5` en lugar de `\frac{1}{2}`) |

`FORBID_ALTERNATIVE` es una regla **complementaria y específica**:

- Solo debe usarse para alternativas conocidas y claramente relacionadas con el objetivo del ejercicio.
- No debe intentar enumerar todas las soluciones posibles.
- Nunca debe ser la única regla que determine que una respuesta es correcta.
- Debe combinarse siempre con reglas positivas como `REQUIRE_COMMAND`, `REQUIRE_ARGUMENT` o `REQUIRE_MATH_STRUCTURE`.
- Debe aplicarse únicamente dentro del **scope relevante**. No debe rechazar una respuesta porque el texto prohibido aparezca en un comentario o en una zona no relacionada con el ejercicio. Esta limitación se considera parte del análisis seguro futuro.

#### Ejemplos conceptuales

| Objetivo pedagógico                           | Regla aplicable               |
| :-------------------------------------------- | :---------------------------- |
| Exigir `\frac` con numerador y denominador    | `REQUIRE_COMMAND` + `REQUIRE_ARGUMENT` |
| Exigir el entorno `itemize`                   | `REQUIRE_ENVIRONMENT`         |
| Exigir `\usepackage{graphicx}` en preámbulo   | `REQUIRE_ARGUMENT`, scope `PREAMBLE` |
| Exigir `\label` antes de `\ref`               | `REQUIRE_ORDER`               |
| Exigir que `\label` y `\ref` usen el mismo id | `REQUIRE_MATCHING_ARGUMENTS` |
| Impedir `0.5` cuando el objetivo es `\frac{1}{2}` | `FORBID_ALTERNATIVE`     |

#### Delimitadores reconocidos para scope `MATH`

Durante la Fase 1, el scope `MATH` reconoce únicamente los delimitadores y entornos matemáticos admitidos por el subconjunto educativo de TexDock. Como mínimo debe contemplar:

- `$...$` (matemáticas inline);
- `\(...\)` (matemáticas inline, alternativa);
- `\[...\]` (matemáticas en display).

Los entornos matemáticos adicionales (`equation`, `align`, etc.) se reconocerán solo cuando estén declarados como compatibles por el contenido y el renderizador. No se intenta reconocer toda la gramática matemática de LaTeX.

### 25.6. Normalización

Antes de evaluar las reglas, el código del estudiante podrá normalizarse para eliminar diferencias irrelevantes:

- finales de línea (CR, LF, CRLF → normalizados);
- espacios repetidos → un solo espacio;
- indentación (tabuladores y espacios al inicio de línea);
- espacios alrededor de comandos;
- líneas vacías irrelevantes.

**No debe normalizarse** (no debe eliminarse ni modificarse):

- argumentos de comandos;
- contenido matemático relevante;
- orden cuando `orderSensitive` sea `true`;
- caracteres especiales que formen parte del objetivo pedagógico;
- nombres de labels, citas o archivos.

### 25.7. Resultado de validación

El resultado de la validación es un objeto provisional con:

| Campo              | Tipo        | Descripción                                      |
| :----------------- | :---------- | :----------------------------------------------- |
| `valid`            | boolean     | `true` únicamente cuando todas las reglas con `required: true` se cumplan |
| `completedRules`   | string[]    | Identificadores de las reglas superadas          |
| `failedRules`      | string[]    | Identificadores de las reglas no superadas       |
| `feedbackMessages` | string[]    | Mensajes pedagógicos para el estudiante          |

No incluye nota numérica, porcentaje, estrellas ni medallas.

### 25.8. Variantes

Las variantes de un ejercicio pueden sustituir los valores `expected`, `arguments`, instrucciones, código inicial y solución canónica. No deben cambiar el objetivo pedagógico ni el tipo general de reglas del ejercicio.

### 25.9. Límites de seguridad

- No diseñar todavía un parser LaTeX completo.
- No usar expresiones regulares como única estrategia para todos los casos.
- No ejecutar `pdflatex`, `xelatex`, `lualatex` ni ningún comando del sistema.
- No aceptar reglas creadas por visitantes.
- No implementar código todavía.

## 26. Casos de referencia para la validación

### 26.1. Caso A — Documento mínimo

**Sección relacionada:** 2. Estructura mínima de un documento.

**Objetivo pedagógico:** El estudiante demuestra que conoce la estructura mínima de un documento LaTeX: clase de documento, entorno document, contenido básico.

**Código inicial:**

```latex
\documentclass{article}
\begin{document}

\end{document}
```

**Solución canónica:**

```latex
\documentclass{article}
\begin{document}
Hola, LaTeX
\end{document}
```

#### Reglas conceptuales

| # | Tipo                  | Scope          | target / expected                                | required |
| :-| :-------------------- | :------------- | :----------------------------------------------- | :------- |
| A1| `REQUIRE_COMMAND`     | `PREAMBLE`     | `\documentclass`, argumento con `article`        | sí       |
| A2| `REQUIRE_ENVIRONMENT` | `FULL_DOCUMENT`| `document`                                       | sí       |
| A3| `REQUIRE_TEXT`        | `BODY`         | `Hola, LaTeX`                                    | sí       |
| A4| `REQUIRE_ORDER`       | `FULL_DOCUMENT`| `\documentclass` → `\begin{document}` → contenido → `\end{document}` | sí |

#### Respuestas y resultados

| Respuesta                                    | ¿Aceptada? | Reglas fallidas |
| :------------------------------------------- | :--------- | :-------------- |
| `\documentclass{article}...{Hola, LaTeX}` correcta | Sí | ninguna |
| `\documentclass{article}...{}` (sin texto)   | No         | A3              |
| `\documentclass{report}...{Hola, LaTeX}`     | No         | A1 (clase incorrecta) |
| `...{Hola, LaTeX}` (falta `\documentclass`)  | No         | A1, A4 (incompleto) |
| `\documentclass{article}\begin{document}...\end{document}` luego `Hola` fuera | No | A3 (texto fuera de BODY) |

#### Retroalimentación esperada

| Regla fallida | Retroalimentación |
| :------------ | :---------------- |
| A1            | "El documento debe usar `\documentclass{article}`. Verifica que la clase sea `article`." |
| A2            | "Todo documento LaTeX necesita el entorno `document`. ¿Incluiste `\begin{document}` y `\end{document}`?" |
| A3            | "Escribe el texto 'Hola, LaTeX' dentro del cuerpo del documento." |
| A4            | "Revisa el orden: la clase debe declararse primero, luego el entorno `document`, después el contenido y finalmente el cierre." |

#### Limitaciones conocidas

- No se detecta texto después de `\end{document}` (LaTeX real lo ignora, pero aquí podría pasar desapercibido).

### 26.2. Caso B — Fracción matemática

**Sección relacionada:** 9. Escritura matemática básica.

**Objetivo pedagógico:** El estudiante practica el comando `\frac` en modo matemático para representar un medio (`1/2`).

**Código inicial:**

```latex
Escribe aquí la fracción:
```

**Solución canónica:**

```latex
Escribe aquí la fracción:
$\frac{1}{2}$
```

#### Reglas conceptuales

| # | Tipo                  | Scope  | target / expected                                | required |
| :-| :-------------------- | :----- | :----------------------------------------------- | :------- |
| B1| `REQUIRE_COMMAND`     | `BODY` | `\frac`                                          | sí       |
| B2| `REQUIRE_ARGUMENT`    | `BODY` | `\frac{1}{2}` (argumento 1 = `1`, argumento 2 = `2`) | sí |
| B3| `REQUIRE_MATH_STRUCTURE` | `BODY` | fracción con numerador y denominador          | sí       |
| B4| `FORBID_ALTERNATIVE`  | `BODY` | `0.5` (alternativa conocida)                     | sí       |

Nota: `FORBID_ALTERNATIVE` es complementaria. No reemplaza B1, B2 ni B3. Si el estudiante escribe `0.5` pero también `\frac`, la regla B4 fallaría aunque B1 se cumpla, por lo que `valid` sería `false` hasta que elimine `0.5`.

#### Respuestas y resultados

| Respuesta                              | ¿Aceptada? | Reglas fallidas |
| :------------------------------------- | :--------- | :-------------- |
| `$\frac{1}{2}$`                        | Sí         | ninguna         |
| `$\frac { 1 } { 2 }$`                 | Sí         | ninguna (normalización elimina espacios) |
| `$0.5$`                               | No         | B1, B2, B3, B4  |
| `$\frac{2}{4}$`                       | No         | B2 (argumentos 2 y 4, no 1 y 2) |
| `\frac{1}{2}` (sin modo matemático)    | No         | No se detecta como estructura matemática completa (scope `MATH` no activo) |
| `$\frac{1}{2}$ y también $0.5$`       | No         | B4               |
| `1/2` (sin comando)                   | No         | B1, B2, B3       |

#### Retroalimentación esperada

| Regla fallida | Retroalimentación |
| :------------ | :---------------- |
| B1            | "Usa el comando `\frac{numerador}{denominador}` para escribir la fracción." |
| B2            | "La fracción debe ser `\frac{1}{2}` (numerador 1, denominador 2)." |
| B3            | "Escribe la fracción dentro de modo matemático (`$...$`)." |
| B4            | "Usa `\frac{1}{2}` en lugar de escribir el número decimal. El objetivo es practicar fracciones." |

#### Limitaciones conocidas

- `FORBID_ALTERNATIVE` detectaría `0.5` incluso si el estudiante lo escribe en una nota fuera del objetivo; el scope ayuda a limitarlo, pero el análisis seguro futuro debe excluir comentarios y zonas no relacionadas.

### 26.3. Caso C — Referencia interna

**Sección relacionada:** 13. Referencias internas.

**Objetivo pedagógico:** El estudiante crea una sección con `\label` y la referencia posteriormente con `\ref`, demostrando que comprende el mecanismo de referencias internas.

**Código inicial:**

```latex
\documentclass{article}
\begin{document}

\section{}

\section{}

\end{document}
```

**Solución canónica:**

```latex
\documentclass{article}
\begin{document}

\section{Introducción}
\label{sec:intro}

\section{Desarrollo}
En la sección~\ref{sec:intro} vimos...

\end{document}
```

#### Reglas conceptuales

| # | Tipo                  | Scope   | target / expected                                | required |
| :-| :-------------------- | :------ | :----------------------------------------------- | :------- |
| C1| `REQUIRE_COMMAND`     | `BODY`  | `\section` (al menos dos veces)                  | sí       |
| C2| `REQUIRE_COMMAND`     | `BODY`  | `\label`                                         | sí       |
| C3| `REQUIRE_COMMAND`     | `BODY`  | `\ref`                                           | sí       |
| C4| `REQUIRE_MATCHING_ARGUMENTS` | `BODY`  | primer comando: `\label`, argumento 1; segundo comando: `\ref`, argumento 1; deben coincidir | sí |
| C5| `REQUIRE_ORDER`       | `BODY`  | `\label` debe aparecer antes de `\ref`           | sí       |

#### Respuestas y resultados

| Respuesta                                    | ¿Aceptada? | Reglas fallidas |
| :------------------------------------------- | :--------- | :-------------- |
| `\section{Intro}\label{sec:intro}...\ref{sec:intro}` correcta | Sí | ninguna |
| `\section{Intro}\label{sec:a}...\ref{sec:b}` (ids diferentes) | No | C4             |
| `\section{Intro}\ref{sec:intro}...\label{sec:intro}` (ref antes) | No | C5             |
| `\section{Intro}...\section{...}` (sin label ni ref) | No | C2, C3         |
| `\section{Intro}\label{}...\ref{introduccion}` | No | C4 (id vacío o distinto) |

#### Retroalimentación esperada

| Regla fallida | Retroalimentación |
| :------------ | :---------------- |
| C1            | "El documento debe contener al menos dos secciones con `\section`." |
| C2            | "Usa `\label{nombre}` para marcar la sección a la que quieres referirte." |
| C3            | "Usa `\ref{nombre}` para hacer referencia a una sección marcada con `\label`." |
| C4            | "El identificador en `\label` y `\ref` debe ser el mismo. Revisa que ambos usen el mismo nombre." |
| C5            | "`\label` debe declararse antes de usar `\ref`. Primero marca, después referencia." |

#### Limitaciones conocidas

- `REQUIRE_MATCHING_ARGUMENTS` resuelve la comparación de argumentos entre comandos, pero su implementación concreta necesita definir cómo se extraen el primer y segundo comando y sus argumentos del texto del estudiante.
- El modelo asume que el estudiante usará el mismo identificador en `\label` y `\ref`; si ambos comandos usan un identificador diferente pero coincidente entre sí (p. ej., ambos `sec:uno`), la regla lo aceptaría correctamente.

### 26.4. Conclusiones

#### Tipos de regla validados por los casos

| Tipo                      | Casos donde se aplica |
| :------------------------ | :-------------------- |
| `REQUIRE_COMMAND`         | A, B, C               |
| `REQUIRE_ENVIRONMENT`     | A                     |
| `REQUIRE_ARGUMENT`        | A, B, C               |
| `REQUIRE_TEXT`            | A                     |
| `REQUIRE_MATH_STRUCTURE`  | B                     |
| `REQUIRE_ORDER`           | A, C                  |
| `FORBID_ALTERNATIVE`      | B                     |
| `REQUIRE_MATCHING_ARGUMENTS` | C                  |

Todos los tipos definidos en 25.5 tienen al menos un caso de aplicación.

#### Ambigüedades que continúan abiertas

- **Parser reducido de LaTeX**: el modelo necesita una implementación concreta para extraer comandos y argumentos del texto del estudiante sin un parser completo.
- **Representación de targets**: el formato concreto de `target` y `expected` en cada tipo de regla requiere definirse durante la implementación.
- **Comandos repetidos y anidados**: cuando un comando aparece varias veces o dentro de otros comandos, la regla necesita identificar la ocurrencia relevante.

#### Viabilidad de una implementación vertical limitada

El modelo provisional, con la incorporación de `REQUIRE_MATCHING_ARGUMENTS`, es **suficiente para comenzar** una implementación vertical limitada que abarque los tres casos de referencia.

#### Aspectos que no deben intentarse todavía

- Parser LaTeX completo.
- Validación semántica (p. ej., que una etiqueta esté realmente definida).
- Detección de comandos anidados arbitrarios.
- Expresiones regulares definitivas como implementación del validador.
- Soporte para ejercicios de proyecto (Sección 15) con validación por pasos.

## 27. Tratamiento educativo del preámbulo

### 27.1. Principios pedagógicos

TexDock debe enseñar explícitamente la diferencia entre preámbulo (configuración) y cuerpo (contenido). Cuando sea pedagógicamente relevante, el editor mostrará el preámbulo separado del cuerpo del documento.

### 27.2. Editabilidad del preámbulo

- El preámbulo será **normalmente de solo lectura** en la mayoría de los ejercicios.
- Podrá ser **editable de forma controlada** en las lecciones cuyo objetivo sea aprender `\documentclass`, `\usepackage`, configuración del documento o paquetes.
- No se ofrecerá un preámbulo completamente libre.

### 27.3. Separación de zonas en los ejercicios

- Los ejercicios deben indicar claramente en qué zona debe escribirse el código (preámbulo o cuerpo).
- Los comandos escritos en el cuerpo **no deben validarse** como si estuvieran en el preámbulo, ni a la inversa.
- El proyecto final de la Sección 15 utilizará el documento completo, incluyendo preámbulo y cuerpo.

### 27.4. Modalidades educativas provisionales

| Modalidad              | Descripción                                              |
| :--------------------- | :------------------------------------------------------- |
| `FRAGMENT_ONLY`        | Para practicar un comando o expresión aislada. No representa necesariamente un documento completo. El editor solo muestra el fragmento relevante. |
| `SPLIT_PREAMBLE_BODY`  | Preámbulo y cuerpo visibles en zonas separadas. Una zona puede ser de solo lectura y la otra editable. |
| `FULL_DOCUMENT`        | Un único editor con el documento completo, incluyendo `\documentclass`, preámbulo y cuerpo. Utilizado cuando el objetivo requiere comprender toda la estructura (proyecto final de la Sección 15). |

### 27.5. Transparencia sobre fragmentos

Cuando una lección omita parte del documento (p. ej., en modalidad `FRAGMENT_ONLY`), TexDock debe explicarlo y no hacer creer que el fragmento aislado constituye siempre un archivo `.tex` completo.

### 27.6. Sin implicación de compilación real

Estas modalidades son exclusivamente educativas y no implican compilación LaTeX real.

## 28. Introducción progresiva de paquetes

### 28.1. Enfoque pedagógico

La Sección 3 explica conceptualmente qué es un paquete y cómo se carga mediante `\usepackage`. No será un catálogo aislado de paquetes. Cada paquete concreto se enseñará cuando aparezca una necesidad real en el curso.

### 28.2. Contenido de cada explicación

Cuando se introduzca un paquete, la explicación debe incluir:

- para qué sirve;
- dónde se carga (preámbulo);
- qué comandos o capacidades habilita;
- un ejemplo pequeño;
- errores habituales.

### 28.3. Paquetes previstos para la ruta básica

| Paquete      | Finalidad                                             | Sección de introducción |
| :----------- | :---------------------------------------------------- | :---------------------- |
| `babel`      | Idioma y adaptación básica del documento              | 2 o 3                   |
| `amsmath`    | Estructuras matemáticas avanzadas                     | 8                       |
| `amssymb`    | Símbolos matemáticos adicionales                      | 8 o 9                   |
| `graphicx`   | Inserción de imágenes proporcionadas por TexDock      | 11                      |
| `booktabs`   | Tablas académicas más legibles                        | 10                      |
| `geometry`   | Explicación básica de márgenes y formato de página    | 2 o 4                   |
| `hyperref`   | Enlaces y apoyo a referencias internas                | 13                      |

### 28.4. Reglas de introducción

- La lista de paquetes puede ajustarse según el contenido definitivo.
- No todos los paquetes necesitan una lección independiente.
- Un paquete puede introducirse dentro de la lección donde se utiliza por primera vez.
- TexDock solo admitirá opciones y comandos pertenecientes al subconjunto educativo implementado.
- Mostrar `\usepackage` no significa que exista compilación TeX real.
- Los paquetes no admitidos deben producir el mensaje general de función no disponible en la vista previa (ver sección 15.4).

### 28.5. Paquetes y herramientas excluidos en Fase 1

- `TikZ` y `PGFPlots` — gráficos vectoriales y plotting.
- `BibTeX` y `Biber` — compilación bibliográfica externa.
- `biblatex` — sistema de bibliografía avanzado.
- La bibliografía de la ruta básica utilizará el entorno `thebibliography` en su lugar.

## 29. Mapa pedagógico provisional de las secciones

La asignación de modalidades es **provisional**. Una sección puede utilizar más de una modalidad. La modalidad se decide finalmente por lección, no únicamente por sección. Esta tabla no define todavía el número exacto de lecciones ni obliga a utilizar todas las modalidades en cada sección.

### 29.1. Sección 1 — Introducción a LaTeX

- **Modalidad:** contenido principalmente conceptual; `FRAGMENT_ONLY` cuando exista experimentación con comandos pequeños.
- **Zona editable:** fragmento aislado cuando corresponda.
- **Paquetes nuevos:** ninguno.
- **Resultado:** comprender qué es LaTeX, qué representa un archivo `.tex` y la relación conceptual entre código fuente, compilación y resultado.

### 29.2. Sección 2 — Estructura mínima de un documento

- **Modalidad:** `FULL_DOCUMENT`.
- **Zona editable:** documento completo.
- **Paquetes nuevos:** ninguno.
- **Resultado:** construir un documento con `\documentclass`, preámbulo, `\begin{document}`, cuerpo y `\end{document}`.

### 29.3. Sección 3 — Introducción a los paquetes

- **Modalidad:** `SPLIT_PREAMBLE_BODY`.
- **Zona editable:** principalmente preámbulo controlado.
- **Paquetes nuevos:** ninguno obligatorio como contenido aislado; se enseña el concepto general de `\usepackage`.
- **Resultado:** comprender qué es un paquete, dónde se carga y por qué se utiliza.
- **Precisión:** Puede incluir un ejercicio controlado para colocar correctamente `\usepackage{...}` en el preámbulo. El objetivo es practicar la sintaxis y ubicación de `\usepackage`, no enseñar todavía en profundidad los comandos del paquete usado como ejemplo. El paquete concreto se desarrollará después, en la sección donde resulte necesario.

### 29.4. Sección 4 — Datos principales del documento

- **Modalidad:** `SPLIT_PREAMBLE_BODY`; transición posible a `FULL_DOCUMENT`.
- **Zona editable:** preámbulo y comandos relacionados con `\title`, `\author`, `\date` y `\maketitle`.
- **Paquetes nuevos:** ninguno obligatorio.
- **Resultado:** crear los datos principales y una portada básica de `article`.

### 29.5. Sección 5 — Organización del contenido

- **Modalidad:** `SPLIT_PREAMBLE_BODY`.
- **Zona editable:** cuerpo.
- **Paquetes nuevos:** ninguno obligatorio.
- **Resultado:** utilizar `\section`, `\subsection`, `\subsubsection`, versiones sin numerar y `\tableofcontents`.

### 29.6. Sección 6 — Escritura de texto

- **Modalidad:** `FRAGMENT_ONLY` para prácticas pequeñas; `SPLIT_PREAMBLE_BODY` para ejercicios contextualizados.
- **Zona editable:** cuerpo.
- **Paquetes nuevos:** `babel` se introduce cuando se explique el tratamiento del idioma español.
- **Resultado:** escribir párrafos, saltos, formatos, caracteres especiales y comentarios.

### 29.7. Sección 7 — Listas

- **Modalidad:** `FRAGMENT_ONLY`; `SPLIT_PREAMBLE_BODY` en ejercicios integradores.
- **Zona editable:** cuerpo.
- **Paquetes nuevos:** ninguno obligatorio.
- **Resultado:** construir listas `itemize` y `enumerate`.

### 29.8. Sección 8 — Introducción al modo matemático

- **Modalidad:** `FRAGMENT_ONLY`.
- **Zona editable:** fragmento matemático o cuerpo controlado.
- **Paquetes nuevos:** ninguno obligatorio para los primeros ejemplos.
- **Resultado:** diferenciar matemáticas en línea, display, numeradas y no numeradas.
- **Precisión:** El soporte básico de `$...$`, `\(...\)` y `\[...\]` es un **requisito técnico previo** para implementar esta sección. No es una contradicción pedagógica del mapa.

### 29.9. Sección 9 — Escritura matemática básica

- **Modalidad:** `FRAGMENT_ONLY`; `SPLIT_PREAMBLE_BODY` cuando se necesiten paquetes.
- **Zona editable:** matemáticas y cuerpo.
- **Paquetes nuevos:** `amsmath`; `amssymb`.
- **Resultado:** escribir operaciones, fracciones, raíces, delimitadores, símbolos, funciones, sumas, integrales y límites.

### 29.10. Sección 10 — Tablas

- **Modalidad:** `FRAGMENT_ONLY` para tablas pequeñas; `SPLIT_PREAMBLE_BODY` para el integrador.
- **Zona editable:** cuerpo.
- **Paquetes nuevos:** `booktabs`.
- **Resultado:** crear tablas académicas básicas y legibles.

### 29.11. Sección 11 — Imágenes

- **Modalidad:** `SPLIT_PREAMBLE_BODY`.
- **Zona editable:** preámbulo controlado y cuerpo.
- **Paquetes nuevos:** `graphicx`.
- **Resultado:** insertar imágenes proporcionadas por TexDock mediante `\includegraphics`.

### 29.12. Sección 12 — Notas al pie

- **Modalidad:** `FRAGMENT_ONLY`; `SPLIT_PREAMBLE_BODY` en contexto de documento.
- **Zona editable:** cuerpo.
- **Paquetes nuevos:** ninguno obligatorio.
- **Resultado:** crear y ubicar notas al pie mediante `\footnote`.

### 29.13. Sección 13 — Referencias internas

- **Modalidad:** `FULL_DOCUMENT`.
- **Zona editable:** documento completo o cuerpo con estructura predefinida.
- **Paquetes nuevos:** `hyperref` puede introducirse como mejora contextual y opcional.
- **Resultado:** relacionar elementos mediante `\label` y `\ref` respetando identificadores y orden.
- **Precisión:** `hyperref` será una mejora opcional y contextual. No será necesario para aprender `\label` y `\ref`. No será obligatorio para completar la sección. Su soporte no debe bloquear la implementación inicial de referencias.

### 29.14. Sección 14 — Bibliografía básica

- **Modalidad:** `FULL_DOCUMENT`.
- **Zona editable:** cuerpo y sección bibliográfica.
- **Paquetes nuevos:** ninguno obligatorio.
- **Resultado:** crear una bibliografía manual mediante `thebibliography` y `\bibitem`. No incluir `BibTeX`, `Biber`, `biblatex` ni archivos `.bib`.

### 29.15. Sección 15 — Elaboración de una tarea completa

- **Modalidad:** `FULL_DOCUMENT`.
- **Zona editable:** documento completo.
- **Paquetes:** reutiliza los paquetes enseñados previamente.
- **Resultado:** construir progresivamente una tarea académica completa que integre lo aprendido durante el curso.
- **Precisión sobre `geometry`:** Será opcional. No formará parte de los requisitos obligatorios del proyecto final. Solo se incluirá si el renderizador educativo lo soporta de manera segura y limitada. La falta de soporte de `geometry` no impedirá cerrar la Fase 1.

### 29.16. Tabla resumen

| #  | Sección                                              | Modalidad predominante       | Zona editable               | Paquete nuevo       | Resultado principal                          |
| :- | :--------------------------------------------------- | :--------------------------- | :--------------------------- | :------------------ | :------------------------------------------- |
| 1  | Introducción a LaTeX                                 | Conceptual / `FRAGMENT_ONLY` | Fragmento aislado            | —                   | Comprender el ecosistema LaTeX               |
| 2  | Estructura mínima de un documento                    | `FULL_DOCUMENT`              | Documento completo           | —                   | Construir la estructura mínima               |
| 3  | Introducción a los paquetes                          | `SPLIT_PREAMBLE_BODY`        | Preámbulo controlado         | —                   | Comprender el concepto de paquete            |
| 4  | Datos principales del documento                      | `SPLIT_PREAMBLE_BODY`        | Preámbulo                    | —                   | Crear título, autor, fecha y portada         |
| 5  | Organización del contenido                           | `SPLIT_PREAMBLE_BODY`        | Cuerpo                       | —                   | Usar secciones y subsecciones                |
| 6  | Escritura de texto                                   | `FRAGMENT_ONLY` / `SPLIT_PREAMBLE_BODY` | Cuerpo        | `babel`             | Escribir párrafos con formato               |
| 7  | Listas                                               | `FRAGMENT_ONLY` / `SPLIT_PREAMBLE_BODY` | Cuerpo        | —                   | Construir listas enumeradas y no enumeradas  |
| 8  | Introducción al modo matemático                      | `FRAGMENT_ONLY`              | Fragmento matemático         | —                   | Diferenciar modos matemáticos                |
| 9  | Escritura matemática básica                          | `FRAGMENT_ONLY` / `SPLIT_PREAMBLE_BODY` | Matemáticas    | `amsmath`, `amssymb`| Escribir expresiones matemáticas diversas    |
| 10 | Tablas                                               | `FRAGMENT_ONLY` / `SPLIT_PREAMBLE_BODY` | Cuerpo        | `booktabs`          | Crear tablas académicas                      |
| 11 | Imágenes                                             | `SPLIT_PREAMBLE_BODY`        | Preámbulo y cuerpo           | `graphicx`          | Insertar imágenes                            |
| 12 | Notas al pie                                         | `FRAGMENT_ONLY` / `SPLIT_PREAMBLE_BODY` | Cuerpo        | —                   | Crear notas al pie                           |
| 13 | Referencias internas                                 | `FULL_DOCUMENT`              | Documento completo           | `hyperref` (opcional)   | Relacionar elementos con label y ref      |
| 14 | Bibliografía básica                                  | `FULL_DOCUMENT`              | Cuerpo y sección bibliográfica | —                 | Crear bibliografía con `thebibliography`     |
| 15 | Elaboración de una tarea completa                    | `FULL_DOCUMENT`              | Documento completo           | Reutiliza anteriores; `geometry` opcional | Integrar todo lo aprendido                  |

## 30. Estrategia de pruebas

### 30.1. Pruebas unitarias

Cubren la lógica aislada de cada módulo:

- normalización de código LaTeX (espacios, indentación, finales de línea);
- cada tipo de regla de validación (`REQUIRE_COMMAND`, `REQUIRE_ARGUMENT`, etc.);
- extracción reducida de comandos y argumentos del texto del estudiante;
- cálculo de progreso a partir de ejercicios completados;
- desbloqueo de lecciones y secciones según reglas del curso;
- selección cíclica de variantes de ejercicios;
- persistencia y migración del progreso local en IndexedDB.

### 30.2. Pruebas de componentes

Verifican el comportamiento visual e interactivo de cada componente de forma aislada:

- editor CodeMirror (renderizado, sincronización con el estado);
- vista previa (actualización automática, mensaje de función no disponible);
- mensajes de error y retroalimentación de validación;
- botón **Comprobar respuesta**;
- botón **Ver solución**;
- acciones Copiar, Limpiar y Restaurar;
- panel lateral de navegación;
- barra de progreso y cabecera del curso;
- aviso inicial de almacenamiento local.

### 30.3. Pruebas de integración

Cubren los flujos que conectan múltiples componentes y capas:

- contenido → editor → validación → actualización de progreso;
- finalización de todos los ejercicios obligatorios de una lección;
- desbloqueo automático de la siguiente lección;
- finalización del ejercicio integrador de una sección;
- desbloqueo automático de la siguiente sección;
- restauración del progreso al recargar la página;
- reinicio completo del curso y verificación de estado inicial.

### 30.4. Pruebas de contenido

Validan la integridad del contenido educativo durante el build:

- identificadores únicos en secciones, lecciones, ejemplos y ejercicios;
- órdenes numéricos válidos sin saltos ni duplicados;
- referencias a archivos `.tex` existentes;
- soluciones canónicas presentes cuando una regla las requiera;
- reglas obligatorias definidas correctamente;
- paquetes declarados coinciden con los permitidos;
- modos de renderizado válidos según los definidos en 23.3;
- ausencia de secciones o lecciones huérfanas (sin relación con el curso).

### 30.5. Pruebas de accesibilidad

Verifican el cumplimiento de los requisitos definidos en la sección 21:

- navegación completa mediante teclado;
- foco visible en todos los elementos interactivos;
- etiquetas accesibles en botones y controles;
- regiones `aria-live` para resultados de validación;
- contraste suficiente en modo claro y oscuro;
- zoom del navegador al 200 % sin pérdida de funcionalidad;
- respeto de `prefers-reduced-motion`;
- estados comprensibles sin depender únicamente del color.

### 30.6. Pruebas end-to-end

Definen un recorrido mínimo que cubre el flujo principal del estudiante:

1. Entrar en la landing page.
2. Hacer clic en "Comenzar curso básico".
3. Abrir la primera lección de la Sección 1.
4. Completar un ejercicio obligatorio.
5. Avanzar hasta el ejercicio integrador de la sección.
6. Completar el integrador y desbloquear la Sección 2.
7. Recargar la página.
8. Confirmar que el progreso se conserva.

No todas las combinaciones de contenido necesitan pruebas E2E. La lógica reusable debe cubrirse principalmente con pruebas unitarias y de integración.

## 31. Rendimiento, seguridad y mantenibilidad

### 31.1. Rendimiento

- Mantener **Astro** como base de generación estática.
- React se utiliza solo en **islas interactivas** necesarias (editor, vista previa, validación).
- **CodeMirror** se carga únicamente en páginas que lo utilizan (carga diferida).
- Evitar enviar al cliente el contenido completo de las 15 secciones si no es necesario.
- Mantener el **JavaScript inicial reducido** al mínimo funcional.
- Evitar dependencias pesadas sin justificación de funcionalidad.
- Cargar imágenes optimizadas (formato, dimensiones).
- Evitar efectos visuales costosos (sombras, animaciones complejas).
- La escritura en el editor **no debe bloquear la interfaz**.
- La vista previa automática debe usar **debounce** cuando sea necesario.
- **IndexedDB** no debe escribirse en cada pulsación; debe espaciarse o agruparse.
- No se guardará código incompleto del estudiante.

### 31.2. Seguridad

- No ejecutar compiladores LaTeX (`pdflatex`, `xelatex`, `lualatex`) ni comandos del sistema.
- No aceptar HTML arbitrario proveniente del contenido del usuario.
- Sanitizar cualquier HTML generado internamente por el renderizador educativo.
- Usar una **lista permitida** de comandos LaTeX soportados.
- No evaluar JavaScript proveniente del contenido.
- No usar `eval` ni `new Function`.
- No aceptar reglas de validación creadas por visitantes.
- No procesar subidas de archivos durante la Fase 1.
- Las imágenes serán **recursos internos** de TexDock, no URL arbitrarias.
- Tratar comentarios LaTeX correctamente para evitar falsos positivos en la validación.
- Los enlaces externos deben utilizar atributos de seguridad (`rel="noopener noreferrer"`).

### 31.3. Mantenibilidad

- Separar claramente: contenido, lógica pedagógica, validación, renderizado y componentes de presentación.
- Evitar teoría escrita directamente dentro de componentes React.
- Mantener **identificadores estables** para todas las entidades del curso.
- Validar el contenido durante el **build** (pruebas de contenido).
- Centralizar los tipos y reglas compartidas en un módulo común.
- Documentar decisiones no evidentes en el código.
- Evitar abstracciones generales antes de validar la implementación vertical de una sección completa.
- No construir un parser LaTeX completo.
- Añadir nuevas capacidades de forma incremental, sin refactors masivos.

## 32. Integración continua con GitHub Actions

### 32.1. Eventos activadores

La integración continua se ejecutará en:

- **pull requests** dirigidos a `main`;
- **pushes** a `main`.

### 32.2. Comando principal

El comando central será:

```
npm run validate
```

Actualmente ejecuta `astro check && vitest run && astro build` (según `package.json`). La instalación utilizará `npm ci` para garantizar reproducibilidad.

### 32.3. Versión de Node

Seguirá la configuración oficial del repositorio (`package.json` define `node >=22.12.0`). No fijar una versión distinta sin revisar los archivos de configuración existentes.

### 32.4. Comprobaciones mínimas

El workflow debe verificar como mínimo:

- instalación reproducible (`npm ci`);
- TypeScript y Astro check (`astro check`);
- pruebas automatizadas (`vitest run`);
- build de producción (`astro build`);
- validaciones de contenido cuando existan.

### 32.5. Reglas del workflow

- Un pull request **no podrá considerarse listo** si la validación falla.
- No desplegar desde pull requests.
- No exponer secretos en logs.
- No utilizar secretos para tareas que no los necesiten.
- Puede utilizarse **caché de npm** si no complica el workflow.
- Los workflows antiguos de una misma rama podrán **cancelarse** cuando exista una ejecución más reciente.
- Los detalles internos deben centralizarse en `npm run validate` siempre que sea posible, evitando duplicar comandos en distintos lugares.
- La configuración debe ser simple y mantenible.

### 32.6. Nota sobre implementación

El archivo YAML concreto se escribirá durante la Fase 1, pero su comportamiento queda definido en esta sección.

## 33. Despliegue público

### 33.1. Requisito de cierre

El cierre de la Fase 1 requiere una versión pública funcional. El sitio sigue siendo estático.

### 33.2. Condiciones de despliegue

- El despliegue de producción se realizará desde `main`.
- Solo se desplegará una revisión que haya superado `npm run validate`.
- No habrá backend, base de datos ni servidor Django.
- No habrá variables secretas necesarias para ejecutar el curso básico.

### 33.3. Proveedor

El proveedor definitivo está **pendiente de decidir**. Cloudflare Pages es un candidato recomendado, pero no una decisión cerrada.

### 33.4. Dominio

- **No comprar dominio todavía.**
- El dominio propio queda pendiente de:
  - confirmar el nombre definitivo;
  - revisar disponibilidad;
  - revisar identidad visual;
  - completar una versión estable.
- **HTTPS no depende de tener un dominio propio.** El despliegue inicial puede verificarse mediante el subdominio HTTPS proporcionado por el proveedor. La ausencia de dominio propio no debe considerarse un bloqueo para cerrar la Fase 1.

### 33.5. Requisitos técnicos

- Debe utilizar **HTTPS**.
- Deben funcionar directamente las rutas públicas:
  - `/`;
  - `/aprender`;
  - `/biblioteca`;
  - `/acerca`.
- Las rutas internas del curso deben funcionar también al **recargar la página**. TexDock genera páginas estáticas reales con Astro, no es una SPA. No debe depender inicialmente de un fallback general hacia `index.html`. La configuración de redirects o rewrites solo será necesaria si el proveedor requiere alguna regla específica para rutas generadas.
- Los assets, imágenes y fuentes utilizadas deben servirse correctamente.
- Los enlaces externos deben abrirse de forma segura.

### 33.6. Comprobación manual posterior al despliegue

Después del despliegue se realizará una verificación manual mínima:

- navegación entre todas las rutas públicas;
- modo claro y modo oscuro;
- editor (carga, escritura, acciones);
- vista previa (actualización automática, mensaje de no disponible);
- validación de un ejercicio (Comprobar respuesta);
- progreso local (recargar y verificar persistencia);
- desbloqueo de secciones;
- biblioteca y plantillas;
- responsive básico (móvil y escritorio);
- accesibilidad por teclado.

### 33.7. Estrategia de recuperación

Debe existir una forma sencilla de volver al despliegue estable anterior:

- **Opción preferida:** restaurar un despliegue anterior desde el historial del proveedor.
- **Alternativa:** volver a desplegar una revisión estable anterior de Git.
- No reescribir el historial de `main` para realizar un rollback.

## 34. Plan de implementación por subfases

La Fase 1 se divide en cinco subfases secuenciales. TexDock no considerará terminada la Fase 1 hasta completar todas. Cada subfase debe desarrollarse en una rama independiente y validarse antes de fusionarse a `main`. No se implementarán simultáneamente las 15 secciones; primero se validará una experiencia vertical pequeña.

Cada subfase debe incluir y ejecutar las pruebas correspondientes a sus entregables. La subfase 1E no será el primer momento en que se pruebe el proyecto; 1E realizará regresión completa, estabilización y comprobación final de todo lo construido anteriormente.

### 34.1. Fase 1A — Fundamentos de interfaz y arquitectura

**Objetivo:** Preparar la estructura común sobre la que se construirá el curso.

| Aspecto               | Descripción                                              |
| :-------------------- | :------------------------------------------------------- |
| Identificador         | 1A                                                       |
| Objetivo              | Estructura común del sitio                               |
| Entregables           | Navegación principal; páginas Inicio, Aprender, Biblioteca y Acerca de; estructura visual del curso; panel lateral; cabecera de progreso; modos claro y oscuro; Content Collections; modelos iniciales de curso, sección y lección; GitHub Actions con `npm run validate`; estructura base de pruebas |
| Dependencias          | Ninguna                                                  |
| Condición de cierre   | Estructura navegable con contenido provisional validado durante el build |

No incluye todavía: las 15 secciones completas, biblioteca completa, progreso definitivo ni renderizador de todas las estructuras LaTeX.

### 34.2. Fase 1B — Implementación vertical educativa

**Objetivo:** Comprobar de extremo a extremo la arquitectura pedagógica y técnica con una experiencia vertical limitada (Secciones 1 y 2).

| Aspecto               | Descripción                                              |
| :-------------------- | :------------------------------------------------------- |
| Identificador         | 1B                                                       |
| Objetivo              | Validar el flujo completo contenido → editor → renderizado → validación → progreso |
| Entregables           | Una sección conceptual; una sección con documento mínimo; CodeMirror; vista previa automática; modos `FRAGMENT_ONLY` y `FULL_DOCUMENT`; modelos Example y Exercise; botón Comprobar respuesta; botón Ver solución; validación de los casos A y B (sección 26); progreso local inicial con Dexie; desbloqueo de lecciones; desbloqueo de una sección mediante integrador; pruebas unitarias, de integración y un E2E mínimo |
| Dependencias          | 1A                                                       |
| Condición de cierre   | Flujo contenido → editor → renderizado → validación → progreso funciona correctamente |
| Ciclo de corrección   | Si la implementación descubre problemas de arquitectura en 1A, las correcciones forman parte de 1B. No se avanza a 1C hasta que el flujo vertical quede validado |

### 34.3. Fase 1C — Curso básico completo

**Objetivo:** Construir las 15 secciones del curso.

| Aspecto               | Descripción                                              |
| :-------------------- | :------------------------------------------------------- |
| Identificador         | 1C                                                       |
| Objetivo              | Completar el contenido educativo de las 15 secciones     |
| Entregables           | Lecciones definitivas; ejemplos; ejercicios; variantes; integradores; modalidades educativas; paquetes progresivos; preámbulo y cuerpo; renderizado seguro para texto, matemáticas, listas, tablas, imágenes, notas al pie, referencias y bibliografía; proyecto completo de la Sección 15 |
| Dependencias          | 1B                                                       |
| Condición de cierre   | 15 secciones completas, validadas y funcionales; sin secciones vacías o simuladas |

Se trabajará por grupos pequeños de secciones. Cada grupo debe validar contenido, navegación y ejercicios. `geometry` e `hyperref` siguen siendo opcionales según la especificación.

### 34.4. Fase 1D — Biblioteca y plantillas

**Objetivo:** Implementar la biblioteca pública con las dos plantillas iniciales.

| Aspecto               | Descripción                                              |
| :-------------------- | :------------------------------------------------------- |
| Identificador         | 1D                                                       |
| Objetivo              | Biblioteca pública con categoría Plantillas              |
| Entregables           | Navegación de Biblioteca; categoría Plantillas; plantilla de tarea académica; plantilla de apuntes de clase; vistas previas; explicación por partes; código completo; acción Copiar; pruebas de contenido y accesibilidad |
| Dependencia técnica   | 1A (navegación y estructura base)                        |
| Orden de ejecución    | 1A → 1B → 1C → 1D → 1E (no se trabaja en paralelo con 1C) |
| Condición de cierre   | Biblioteca funcional con dos plantillas, copia de código y pruebas |

No incluye: descargas, cuentas, subida de recursos, buscador, comentarios ni valoraciones.

### 34.5. Fase 1E — Estabilización y publicación

**Objetivo:** Preparar la versión pública completa y cerrar la Fase 1.

| Aspecto               | Descripción                                              |
| :-------------------- | :------------------------------------------------------- |
| Identificador         | 1E                                                       |
| Objetivo              | Revisión, estabilización y despliegue público            |
| Entregables           | Revisión de las 15 secciones; revisión pedagógica; corrección de contenido; pruebas unitarias, componentes, integración, contenido y E2E; accesibilidad; responsive; rendimiento; seguridad; comprobación de temas claro y oscuro; validación del build; despliegue público; prueba manual posterior al despliegue; actualización de README y documentación; cierre formal de la Fase 1 |
| Dependencias          | 1C, 1D                                                   |
| Condición de cierre   | Versión pública funcional, probada y documentada; cierre formal de la Fase 1 |

### 34.6. Orden obligatorio

```
1A → 1B → 1C → 1D → 1E
```

- Una subfase puede requerir correcciones antes de avanzar.
- **No se debe comenzar 1C hasta que 1B valide correctamente** la experiencia vertical.
- La subfase 1D depende técnicamente de la estructura creada en 1A, pero el **orden de ejecución aprobado** sigue siendo el indicado. No se trabajará 1D en paralelo con 1C durante el plan inicial.
- Cualquier cambio futuro en este orden deberá aprobarse y documentarse.
- El despliegue final ocurre en 1E.
- Puede existir un despliegue técnico provisional antes, pero no representa el cierre de la Fase 1.

## 35. Criterios de aceptación y cierre de la Fase 1

La Fase 1 solo se considera terminada cuando todos los criterios obligatorios se cumplen. Una demostración parcial, contenido simulado o un despliegue técnico provisional no representan el cierre.

### 35.1. Sitio y navegación pública

- Existen y funcionan: `/`, `/aprender`, `/biblioteca`, `/acerca`.
- Existe enlace externo al repositorio de GitHub.
- La navegación principal funciona mediante teclado.
- Las rutas internas pueden recargarse directamente.
- No existen enlaces principales rotos.
- La landing muestra correctamente "Comenzar curso básico", "Continuar curso básico" o "Repasar curso básico" según el progreso almacenado.

### 35.2. Curso básico

- Las 15 secciones están implementadas.
- Ninguna sección está vacía, simulada o marcada como "próximamente".
- Cada sección contiene sus lecciones definitivas.
- Cada sección tiene un ejercicio integrador obligatorio.
- Las lecciones se desbloquean en el orden definido.
- La siguiente sección se desbloquea al completar el integrador anterior.
- El contenido completado puede repasarse sin perder progreso.
- La Sección 15 incluye el proyecto final completo y guiado.
- El proyecto final integra los elementos obligatorios definidos en esta especificación.
- No se exige `geometry` ni `hyperref` para cerrar el curso.

### 35.3. Experiencia pedagógica

- La teoría es breve y está intercalada con práctica.
- Los ejemplos editables permiten copiar, limpiar y restaurar.
- Los ejercicios permiten: comprobar respuesta, ver solución y copiar la solución.
- Ver la solución no completa el ejercicio.
- La solución no reemplaza automáticamente el código del estudiante.
- Los errores producen mensajes pedagógicos concretos.
- No existe puntuación numérica, ranking, estrellas ni penalización.
- Las variantes de un ejercicio conservan objetivo y dificultad aproximada.
- Los fragmentos aislados se identifican como fragmentos y no como documentos completos.

### 35.4. Editor y vista previa

- CodeMirror reemplaza el textarea en las experiencias educativas.
- Los números de línea están visibles.
- Existe resaltado de sintaxis.
- No existe cierre automático obligatorio de llaves o entornos.
- No existe autocompletado complejo.
- La vista previa se actualiza automáticamente.
- No existe botón general Renderizar.
- No se utiliza Ctrl + Enter para renderizar.
- KaTeX renderiza el subconjunto matemático compatible.
- El renderizador controlado soporta los elementos necesarios del curso.
- El usuario escribe LaTeX y no HTML.
- El HTML interno se genera y sanitiza de forma segura.
- Los comandos no admitidos muestran: "Esta función todavía no está disponible en la vista previa de TexDock".
- No se ejecutan compiladores TeX.
- No se generan PDF.
- No se permite editar documentos completos libremente fuera del recorrido educativo.

### 35.5. Validación

- Los casos de referencia A, B y C (sección 26) funcionan.
- La validación ignora espacios, líneas e indentación irrelevantes.
- Exige los comandos y estructuras enseñados.
- Comprueba argumentos relevantes.
- Comprueba entornos abiertos y cerrados correctamente.
- Puede validar argumentos coincidentes entre comandos relacionados.
- Respeta los scopes `PREAMBLE`, `BODY`, `MATH` y `FULL_DOCUMENT`.
- Todas las reglas `required` deben cumplirse para completar un ejercicio.
- `FORBID_ALTERNATIVE` nunca es la única regla positiva de validación.
- Los comentarios y zonas no relacionadas no provocan falsos positivos conocidos en los casos cubiertos.
- La solución no se compara como una cadena literal exacta.
- No se ejecuta código arbitrario.

### 35.6. Progreso local

- El progreso utiliza IndexedDB mediante Dexie.
- Guarda: sección actual, lección actual, ejercicios completados, lecciones completadas, secciones completadas, versión del almacenamiento, fecha de actualización, estado del aviso inicial.
- No guarda código incompleto del editor.
- El progreso se restaura al recargar.
- Reiniciar el curso requiere confirmación.
- Reiniciar vuelve a bloquear todo excepto la primera sección.
- Existe un aviso claro de que el progreso pertenece al navegador actual.
- Las migraciones de versión del almacenamiento tienen pruebas.

### 35.7. Biblioteca

- La biblioteca es pública. No requiere cuenta ni progreso.
- Existe la categoría Plantillas.
- Está disponible la plantilla de tarea académica.
- Está disponible la plantilla de apuntes de clase.
- Cada plantilla incluye: título, descripción, vista previa, finalidad, explicación por partes, código completo, acción Copiar.
- No existe descarga de `.tex` en la Fase 1.
- No existe buscador, subida, comentarios, valoraciones ni marketplace.

### 35.8. Accesibilidad y responsive

- El flujo principal puede utilizarse mediante teclado.
- El foco es visible.
- Los controles tienen nombres accesibles.
- Los mensajes dinámicos utilizan `aria-live` cuando corresponda.
- Los estados no dependen únicamente del color.
- Hay contraste suficiente en modo claro y oscuro.
- La funcionalidad se mantiene con zoom al 200 %.
- Se respeta `prefers-reduced-motion`.
- La interfaz sigue siendo funcional en móvil.
- Copiar, Limpiar, Restaurar, Comprobar y Ver solución utilizan controles semánticos reales.

### 35.9. Rendimiento y seguridad

- Astro continúa como base estática.
- React se limita a islas interactivas.
- CodeMirror no se carga globalmente en páginas que no lo usan.
- No se envía innecesariamente todo el curso al cliente.
- La escritura y la vista previa no bloquean perceptiblemente la interfaz.
- Las imágenes están optimizadas.
- No se acepta HTML arbitrario.
- No se utiliza `eval` ni `new Function`.
- No se ejecutan comandos del sistema.
- No existen subidas de archivos.
- Los enlaces externos utilizan prácticas seguras.
- No se incluyen secretos innecesarios en cliente, repositorio o logs.
- No se fijan métricas numéricas definitivas de Lighthouse en esta especificación.

### 35.10. Pruebas e integración continua

- Existen pruebas unitarias para la lógica principal.
- Existen pruebas de componentes para los controles interactivos principales.
- Existen pruebas de integración para validación, progreso y desbloqueo.
- Existen validaciones automáticas del contenido.
- Existe al menos el recorrido E2E mínimo definido en la sección 30.
- Se realizan comprobaciones de accesibilidad.
- GitHub Actions se ejecuta en pull requests hacia `main` y pushes a `main`.
- El workflow utiliza `npm ci`.
- El workflow ejecuta `npm run validate`.
- `npm run validate` termina correctamente.
- El build de producción termina correctamente.
- No se fusiona un cambio conocido con validaciones fallidas.

### 35.11. Despliegue público

- Existe una URL pública HTTPS.
- No es obligatorio utilizar dominio propio.
- El despliegue procede de `main`.
- La revisión desplegada superó `npm run validate`.
- Las rutas públicas funcionan directamente.
- Los assets se cargan correctamente.
- Se completa la comprobación manual posterior al despliegue y se registra mediante una lista de verificación que incluya: fecha, URL verificada, revisión o commit desplegado, persona responsable, resultado de cada comprobación, incidencias detectadas y decisión final de aprobación o rechazo. El resultado queda registrado en `TexDock_Progress_Log.md` o en el documento formal de cierre de la Fase 1.
- Existe una forma documentada de restaurar un despliegue estable anterior.

### 35.12. Documentación y cierre formal

Antes de cerrar la fase:

- Actualizar `README.md` con el estado real de TexDock.
- Actualizar `TexDock_Progress_Log.md`.
- Documentar: arquitectura implementada, estructura de contenido, comandos de desarrollo, comandos de validación, proceso de despliegue, limitaciones conocidas, decisiones pendientes para fases futuras.
- Confirmar que no quedan marcadores TODO, contenido provisional o mocks dentro de las funcionalidades obligatorias.
- Confirmar que no se añadieron funciones fuera del alcance aprobado.
- Ejecutar:

  ```
  npm ci
  npm run validate
  git status --short
  ```

- El árbol de trabajo debe quedar limpio.
- La rama de cierre debe revisarse mediante pull request antes de fusionarse a `main`.

### 35.13. Elementos que no bloquean el cierre

- No tener dominio propio.
- No soportar `geometry`.
- No soportar `hyperref` como paquete funcional.
- No tener descargas `.tex`.
- No generar PDF.
- No contar con backend.
- No contar con cuentas de usuario.
- No tener aplicación móvil específica.
- No soportar TikZ o PGFPlots.
- No incluir BibTeX, Biber o biblatex.

### 35.14. Bloqueadores de cierre

- Alguna de las 15 secciones incompleta.
- Ausencia del proyecto final de la Sección 15.
- Ejercicios obligatorios sin validación.
- Progreso o desbloqueo defectuoso.
- Biblioteca sin alguna de las dos plantillas.
- Fallos conocidos de seguridad.
- `npm run validate` con errores.
- Build de producción fallido.
- Ausencia de despliegue público.
- Rutas públicas rotas.
- Contenido provisional dentro de funciones obligatorias.
- Incumplimiento de accesibilidad que impida completar el flujo principal, evaluado mediante estas condiciones obligatorias:
  - navegación por teclado;
  - foco visible;
  - controles con nombres accesibles;
  - comprensión de mensajes dinámicos;
  - comprensión de estados sin depender solo del color;
  - uso funcional con zoom al 200 %;
  - uso funcional en una pantalla móvil básica.

  Problemas visuales menores que no impidan el flujo principal pueden documentarse como mejoras posteriores, pero no deben ocultar fallos funcionales.
