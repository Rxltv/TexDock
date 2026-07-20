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
