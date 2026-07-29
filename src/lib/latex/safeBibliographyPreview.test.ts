import { describe, expect, it } from 'vitest';
import { parseSafeBibliographyPreview } from './safeBibliographyPreview';

describe('parseSafeBibliographyPreview', () => {
  it('representa una bibliografía y citas simples o múltiples', () => {
    const result = parseSafeBibliographyPreview(String.raw`
Texto \cite{torres-calculo}. Comparación \cite{torres-calculo,lopez-metodos}.
\begin{thebibliography}{99}
\bibitem{torres-calculo} Ana Torres. \emph{Introducción al cálculo}. Editorial Aula, 2025.
\bibitem{lopez-metodos} Luis López. Métodos numéricos. \emph{Revista Ejemplo}, 2(1), 10--20, 2024.
\end{thebibliography}
`);

    expect(result.errors).toEqual([]);
    expect(result.hasBibliography).toBe(true);
    expect(result.widthArgument).toBe('99');
    expect(result.entries.map((entry) => entry.key)).toEqual([
      'torres-calculo',
      'lopez-metodos',
    ]);
    expect(result.citations.map((citation) => citation.value)).toEqual([
      '[1]',
      '[1, 2]',
    ]);
    expect(result.remainingBody).toContain('Texto [1].');
    expect(result.remainingBody).toContain('Comparación [1, 2].');
    expect(result.limitations).toHaveLength(2);
  });

  it('acepta una bibliografía vacía con argumento de ancho', () => {
    const result = parseSafeBibliographyPreview(String.raw`
\begin{thebibliography}{9}
\end{thebibliography}
`);

    expect(result.errors).toEqual([]);
    expect(result.hasBibliography).toBe(true);
    expect(result.entries).toEqual([]);
  });

  it('detecta claves inexistentes y duplicadas', () => {
    const result = parseSafeBibliographyPreview(String.raw`
Texto \cite{clave-inexistente}.
\begin{thebibliography}{9}
\bibitem{repetida} Fuente ficticia A.
\bibitem{repetida} Fuente ficticia B.
\end{thebibliography}
`);

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining(['DUPLICATE_BIBITEM_KEY', 'UNDEFINED_CITATION']),
    );
    expect(result.remainingBody).toContain('[??]');
  });

  it('detecta bibitem fuera del entorno y ampersand sin escapar', () => {
    const result = parseSafeBibliographyPreview(String.raw`
\bibitem{fuera} Fuente fuera.
\begin{thebibliography}{9}
\bibitem{editorial} Editorial Ciencia & Educación.
\end{thebibliography}
`);

    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(
      expect.arrayContaining([
        'BIBITEM_OUTSIDE_BIBLIOGRAPHY',
        'UNESCAPED_BIBLIOGRAPHY_AMPERSAND',
      ]),
    );
  });

  it('detecta una bibliografía colocada después del documento', () => {
    const result = parseSafeBibliographyPreview(
      'Texto.',
      String.raw`\begin{thebibliography}{9}\bibitem{tarde} Fuente.\end{thebibliography}`,
    );

    expect(result.diagnostics.map((diagnostic) => diagnostic.code))
      .toContain('BIBLIOGRAPHY_AFTER_DOCUMENT');
  });
});
