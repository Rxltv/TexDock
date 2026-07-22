export interface LatexPackage {
  name: string;
  options: string | null;
}

export interface SafeLatexPreviewResult {
  valid: boolean;
  documentClass: string | null;
  documentClassOption: string | null;
  packages: LatexPackage[];
  title: string | null;
  author: string | null;
  date: string | null;
  hasMaketitle: boolean;
  abstractLabel: string | null;
  abstractParagraphs: string[];
  paragraphs: string[];
  unsupportedCommands: string[];
  errors: string[];
}

export interface SafeLatexPreviewOptions {
  now?: Date;
}

const STRUCTURAL_BEGIN = '\\begin{document}';
const STRUCTURAL_END = '\\end{document}';
const ABSTRACT_BEGIN = '\\begin{abstract}';
const ABSTRACT_END = '\\end{abstract}';
const MANUAL_BREAK = '\u0000';

function stripLineComment(line: string): string {
  let result = '';
  let i = 0;
  while (i < line.length) {
    if (line[i] === '\\' && i + 1 < line.length && line[i + 1] === '%') {
      result += '%';
      i += 2;
    } else if (line[i] === '%') {
      break;
    } else {
      result += line[i];
      i++;
    }
  }
  return result;
}

function stripAllComments(latex: string): string {
  return latex.split('\n').map(stripLineComment).join('\n');
}

function stripUnsupportedCommands(line: string): string {
  return line.replace(/\\([a-zA-Z]+)(\{[^}]*\})?/g, '').trim();
}

function buildParagraphs(text: string): string[] {
  const lines = text.split('\n').map(stripUnsupportedCommands);
  const paragraphs: string[] = [];
  let visualLines: string[] = [];

  const flushParagraph = () => {
    if (visualLines.some((l) => l !== '')) {
      paragraphs.push(visualLines.join('\n'));
    }
    visualLines = [];
  };

  for (const line of lines) {
    if (line === '') {
      flushParagraph();
      continue;
    }
    // Un Enter simple une líneas con un espacio (comportamiento estándar de
    // LaTeX); el marcador (\\ original) crea una línea visual nueva dentro
    // del mismo párrafo.
    const parts = line.split(MANUAL_BREAK);
    if (visualLines.length === 0) {
      visualLines.push(parts[0]);
    } else {
      const last = visualLines.length - 1;
      if (visualLines[last] === '') {
        visualLines[last] = parts[0];
      } else if (parts[0] !== '') {
        visualLines[last] = `${visualLines[last]} ${parts[0]}`;
      }
    }
    for (let i = 1; i < parts.length; i++) {
      visualLines.push(parts[i].replace(/^\s+/, ''));
    }
  }
  flushParagraph();
  return paragraphs;
}

function parsePackages(preamble: string, errors: string[]): LatexPackage[] {
  const packages: LatexPackage[] = [];
  const fullPattern = /\\usepackage(?:\[([^\]]*)\])?\{([^{}]*)\}/g;
  for (const line of preamble.split('\n')) {
    const uses = line.match(/\\usepackage(?![a-zA-Z])/g);
    if (!uses) continue;
    const matches = line.match(fullPattern);
    if (!matches || matches.length !== uses.length) {
      errors.push('Línea \\usepackage incompleta o mal formada.');
      continue;
    }
    const argPattern = /\\usepackage(?:\[([^\]]*)\])?\{([^{}]*)\}/g;
    let m: RegExpExecArray | null;
    while ((m = argPattern.exec(line)) !== null) {
      const name = m[2].trim();
      if (name === '') {
        errors.push('Paquete sin nombre en \\usepackage.');
      } else {
        packages.push({ name, options: m[1] ? m[1].trim() : null });
      }
    }
  }
  return packages;
}

function parseMetadataCommand(
  preamble: string,
  command: 'title' | 'author' | 'date',
  errors: string[],
): string | null {
  const anyUse = new RegExp(`\\\\${command}(?![a-zA-Z])`).test(preamble);
  if (!anyUse) return null;
  const match = preamble.match(new RegExp(`\\\\${command}\\{([^{}]*)\\}`));
  if (!match) {
    errors.push(`Declaración de \\${command} incompleta o mal formada.`);
    return null;
  }
  return match[1].trim();
}

function resolveDate(dateDecl: string | null, spanish: boolean, now: Date): string | null {
  if (dateDecl === null) return null;
  if (dateDecl === '\\today') {
    return new Intl.DateTimeFormat(spanish ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
  }
  return dateDecl;
}

export function parseSafeLatexPreview(
  latex: string,
  options?: SafeLatexPreviewOptions,
): SafeLatexPreviewResult {
  const errors: string[] = [];
  const unsupportedCommands: string[] = [];
  const now = options?.now ?? new Date();

  const clean = stripAllComments(latex);

  const docClassMatch = clean.match(/\\documentclass(?:\[([^\]]*)\])?\{([^}]*)\}/);
  const documentClassOption: string | null = docClassMatch ? (docClassMatch[1] || null) : null;
  const documentClass: string | null = docClassMatch ? docClassMatch[2] : null;

  if (documentClass === null) {
    errors.push('Falta \\documentclass.');
  } else if (documentClass !== 'article') {
    errors.push(`Clase "${documentClass}" no soportada. Solo se admite "article".`);
  }

  const beginIndex = clean.indexOf(STRUCTURAL_BEGIN);
  const endIndex = clean.indexOf(STRUCTURAL_END);

  const hasBegin = beginIndex !== -1;
  const hasEnd = endIndex !== -1;

  if (!hasBegin) {
    errors.push('Falta \\begin{document}.');
  }
  if (!hasEnd) {
    errors.push('Falta \\end{document}.');
  }
  if (hasBegin && hasEnd && endIndex < beginIndex) {
    errors.push('\\end{document} aparece antes de \\begin{document}.');
  }

  if (!hasBegin || !hasEnd) {
    return {
      valid: errors.length === 0,
      documentClass,
      documentClassOption,
      packages: [],
      title: null,
      author: null,
      date: null,
      hasMaketitle: false,
      abstractLabel: null,
      abstractParagraphs: [],
      paragraphs: [],
      unsupportedCommands: [],
      errors,
    };
  }

  // --- Preámbulo: paquetes y metadatos ---
  const docClassEnd = docClassMatch && docClassMatch.index !== undefined
    ? docClassMatch.index + docClassMatch[0].length
    : 0;
  const preamble = clean.slice(docClassEnd, beginIndex);

  if (/\\maketitle(?![a-zA-Z])/.test(preamble)) {
    errors.push('\\maketitle debe colocarse dentro del cuerpo, no en el preámbulo.');
  }
  if (preamble.includes(ABSTRACT_BEGIN) || preamble.includes(ABSTRACT_END)) {
    errors.push('El entorno abstract debe colocarse dentro del cuerpo.');
  }

  const packages = parsePackages(preamble, errors);
  const spanish = packages.some(
    (p) => p.name === 'babel' && (p.options ?? '').split(',').map((o) => o.trim()).includes('spanish'),
  );

  const title = parseMetadataCommand(preamble, 'title', errors);
  const author = parseMetadataCommand(preamble, 'author', errors);
  const dateDecl = parseMetadataCommand(preamble, 'date', errors);
  const date = resolveDate(dateDecl, spanish, now);

  // --- Cuerpo ---
  const bodyStart = beginIndex + STRUCTURAL_BEGIN.length;
  const bodyClean = clean.slice(bodyStart, endIndex);

  if (/\\usepackage(?![a-zA-Z])/.test(bodyClean)) {
    errors.push('\\usepackage debe colocarse en el preámbulo, no dentro del cuerpo.');
  }
  if (/\\title\s*\{/.test(bodyClean)) {
    errors.push('\\title debe declararse en el preámbulo.');
  }
  if (/\\author\s*\{/.test(bodyClean)) {
    errors.push('\\author debe declararse en el preámbulo.');
  }
  if (/\\date\s*\{/.test(bodyClean)) {
    errors.push('\\date debe declararse en el preámbulo.');
  }

  // \\ en el cuerpo = salto manual de línea. Se sustituye por un marcador antes
  // de retirar comandos, para que el regex de comandos no confunda la segunda
  // barra con el inicio de un comando (p. ej. \\Segunda → \Segunda).
  let bodyMarked = bodyClean.split('\\\\').join(MANUAL_BREAK);

  const hasMaketitle = /\\maketitle(?![a-zA-Z])/.test(bodyMarked);
  if (hasMaketitle) {
    bodyMarked = bodyMarked.replace(/\\maketitle(?![a-zA-Z])/g, '');
  }

  let abstractParagraphs: string[] = [];
  let abstractLabel: string | null = null;
  const absStart = bodyMarked.indexOf(ABSTRACT_BEGIN);
  const absEnd = bodyMarked.indexOf(ABSTRACT_END);
  if (absStart !== -1 || absEnd !== -1) {
    if (absStart === -1) {
      errors.push('Falta \\begin{abstract}.');
    } else if (absEnd === -1) {
      errors.push('Falta \\end{abstract}.');
    } else if (absEnd < absStart) {
      errors.push('\\end{abstract} aparece antes de \\begin{abstract}.');
    } else {
      const inner = bodyMarked.slice(absStart + ABSTRACT_BEGIN.length, absEnd);
      abstractParagraphs = buildParagraphs(inner);
      abstractLabel = spanish ? 'Resumen' : 'Abstract';
      bodyMarked = bodyMarked.slice(0, absStart) + '\n' + bodyMarked.slice(absEnd + ABSTRACT_END.length);
    }
  }

  const seen = new Set<string>();
  const commandRegex = /\\([a-zA-Z]+)/g;
  let cmdMatch: RegExpExecArray | null;
  while ((cmdMatch = commandRegex.exec(bodyMarked)) !== null) {
    const fullMatch = cmdMatch[0];
    if (!seen.has(fullMatch)) {
      seen.add(fullMatch);
      unsupportedCommands.push(fullMatch);
    }
  }

  const paragraphs = buildParagraphs(bodyMarked);

  return {
    valid: errors.length === 0,
    documentClass,
    documentClassOption,
    packages,
    title,
    author,
    date,
    hasMaketitle,
    abstractLabel,
    abstractParagraphs,
    paragraphs,
    unsupportedCommands,
    errors,
  };
}
