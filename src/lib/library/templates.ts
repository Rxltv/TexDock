export interface TemplatePart {
  label: string;
  explanation: string;
}

export interface LibraryTemplate {
  id: string;
  title: string;
  description: string;
  purpose: string;
  preview: string[];
  code: string;
  parts: TemplatePart[];
}

const sharedParts: TemplatePart[] = [
  { label: '\\documentclass', explanation: 'Define la clase article, adecuada para documentos breves.' },
  { label: 'Paquetes', explanation: 'Incluye solo babel y amsmath para idioma y matemáticas básicas.' },
  { label: 'Datos principales', explanation: 'title, author y date construyen la información inicial del documento.' },
  { label: 'Estructura', explanation: 'begin{document}, secciones y subsecciones organizan el contenido.' },
  { label: 'Cuerpo', explanation: 'El texto se escribe dentro del documento y se separa en párrafos.' },
];

export const libraryTemplates: LibraryTemplate[] = [
  {
    id: 'tarea-academica',
    title: 'Plantilla de tarea académica',
    description: 'Una base breve para entregar una tarea, informe o conjunto de ejercicios.',
    purpose: 'Ayuda a practicar la estructura de un documento académico corto sin ocultar las decisiones principales de LaTeX.',
    preview: ['Tarea de LaTeX', 'Introducción', 'Este documento presenta una idea y un resultado breve.', 'Desarrollo'],
    code: String.raw`\documentclass[12pt]{article}
\usepackage[spanish]{babel}
\usepackage{amsmath}

\title{Tarea de LaTeX}
\author{Nombre del estudiante}
\date{\today}

\begin{document}
\maketitle

\section{Introducción}
Este documento presenta una idea y un resultado breve.

\section{Desarrollo}
Una expresión de ejemplo es $a^2+b^2=c^2$.

\section{Conclusión}
Resume aquí el aprendizaje principal.
\end{document}`,
    parts: sharedParts,
  },
  {
    id: 'apuntes-clase',
    title: 'Plantilla de apuntes de clase',
    description: 'Una estructura sencilla para ordenar definiciones, ideas y ejemplos de una clase.',
    purpose: 'Favorece tomar apuntes por temas y convertir una sesión de clase en un documento que se pueda repasar.',
    preview: ['Apuntes de clase', 'Tema principal', 'Idea clave', 'Ejemplo'],
    code: String.raw`\documentclass[12pt]{article}
\usepackage[spanish]{babel}
\usepackage{amsmath}

\title{Apuntes de clase}
\author{Nombre del estudiante}
\date{\today}

\begin{document}
\maketitle

\section{Tema principal}
\subsection{Idea clave}
Escribe aquí la definición o explicación central.

\subsection{Ejemplo}
Anota un ejemplo que ayude a recordar la idea.

\section{Resumen}
Resume las conclusiones de la clase.
\end{document}`,
    parts: sharedParts,
  },
];
