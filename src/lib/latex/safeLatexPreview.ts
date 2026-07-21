export interface SafeLatexPreviewResult {
  valid: boolean;
  documentClass: string | null;
  paragraphs: string[];
  unsupportedCommands: string[];
  errors: string[];
}

const STRUCTURAL_BEGIN = '\\begin{document}';
const STRUCTURAL_END = '\\end{document}';

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

export function parseSafeLatexPreview(latex: string): SafeLatexPreviewResult {
  const errors: string[] = [];
  const unsupportedCommands: string[] = [];

  const clean = stripAllComments(latex);

  const docClassMatch = clean.match(/\\documentclass\{([^}]*)\}/);
  const documentClass: string | null = docClassMatch ? docClassMatch[1] : null;

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
      paragraphs: [],
      unsupportedCommands: [],
      errors,
    };
  }

  const bodyStart = beginIndex + STRUCTURAL_BEGIN.length;
  const bodyClean = clean.slice(bodyStart, endIndex);

  const seen = new Set<string>();
  const commandRegex = /\\([a-zA-Z]+)/g;
  let cmdMatch: RegExpExecArray | null;
  while ((cmdMatch = commandRegex.exec(bodyClean)) !== null) {
    const fullMatch = cmdMatch[0];
    if (!seen.has(fullMatch)) {
      seen.add(fullMatch);
      unsupportedCommands.push(fullMatch);
    }
  }

  const lines = bodyClean.split('\n');
  const processedLines = lines.map(stripUnsupportedCommands);

  const paragraphs: string[] = [];
  let currentBlock: string[] = [];

  for (const line of processedLines) {
    if (line === '') {
      if (currentBlock.length > 0) {
        paragraphs.push(currentBlock.join(' '));
        currentBlock = [];
      }
    } else {
      currentBlock.push(line);
    }
  }
  if (currentBlock.length > 0) {
    paragraphs.push(currentBlock.join(' '));
  }

  return {
    valid: errors.length === 0,
    documentClass,
    paragraphs,
    unsupportedCommands,
    errors,
  };
}
