export interface SafeFootnotePreview {
  number: number;
  text: string;
}

export interface SafeFootnotePreviewResult {
  footnotes: SafeFootnotePreview[];
  remainingBody: string;
  errors: string[];
  directFootnoteCount: number;
  footnotemarkCount: number;
  footnotetextCount: number;
  pairedFootnoteCount: number;
  hasDetachedDirectFootnote: boolean;
}

interface SourceRange {
  start: number;
  end: number;
}

interface ParsedGroup {
  content: string;
  end: number;
}

interface MutableFootnote {
  number: number;
  text: string | null;
}

const TABULAR_PATTERN = /\\begin\{tabular\}(?:\{(?:[^{}]|\{[^{}]*\})*\})?[\s\S]*?\\end\{tabular\}/g;
const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

function findTabularRanges(source: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  const pattern = new RegExp(TABULAR_PATTERN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }
  return ranges;
}

function isInsideRange(index: number, ranges: SourceRange[]): boolean {
  return ranges.some((range) => index >= range.start && index < range.end);
}

function skipWhitespace(source: string, start: number): number {
  let index = start;
  while (index < source.length && /\s/.test(source[index])) index++;
  return index;
}

function parseGroup(
  source: string,
  start: number,
  open: '{' | '[',
  close: '}' | ']',
): ParsedGroup | null {
  if (source[start] !== open) return null;
  let depth = 0;
  for (let index = start; index < source.length; index++) {
    if (source[index] === '\\') {
      index++;
      continue;
    }
    if (source[index] === open) {
      depth++;
    } else if (source[index] === close) {
      depth--;
      if (depth === 0) {
        return {
          content: source.slice(start + 1, index),
          end: index + 1,
        };
      }
    }
  }
  return null;
}

function commandAt(source: string, index: number, command: string): boolean {
  if (!source.startsWith(command, index)) return false;
  return !/[A-Za-z]/.test(source[index + command.length] ?? '');
}

function superscript(number: number): string {
  return String(number)
    .split('')
    .map((digit) => SUPERSCRIPT_DIGITS[digit] ?? digit)
    .join('');
}

function plainFootnoteText(source: string): string {
  let result = source;
  let previous = '';
  while (result !== previous) {
    previous = result;
    result = result.replace(/\\(?:textbf|textit|emph)\{([^{}]*)\}/g, '$1');
  }
  return result
    .replace(/\\([%&_#{}])/g, '$1')
    .replace(/\\[A-Za-z]+(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSafeFootnotePreview(body: string): SafeFootnotePreviewResult {
  const errors: string[] = [];
  const ranges = findTabularRanges(body);
  const notes: MutableFootnote[] = [];
  const pendingMarks: number[] = [];
  let remainingBody = '';
  let directFootnoteCount = 0;
  let footnotemarkCount = 0;
  let footnotetextCount = 0;
  let pairedFootnoteCount = 0;
  let hasDetachedDirectFootnote = false;

  for (let index = 0; index < body.length;) {
    const command = commandAt(body, index, '\\footnotetext')
      ? '\\footnotetext'
      : commandAt(body, index, '\\footnotemark')
        ? '\\footnotemark'
        : commandAt(body, index, '\\footnote')
          ? '\\footnote'
          : null;

    if (!command) {
      remainingBody += body[index];
      index++;
      continue;
    }

    const commandStart = index;
    index += command.length;
    let argumentStart = skipWhitespace(body, index);
    if (body[argumentStart] === '[') {
      const optional = parseGroup(body, argumentStart, '[', ']');
      errors.push('La numeración manual de notas no está disponible en esta sección.');
      if (!optional) {
        index = body.length;
        continue;
      }
      index = optional.end;
      argumentStart = skipWhitespace(body, index);
    }

    const insideTabular = isInsideRange(commandStart, ranges);

    if (command === '\\footnotemark') {
      footnotemarkCount++;
      const number = notes.length + 1;
      notes.push({ number, text: null });
      pendingMarks.push(notes.length - 1);
      remainingBody += superscript(number);
      index = argumentStart;
      continue;
    }

    const group = parseGroup(body, argumentStart, '{', '}');
    if (!group) {
      errors.push(`${command} necesita un argumento entre llaves correctamente cerrado.`);
      index = argumentStart < body.length ? body.length : argumentStart;
      continue;
    }
    index = group.end;
    const text = plainFootnoteText(group.content);

    if (command === '\\footnote') {
      directFootnoteCount++;
      const number = notes.length + 1;
      notes.push({ number, text });
      remainingBody += superscript(number);
      if (text === '') {
        errors.push('Cada \\footnote debe contener una aclaración.');
      }
      if (insideTabular) {
        errors.push('Dentro de tabular usa \\footnotemark y coloca \\footnotetext después de la tabla.');
      }
      if (commandStart === 0 || /\s/.test(body[commandStart - 1])) {
        hasDetachedDirectFootnote = true;
      }
      continue;
    }

    footnotetextCount++;
    if (insideTabular) {
      errors.push('\\footnotetext debe colocarse fuera y después de tabular.');
    }
    if (text === '') {
      errors.push('Cada \\footnotetext debe contener una aclaración.');
    }
    const pendingIndex = pendingMarks.shift();
    if (pendingIndex === undefined) {
      errors.push('\\footnotetext necesita una \\footnotemark anterior.');
    } else {
      notes[pendingIndex].text = text;
      pairedFootnoteCount++;
    }
  }

  if (pendingMarks.length > 0) {
    errors.push('Cada \\footnotemark necesita una \\footnotetext posterior.');
  }

  return {
    footnotes: notes
      .filter((note): note is SafeFootnotePreview => note.text !== null)
      .map((note) => ({ number: note.number, text: note.text })),
    remainingBody,
    errors,
    directFootnoteCount,
    footnotemarkCount,
    footnotetextCount,
    pairedFootnoteCount,
    hasDetachedDirectFootnote,
  };
}
