import { describe, it, expect } from 'vitest';
import { parseSafeLatexPreview } from './safeLatexPreview';

describe('parseSafeLatexPreview', () => {
  it('parses a minimal valid document', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.documentClass).toBe('article');
    expect(result.paragraphs).toEqual(['Hola']);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('handles different spacing and indentation', () => {
    const result = parseSafeLatexPreview(
      '  \\documentclass{article}\n\n\\begin{document}\n  Texto indentado  \n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Texto indentado']);
  });

  it('splits multiple paragraphs by empty lines', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimer párrafo.\n\nSegundo párrafo.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Primer párrafo.', 'Segundo párrafo.']);
  });

  it('handles empty body', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual([]);
  });

  it('strips comments starting with %', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nTexto visible.% comentario\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Texto visible.']);
  });

  it('preserves escaped percent \\%', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n50\\%\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['50%']);
  });

  it('detects missing \\begin{document}', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\begin{document}.');
    expect(result.paragraphs).toEqual([]);
  });

  it('detects missing \\end{document}', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nHola',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\end{document}.');
    expect(result.paragraphs).toEqual([]);
  });

  it('detects wrong order (end before begin)', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\end{document}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('\\end{document} aparece antes de \\begin{document}.');
  });

  it('rejects documentclass different from article', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{book}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Clase "book" no soportada. Solo se admite "article".');
    expect(result.documentClass).toBe('book');
  });

  it('reports unsupported commands in the body', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\textbf{Texto}\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.unsupportedCommands).toContain('\\textbf');
    expect(result.paragraphs).toEqual([]);
  });

  it('does not mix preamble text into paragraphs', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n% esto es preámbulo\n\\begin{document}\nCuerpo.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Cuerpo.']);
    expect(result.paragraphs).not.toContain('esto es preámbulo');
  });

  it('handles body with only whitespace', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n   \n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual([]);
  });

  it('handles multiple blank lines without creating empty paragraphs', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nUno\n\n\n\nDos\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Uno', 'Dos']);
  });

  it('strips lines that are only comments', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nTexto\n% solo comentario\nMás texto\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Texto', 'Más texto']);
  });

  it('detects missing \\documentclass', () => {
    const result = parseSafeLatexPreview(
      '\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\documentclass.');
    expect(result.documentClass).toBeNull();
  });

  it('collects multiple unsupported commands without duplicates', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\textbf{a}\\textbf{b}\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.unsupportedCommands).toEqual(['\\textbf']);
  });

  it('preserves escaped percent as a paragraph of "%"', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\%\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['%']);
  });

  it('ignores \\documentclass inside a comment', () => {
    const result = parseSafeLatexPreview(
      '% \\documentclass{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\documentclass.');
    expect(result.documentClass).toBeNull();
  });

  it('ignores \\begin{document} inside a comment', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n% \\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\begin{document}.');
  });

  it('ignores \\end{document} inside a comment', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nHola\n% \\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\end{document}.');
  });

  it('ignores unsupported commands inside a comment', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nHola % \\textbf{comentado}\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.paragraphs).toEqual(['Hola']);
  });

  it('ignores a whole line that is only a comment with a command', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nTexto\n% \\section{Introducción}\nMás texto\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.paragraphs).toEqual(['Texto', 'Más texto']);
  });

  it('is valid when structural commands are uncommented despite extra commented structures', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n% \\usepackage{amsmath}\n\\begin{document}\n% \\section{Intro}\nHola\n\\end{document}\n% \\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Hola']);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.documentClass).toBe('article');
  });
});
