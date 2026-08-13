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

  it('accepts optional argument in documentclass', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass[12pt]{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.documentClass).toBe('article');
    expect(result.paragraphs).toEqual(['Hola']);
  });

  it('extracts documentClassOption as null when no option is given', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClassOption).toBeNull();
  });

  it('extracts documentClassOption as "10pt"', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass[10pt]{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClassOption).toBe('10pt');
  });

  it('extracts documentClassOption as "11pt"', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass[11pt]{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClassOption).toBe('11pt');
  });

  it('extracts documentClassOption as "12pt"', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass[12pt]{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClassOption).toBe('12pt');
    expect(result.valid).toBe(true);
  });

  it('fails to parse malformed documentclass: missing braces', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass[12pt]article\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClass).toBeNull();
    expect(result.valid).toBe(false);
  });

  it('fails to parse malformed documentclass: missing closing bracket', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass[12pt{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClass).toBeNull();
    expect(result.valid).toBe(false);
  });

  it('fails to parse malformed documentclass: no brackets or braces 12pt', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass12pt{article}\n\\begin{document}\nHola\n\\end{document}',
    );
    expect(result.documentClass).toBeNull();
    expect(result.valid).toBe(false);
  });

  it('renders \\\\ as a manual line break within the same paragraph', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera línea.\\\\\nSegunda línea.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Primera línea.\nSegunda línea.']);
  });

  it('renders \\\\ inline (without newline) as a manual line break', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera.\\\\Segunda.\n\\end{document}',
    );
    expect(result.paragraphs).toEqual(['Primera.\nSegunda.']);
  });

  it('renders \\\\ followed by a space as a manual line break', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera.\\\\ Segunda.\n\\end{document}',
    );
    expect(result.paragraphs).toEqual(['Primera.\nSegunda.']);
  });

  it('a single newline does not create a new visual line', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera.\nSegunda.\n\\end{document}',
    );
    expect(result.paragraphs).toEqual(['Primera. Segunda.']);
  });

  it('\\\\ does not create two paragraphs', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera.\\\\\nSegunda.\n\\end{document}',
    );
    expect(result.paragraphs).toHaveLength(1);
  });

  it('a blank line still creates two paragraphs', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera.\\\\\nSegunda.\n\nTercera.\n\\end{document}',
    );
    expect(result.paragraphs).toEqual(['Primera.\nSegunda.', 'Tercera.']);
  });

  it('does not leave residual backslashes in the result', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nPrimera.\\\\\nSegunda.\n\\end{document}',
    );
    for (const paragraph of result.paragraphs) {
      expect(paragraph).not.toContain('\\');
    }
  });

  it('handles content before and after the manual break', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nAntes del salto.\\\\\nDespués del salto.\nLínea final.\n\\end{document}',
    );
    expect(result.paragraphs).toEqual(['Antes del salto.\nDespués del salto. Línea final.']);
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
      '\\documentclass{article}\n\\begin{document}\n\\chapter{Texto}\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.unsupportedCommands).toContain('\\chapter');
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
      '\\documentclass{article}\n\\begin{document}\n\\chapter{a}\\chapter{b}\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.unsupportedCommands).toEqual(['\\chapter']);
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

  // --- Paquetes en el preámbulo (Sección 3) ---

  it('extracts fontenc with T1 option', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\begin{document}\nHola.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.packages).toEqual([{ name: 'fontenc', options: 'T1' }]);
  });

  it('extracts inputenc with utf8 option', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[utf8]{inputenc}\n\\begin{document}\nHola.\n\\end{document}',
    );
    expect(result.packages).toEqual([{ name: 'inputenc', options: 'utf8' }]);
  });

  it('extracts babel with spanish option', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[spanish]{babel}\n\\begin{document}\nHola.\n\\end{document}',
    );
    expect(result.packages).toEqual([{ name: 'babel', options: 'spanish' }]);
  });

  it('extracts the three course packages together in order', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\usepackage[utf8]{inputenc}\n\\usepackage[spanish]{babel}\n\\begin{document}\nHola.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.packages).toEqual([
      { name: 'fontenc', options: 'T1' },
      { name: 'inputenc', options: 'utf8' },
      { name: 'babel', options: 'spanish' },
    ]);
  });

  it('extracts a package without options as null options', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage{microtype}\n\\begin{document}\nHola.\n\\end{document}',
    );
    expect(result.packages).toEqual([{ name: 'microtype', options: null }]);
  });

  it('reports \\usepackage inside the body as an error', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\usepackage[T1]{fontenc}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('\\usepackage debe colocarse en el preámbulo, no dentro del cuerpo.');
  });

  it('reports an unclosed package option', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[T1{fontenc}\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Línea \\usepackage incompleta o mal formada.');
  });

  it('reports a package name without braces', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[T1]fontenc\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Línea \\usepackage incompleta o mal formada.');
  });

  it('reports an incomplete \\usepackage line', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Línea \\usepackage incompleta o mal formada.');
  });

  it('renders Spanish text with tildes and ñ visibly', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\usepackage[utf8]{inputenc}\n\\usepackage[spanish]{babel}\n\\begin{document}\n¡Qué alegría! ¿Cómo está el niño?\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['¡Qué alegría! ¿Cómo está el niño?']);
  });

  // --- Metadatos y \\maketitle (Sección 4) ---

  it('extracts title, author and date from the preamble', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\title{Introducción}\n\\author{Ana Torres}\n\\date{21 de julio de 2026}\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.title).toBe('Introducción');
    expect(result.author).toBe('Ana Torres');
    expect(result.date).toBe('21 de julio de 2026');
  });

  it('metadata is not rendered as body paragraphs without \\maketitle', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\title{Introducción}\n\\author{Ana Torres}\n\\begin{document}\nTexto del documento.\n\\end{document}',
    );
    expect(result.hasMaketitle).toBe(false);
    expect(result.paragraphs).toEqual(['Texto del documento.']);
    expect(result.paragraphs.join(' ')).not.toContain('Introducción');
    expect(result.paragraphs.join(' ')).not.toContain('Ana Torres');
  });

  it('detects \\maketitle in the body and keeps metadata available', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\title{Introducción}\n\\author{Ana Torres}\n\\date{1 de enero de 2026}\n\\begin{document}\n\\maketitle\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.hasMaketitle).toBe(true);
    expect(result.title).toBe('Introducción');
    expect(result.author).toBe('Ana Torres');
    expect(result.date).toBe('1 de enero de 2026');
    expect(result.paragraphs).toEqual(['Texto.']);
    expect(result.paragraphs.join(' ')).not.toContain('maketitle');
  });

  it('reports \\maketitle in the preamble as an error', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\title{Introducción}\n\\maketitle\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('\\maketitle debe colocarse dentro del cuerpo, no en el preámbulo.');
  });

  it('reports \\title inside the body as an error', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\title{Tarde}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('\\title debe declararse en el preámbulo.');
  });

  it('reports \\author inside the body as an error', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\author{Ana}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('\\author debe declararse en el preámbulo.');
  });

  it('reports \\date inside the body as an error', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\date{Hoy}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('\\date debe declararse en el preámbulo.');
  });

  it('reports an unclosed \\title declaration', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\title{Introducción\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Declaración de \\title incompleta o mal formada.');
  });

  it('resolves \\today with the injected date in Spanish when babel spanish is loaded', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[spanish]{babel}\n\\date{\\today}\n\\begin{document}\n\\maketitle\n\\end{document}',
      { now: new Date(2026, 6, 21) },
    );
    expect(result.date).toBe('21 de julio de 2026');
  });

  it('resolves \\today with the injected date in English without babel', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\date{\\today}\n\\begin{document}\n\\maketitle\n\\end{document}',
      { now: new Date(2026, 6, 21) },
    );
    expect(result.date).toBe('July 21, 2026');
  });

  // --- Entorno abstract (Sección 4) ---

  it('extracts abstract content inside the body', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\maketitle\n\\begin{abstract}\nResumen breve.\n\\end{abstract}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.abstractParagraphs).toEqual(['Resumen breve.']);
    expect(result.paragraphs).toEqual(['Texto.']);
  });

  it('labels the abstract as "Resumen" when babel spanish is loaded', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage[spanish]{babel}\n\\begin{document}\n\\begin{abstract}\nSíntesis.\n\\end{abstract}\n\\end{document}',
    );
    expect(result.abstractLabel).toBe('Resumen');
  });

  it('labels the abstract as "Abstract" without babel spanish', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\begin{abstract}\nSíntesis.\n\\end{abstract}\n\\end{document}',
    );
    expect(result.abstractLabel).toBe('Abstract');
  });

  it('reports abstract in the preamble as an error', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{abstract}\nMal lugar.\n\\end{abstract}\n\\begin{document}\nTexto.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('El entorno abstract debe colocarse dentro del cuerpo.');
  });

  it('reports an unclosed abstract environment', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\begin{abstract}\nSin cierre.\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\end{abstract}.');
  });

  it('reports \\end{abstract} without \\begin{abstract}', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\end{abstract}\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\begin{abstract}.');
  });

  // --- Vista previa matemática segura (Secciones 8 y 9) ---

  it('renders inline and display mathematics with KaTeX blocks', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nSea \\(x^2\\) una potencia.\n\\[\\frac{x_1}{\\sqrt{n}}\\]\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.previewBlocks).toHaveLength(2);
    expect(result.previewBlocks?.[0].kind).toBe('paragraph');
    expect(result.previewBlocks?.[1].kind).toBe('math');
  });

  it('supports Greek letters, relations, delimiters and large operators', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\[\\lim_{n\\to\\infty}\\sum_{i=1}^{n}\\left(\\frac{\\alpha_i}{\\beta}\\right)\\]\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('requires amssymb for mathbb', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n\\[x\\in\\mathbb{R}\\]\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('amssymb');
  });

  it('renders amsmath structures safely', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage{amsmath}\n\\begin{document}\n'
      + '\\begin{align*}x&=1\\\\y&=2\\end{align*}\n'
      + '\\[f(x)=\\begin{cases}x^2,&\\text{si }x\\ge0\\\\-x,&\\text{si }x<0\\end{cases}\\]\n'
      + '\\[A=\\begin{bmatrix}1&0\\\\0&1\\end{bmatrix}\\]\n'
      + '\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.previewBlocks?.filter((block) => block.kind === 'math')).toHaveLength(3);
  });

  it('represents numbered equations without compiling LaTeX', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\begin{equation}\\boxed{x=1}\\end{equation}\n'
      + '\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('amsmath');
  });

  it('supports restricted newcommand and DeclareMathOperator declarations', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage{amsmath}\n\\usepackage{amssymb}\n'
      + '\\newcommand{\\R}{\\mathbb{R}}\n'
      + '\\DeclareMathOperator{\\Ker}{Ker}\n'
      + '\\begin{document}\n\\[\\Ker(T)\\subseteq\\R\\]\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('represents theorem and proof environments with amsthm', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\usepackage{amsthm}\n'
      + '\\newtheorem{teorema}{Teorema}\n'
      + '\\begin{document}\n'
      + '\\begin{teorema}Si \\(n\\) es par, entonces \\(n^2\\) es par.\\end{teorema}\n'
      + '\\begin{proof}Escribe \\(n=2k\\).\\end{proof}\n'
      + '\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.previewBlocks?.filter((block) => block.kind === 'formal')).toHaveLength(2);
  });

  it('reports an understandable delimiter error and keeps a partial preview', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nTexto visible.\n\\(x+1\n\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Falta \\) para cerrar la expresión matemática en línea.');
    expect(result.previewBlocks?.length).toBeGreaterThan(0);
  });

  it('rejects declarations placed in the document body', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\newcommand{\\R}{\\mathbb{R}}\n\\[x\\in\\mathbb{R}\\]\n'
      + '\\end{document}',
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Las declaraciones de comandos y entornos deben colocarse en el preámbulo.',
    );
  });

  it('distinguishes an internal reference from a bibliographic citation', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\section{Método}\\label{sec:metodo}\n'
      + 'Véase la Sección \\ref{sec:metodo} y la fuente \\cite{torres-calculo}.\n'
      + '\\begin{thebibliography}{9}\n'
      + '\\bibitem{torres-calculo} Ana Torres. Fuente pedagógica ficticia.\n'
      + '\\end{thebibliography}\n'
      + '\\end{document}',
    );

    expect(result.valid).toBe(true);
    expect(result.paragraphs.join(' ')).toContain('Sección 1');
    expect(result.paragraphs.join(' ')).toContain('fuente [1]');
    expect(result.references[0]).toMatchObject({ command: 'ref', value: '1' });
    expect(result.citations[0]).toMatchObject({ value: '[1]' });
    expect(result.bibliographyEntries[0].key).toBe('torres-calculo');
    expect(result.bibliographyLimitations.join(' ')).toMatch(/simulación segura/i);
  });

  it('extracts the project outline and table of contents safely', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\tableofcontents\n'
      + '\\section{Introducción}\n'
      + '\\subsection{Objetivo}\n'
      + '\\section{Resultados}\n'
      + '\\end{document}',
    );

    expect(result.valid).toBe(true);
    expect(result.hasTableOfContents).toBe(true);
    expect(result.outline).toEqual([
      { level: 'section', number: '1', title: 'Introducción' },
      { level: 'subsection', number: '1.1', title: 'Objetivo' },
      { level: 'section', number: '2', title: 'Resultados' },
    ]);
  });

  it('recognizes formatting and nested lists without executing arbitrary LaTeX', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\textbf{Objetivos}\n'
      + '\\begin{enumerate}\n'
      + '\\item Preparar datos.\n'
      + '\\begin{itemize}\n'
      + '\\item Revisar valores.\n'
      + '\\end{itemize}\n'
      + '\\end{enumerate}\n'
      + '\\end{document}',
    );

    expect(result.valid).toBe(true);
    expect(result.formattingUses).toEqual([
      { command: 'textbf', text: 'Objetivos' },
    ]);
    const list = result.previewBlocks?.find((block) => block.kind === 'list');
    expect(list).toMatchObject({
      kind: 'list',
      ordered: true,
      items: [{ children: expect.any(Array) }],
    });
    if (list?.kind === 'list') {
      expect(list.items[0].children.some((block) => block.kind === 'list')).toBe(true);
    }
  });

  it('renders dollar-delimited inline mathematics safely', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\nSea $x^{10}$ una potencia.\n\\end{document}',
    );
    const paragraph = result.previewBlocks?.[0];
    expect(result.valid).toBe(true);
    expect(paragraph?.kind).toBe('paragraph');
    if (paragraph?.kind === 'paragraph') {
      expect(paragraph.inlines.some((inline) => inline.kind === 'math' && inline.source === 'x^{10}')).toBe(true);
    }
  });

  it('detects unknown commands consistently in simple and structured documents', () => {
    const bodies = [
      '\\desconocido',
      '$x$ \\desconocido',
      '$$x$$ \\desconocido',
      '\\(x\\) \\desconocido',
      '\\section{Datos} \\desconocido',
      '\\begin{itemize}\\item Uno\\end{itemize} \\desconocido',
    ];
    for (const body of bodies) {
      const result = parseSafeLatexPreview(
        `\\documentclass{article}\n\\begin{document}\n${body}\n\\end{document}`,
      );
      expect(result.unsupportedCommands, body).toContain('\\desconocido');
      expect(result.valid, body).toBe(false);
    }
  });

  it('does not report supported structures or declared safe commands', () => {
    const code = String.raw`\documentclass{article}
\usepackage{amsmath}
\newcommand{\R}{R}
\begin{document}
\section{Datos}
\begin{equation*}x=1\end{equation*}
\begin{align}y&=2\end{align}
$\R$
\end{document}`;
    const result = parseSafeLatexPreview(code);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.valid).toBe(true);
  });

  it('detects unknown commands inside projected structures without duplicates', () => {
    const result = parseSafeLatexPreview(String.raw`\documentclass{article}
\usepackage{graphicx}
\usepackage{booktabs}
\begin{document}
\begin{abstract}Resumen \oculto{A}.\end{abstract}
\begin{table}\begin{tabular}{l}\oculto{B}\\\end{tabular}\end{table}
\begin{figure}\oculto\includegraphics{imagen.png}\end{figure}
\begin{thebibliography}{9}\bibitem{fuente} Fuente \oculto{C}.
\end{thebibliography}
\end{document}`);
    expect(result.unsupportedCommands).toEqual(['\\oculto']);
    expect(result.valid).toBe(false);
    expect(result.tables).toHaveLength(1);
    expect(result.figures).toHaveLength(1);
    expect(result.bibliographyEntries).toHaveLength(1);
  });

  it('rejects unknown environments while preserving supported environments', () => {
    const invalid = parseSafeLatexPreview(String.raw`\documentclass{article}
\begin{document}
\begin{tabluar}Texto\end{tabluar}
\end{document}`);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('Entorno "tabluar" no soportado por la vista previa segura.');

    const valid = parseSafeLatexPreview(String.raw`\documentclass{article}
\usepackage{amsmath}
\usepackage{amsthm}
\newtheorem{teorema}{Teorema}
\begin{document}
\begin{equation*}x=1\end{equation*}
\begin{align}y&=2\end{align}
\[f(x)=\begin{cases}x,&x>0\end{cases}\]
\begin{teorema}Texto.\end{teorema}
\end{document}`);
    expect(valid.valid).toBe(true);
  });

  it('treats double-dollar mathematics as one display block', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n$$f(x)$$\n\\end{document}',
    );
    expect(result.valid).toBe(true);
    expect(result.previewBlocks).toEqual([
      expect.objectContaining({ kind: 'math', source: 'f(x)' }),
    ]);
  });

  it('preserves strong, emphasis, Unicode and nested formatting as safe nodes', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\textbf{Álgebra y \\textit{método}}; \\textbf{niñez}.\n'
      + '\\end{document}',
    );
    const paragraph = result.previewBlocks?.[0];
    expect(paragraph?.kind).toBe('paragraph');
    if (paragraph?.kind === 'paragraph') {
      const strong = paragraph.inlines.filter((inline) => inline.kind === 'strong');
      expect(strong).toHaveLength(2);
      expect(strong[0]).toMatchObject({
        kind: 'strong',
        children: expect.arrayContaining([expect.objectContaining({ kind: 'emphasis' })]),
      });
    }
    expect(result.unsupportedCommands).toEqual([]);
  });

  it('represents section, subsection and subsubsection with distinct levels', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\section{Datos}\n\\subsection{Muestra}\n\\subsubsection{Criterios}\n'
      + '\\end{document}',
    );
    expect(result.previewBlocks?.filter((block) => block.kind === 'heading').map((block) => (
      block.kind === 'heading' ? [block.level, block.number] : null
    ))).toEqual([[1, '1'], [2, '1.1'], [3, '1.1.1']]);
  });

  it('keeps three mixed list levels as nested semantic blocks', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\begin{itemize}\\item Nivel uno'
      + '\\begin{enumerate}\\item Nivel dos'
      + '\\begin{itemize}\\item Nivel tres\\end{itemize}'
      + '\\end{enumerate}\\end{itemize}\n'
      + '\\end{document}',
    );
    const first = result.previewBlocks?.find((block) => block.kind === 'list');
    expect(first).toMatchObject({ kind: 'list', ordered: false });
    if (first?.kind === 'list') {
      const second = first.items[0].children.find((block) => block.kind === 'list');
      expect(second).toMatchObject({ kind: 'list', ordered: true });
      if (second?.kind === 'list') {
        expect(second.items[0].children.find((block) => block.kind === 'list'))
          .toMatchObject({ kind: 'list', ordered: false });
      }
    }
  });

  it('keeps textbf at the start of a list item as a strong safe inline', () => {
    const result = parseSafeLatexPreview(
      '\\documentclass{article}\n\\begin{document}\n'
      + '\\begin{itemize}\\item \\textbf{Álgebra}: revisar términos.'
      + '\\item Varios \\textbf{datos} y \\textbf{métodos}.\\end{itemize}\n'
      + '\\end{document}',
    );
    const list = result.previewBlocks?.find((block) => block.kind === 'list');
    expect(list?.kind).toBe('list');
    if (list?.kind === 'list') {
      const firstParagraph = list.items[0].children[0];
      const secondParagraph = list.items[1].children[0];
      expect(firstParagraph.kind).toBe('paragraph');
      if (firstParagraph.kind === 'paragraph') {
        expect(firstParagraph.inlines[0]).toMatchObject({ kind: 'strong' });
      }
      if (secondParagraph?.kind === 'paragraph') {
        expect(secondParagraph.inlines.filter((inline) => inline.kind === 'strong')).toHaveLength(2);
      }
    }
  });
});
