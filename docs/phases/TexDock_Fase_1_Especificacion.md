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
