import { describe, expect, it } from 'vitest';
import { parseSafeLatexPreview } from './safeLatexPreview';
import { parseSafeReferencePreview } from './safeReferencePreview';

describe('parseSafeReferencePreview', () => {
  it('resuelve ref y pageref de una sección con una limitación explícita', () => {
    const result = parseSafeLatexPreview(String.raw`
\documentclass{article}
\begin{document}
\section{Método}\label{sec:metodo}
La Sección \ref{sec:metodo} aparece en la página \pageref{sec:metodo}.
\end{document}`);

    expect(result.errors).toEqual([]);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.paragraphs.join(' ')).toContain('Sección 1');
    expect(result.references.map((reference) => reference.value)).toEqual(['1', '1']);
    expect(result.referenceLimitations.join(' ')).toContain('página');
  });

  it('resuelve eqref únicamente para una ecuación numerada con amsmath', () => {
    const result = parseSafeLatexPreview(String.raw`
\documentclass{article}
\usepackage{amsmath}
\begin{document}
\begin{equation}
a^2+b^2=c^2\label{eq:pitagoras}
\end{equation}
Véase \eqref{eq:pitagoras}.
\end{document}`);

    expect(result.errors).toEqual([]);
    expect(result.references[0]).toMatchObject({
      command: 'eqref',
      key: 'eq:pitagoras',
      value: '(1)',
      objectKind: 'equation',
    });
    expect(result.previewBlocks?.some((block) => block.kind === 'equation')).toBe(true);
  });

  it('distingue tabla, figura y subfiguras etiquetadas después de caption', () => {
    const result = parseSafeReferencePreview(
      String.raw`
\begin{table}
\caption{Resultados}\label{tab:resultados}
\begin{tabular}{lr}A & 14.2\end{tabular}
\end{table}
\begin{figure}
\begin{subfigure}{0.45\textwidth}
\includegraphics{antes.png}
\caption{Antes}\label{fig:antes}
\end{subfigure}
\begin{subfigure}{0.45\textwidth}
\includegraphics{despues.png}
\caption{Después}\label{fig:despues}
\end{subfigure}
\caption{Comparación}\label{fig:comparacion}
\end{figure}
Tabla \ref{tab:resultados}; paneles \ref{fig:antes} y \ref{fig:despues}; figura \ref{fig:comparacion}.`,
      '',
      [],
    );

    expect(result.errors).toEqual([]);
    expect(result.labels).toEqual(expect.arrayContaining([
      { key: 'tab:resultados', value: '1', objectKind: 'table' },
      { key: 'fig:antes', value: '1a', objectKind: 'subfigure' },
      { key: 'fig:despues', value: '1b', objectKind: 'subfigure' },
      { key: 'fig:comparacion', value: '1', objectKind: 'figure' },
    ]));
  });

  it('reutiliza una nota con textsuperscript y un único texto al pie', () => {
    const result = parseSafeLatexPreview(String.raw`
\documentclass{article}
\begin{document}
Método A\footnote{Procedimiento común.\label{nota:metodo}} y
Método B\textsuperscript{\ref{nota:metodo}}.
\end{document}`);

    expect(result.errors).toEqual([]);
    expect(result.footnotes).toEqual([{ number: 1, text: 'Procedimiento común.' }]);
    expect(result.references[0]).toMatchObject({
      command: 'textsuperscript',
      key: 'nota:metodo',
      value: '¹',
    });
  });

  it('representa cref y Cref y señala enlaces simulados', () => {
    const result = parseSafeLatexPreview(String.raw`
\documentclass{article}
\usepackage{hyperref}
\usepackage{cleveref}
\begin{document}
\section{Método}\label{sec:metodo}
Consulte \cref{sec:metodo}. \Cref{sec:metodo} resume el proceso.
\end{document}`);

    expect(result.errors).toEqual([]);
    expect(result.references.map((reference) => reference.value)).toEqual([
      'sección 1',
      'Sección 1',
    ]);
    expect(result.references.every((reference) => reference.linked)).toBe(true);
    expect(result.referenceLimitations.join(' ')).toContain('enlaces');
  });

  it('detecta duplicados, indefinidos, objetos incorrectos y label antes de caption', () => {
    const result = parseSafeReferencePreview(
      String.raw`
\section{Método}\label{sec:metodo}
\begin{equation}x=1\label{sec:metodo}\end{equation}
\begin{table}
\label{tab:resultados}\caption{Resultados}
\begin{tabular}{lr}A & 1\end{tabular}
\end{table}
\eqref{sec:metodo}
\ref{fig:ausente}`,
      '',
      [],
    );
    const codes = result.diagnostics.map((diagnostic) => diagnostic.code);

    expect(codes).toContain('DUPLICATE_LABEL');
    expect(codes).toContain('WRONG_LABEL_PREFIX');
    expect(codes).toContain('LABEL_BEFORE_CAPTION');
    expect(codes).toContain('EQREF_WRONG_OBJECT');
    expect(codes).toContain('UNDEFINED_REFERENCE');
  });

  it('detecta cleveref ausente y orden incorrecto de paquetes', () => {
    const missing = parseSafeReferencePreview(
      String.raw`\section{Método}\label{sec:metodo}\cref{sec:metodo}`,
      '',
      [],
    );
    expect(missing.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'CLEVEREF_NOT_LOADED',
    );

    const wrongOrder = parseSafeReferencePreview(
      '',
      String.raw`\usepackage{cleveref}
\usepackage{hyperref}
\usepackage{graphicx}`,
      ['cleveref', 'hyperref', 'graphicx'],
    );
    expect(wrongOrder.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      'REFERENCE_PACKAGE_ORDER',
    );
  });
});
