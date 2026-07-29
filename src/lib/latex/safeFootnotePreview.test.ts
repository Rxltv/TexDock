import { describe, expect, it } from 'vitest';
import { parseSafeFootnotePreview } from './safeFootnotePreview';
import { parseSafeLatexPreview } from './safeLatexPreview';

describe('parseSafeFootnotePreview', () => {
  it('numera notas directas por orden de aparición y conserva sus textos', () => {
    const result = parseSafeFootnotePreview(
      String.raw`La media\footnote{Promedio aritmético.} y la desviación\footnote{Medida de dispersión.}.`,
    );

    expect(result.errors).toEqual([]);
    expect(result.remainingBody).toBe('La media¹ y la desviación².');
    expect(result.footnotes).toEqual([
      { number: 1, text: 'Promedio aritmético.' },
      { number: 2, text: 'Medida de dispersión.' },
    ]);
    expect(result.directFootnoteCount).toBe(2);
  });

  it('asocia footnotemark en una celda con footnotetext después de tabular', () => {
    const result = parseSafeLatexPreview(String.raw`
\documentclass{article}
\begin{document}
\begin{tabular}{lr}
Estudiante & Nota \\
Ana & 18\footnotemark
\end{tabular}
\footnotetext{Nota máxima del grupo.}
\end{document}`);

    expect(result.errors).toEqual([]);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.tables[0].rows[1].cells[1].text).toBe('18¹');
    expect(result.footnotes).toEqual([
      { number: 1, text: 'Nota máxima del grupo.' },
    ]);
  });

  it('rechaza notas vacías o escritas directamente dentro de tabular', () => {
    const result = parseSafeFootnotePreview(String.raw`
\footnote{}
\begin{tabular}{lr}
Media & 14.2\footnote{Promedio observado.}
\end{tabular}`);

    expect(result.errors).toContain('Cada \\footnote debe contener una aclaración.');
    expect(result.errors).toContain(
      'Dentro de tabular usa \\footnotemark y coloca \\footnotetext después de la tabla.',
    );
  });

  it('rechaza parejas incompletas y numeración manual', () => {
    const result = parseSafeFootnotePreview(
      String.raw`Dato\footnotemark[4] sin texto asociado.`,
    );

    expect(result.errors).toContain(
      'La numeración manual de notas no está disponible en esta sección.',
    );
    expect(result.errors).toContain(
      'Cada \\footnotemark necesita una \\footnotetext posterior.',
    );
  });
});
