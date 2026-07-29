import katex from 'katex';
import { getFriendlyKatexError } from './getFriendlyKatexError';

export interface SafeMathInlineText {
  kind: 'text';
  text: string;
}

export interface SafeMathInlineFormula {
  kind: 'math';
  source: string;
  html: string;
}

export interface SafeMathInlineFormat {
  kind: 'strong' | 'emphasis' | 'underline';
  children: SafeMathInline[];
}

export type SafeMathInline =
  | SafeMathInlineText
  | SafeMathInlineFormula
  | SafeMathInlineFormat;

export interface SafeMathListItem {
  children: SafeMathPreviewBlock[];
}

export type SafeMathPreviewBlock =
  | { kind: 'paragraph'; inlines: SafeMathInline[] }
  | { kind: 'math'; source: string; html: string }
  | { kind: 'equation'; source: string; html: string; number: number }
  | { kind: 'formal'; title: string; children: SafeMathPreviewBlock[] }
  | {
    kind: 'heading';
    level: 1 | 2 | 3;
    number: string | null;
    inlines: SafeMathInline[];
  }
  | { kind: 'list'; ordered: boolean; items: SafeMathListItem[] };

export interface SafeMathPreviewParseResult {
  blocks: SafeMathPreviewBlock[];
  errors: string[];
}

interface MathContext {
  macros: Record<string, string>;
  theoremNames: Map<string, string>;
  packages: Set<string>;
}

interface ParseState {
  equationNumber: number;
  sectionNumber: number;
  subsectionNumber: number;
  subsubsectionNumber: number;
}

const FORBIDDEN_MACRO_CONTENT =
  /\\(?:input|include|includegraphics|write|openout|read|href|url|html|class|style)\b/i;

function parsePreambleContext(
  preamble: string,
  packages: Set<string>,
  errors: string[],
): MathContext {
  const macros: Record<string, string> = {};
  const theoremNames = new Map<string, string>();

  const newCommandPattern =
    /\\newcommand\s*\{(\\[A-Za-z]+)\}\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let commandMatch: RegExpExecArray | null;
  while ((commandMatch = newCommandPattern.exec(preamble)) !== null) {
    const [, name, definition] = commandMatch;
    if (definition.length > 200 || FORBIDDEN_MACRO_CONTENT.test(definition)) {
      errors.push(`La definición segura de ${name} contiene contenido no permitido.`);
      continue;
    }
    macros[name] = definition;
  }

  const operatorPattern =
    /\\DeclareMathOperator\s*\{(\\[A-Za-z]+)\}\s*\{([^{}]+)\}/g;
  let operatorMatch: RegExpExecArray | null;
  while ((operatorMatch = operatorPattern.exec(preamble)) !== null) {
    const [, name, label] = operatorMatch;
    if (label.length > 80 || /[\\{}]/.test(label)) {
      errors.push(`La declaración segura de ${name} no es válida.`);
      continue;
    }
    macros[name] = `\\operatorname{${label}}`;
  }

  const theoremPattern =
    /\\newtheorem\s*\{([A-Za-z][A-Za-z0-9-]*)\}\s*\{([^{}]+)\}/g;
  let theoremMatch: RegExpExecArray | null;
  while ((theoremMatch = theoremPattern.exec(preamble)) !== null) {
    theoremNames.set(theoremMatch[1], theoremMatch[2].trim());
  }

  return { macros, theoremNames, packages };
}

function renderMath(
  source: string,
  displayMode: boolean,
  context: MathContext,
  errors: string[],
): string | null {
  try {
    return katex.renderToString(source.trim(), {
      displayMode,
      throwOnError: true,
      output: 'htmlAndMathml',
      trust: false,
      strict: 'warn',
      maxExpand: 100,
      macros: context.macros,
    });
  } catch (error) {
    const technical = error instanceof Error ? error.message : 'Error matemático desconocido';
    const friendly = getFriendlyKatexError(technical);
    errors.push(`No se pudo representar la fórmula: ${friendly.friendly}`);
    return null;
  }
}

function normalizePlainText(text: string): string {
  return text
    .replace(/\\\\/g, '\n')
    .replace(/\\noindent(?![A-Za-z])/g, '')
    .replace(/\\[%$&_#{}]/g, (match) => match.slice(1))
    .replace(/[ \t]*\n[ \t]*/g, ' ')
    .replace(/[ \t]{2,}/g, ' ');
}

function findClosingBrace(source: string, openingIndex: number): number {
  let depth = 0;
  for (let index = openingIndex; index < source.length; index++) {
    if (source[index] === '\\') {
      index++;
      continue;
    }
    if (source[index] === '{') depth++;
    if (source[index] === '}') {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function pushPlainInline(inlines: SafeMathInline[], text: string): void {
  const normalized = normalizePlainText(text);
  if (!normalized) return;
  const previous = inlines.at(-1);
  if (previous?.kind === 'text') {
    previous.text += normalized;
  } else {
    inlines.push({ kind: 'text', text: normalized });
  }
}

function parseRichText(text: string): SafeMathInline[] {
  const inlines: SafeMathInline[] = [];
  const commandPattern = /\\(textbf|textit|emph|underline)(?![A-Za-z])\s*\{/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = commandPattern.exec(text)) !== null) {
    pushPlainInline(inlines, text.slice(cursor, match.index));
    const openingIndex = commandPattern.lastIndex - 1;
    const closingIndex = findClosingBrace(text, openingIndex);
    if (closingIndex === -1) {
      pushPlainInline(inlines, text.slice(match.index));
      return inlines;
    }
    const command = match[1];
    inlines.push({
      kind: command === 'textbf'
        ? 'strong'
        : command === 'underline'
          ? 'underline'
          : 'emphasis',
      children: parseRichText(text.slice(openingIndex + 1, closingIndex).trim()),
    });
    cursor = closingIndex + 1;
    commandPattern.lastIndex = cursor;
  }
  pushPlainInline(inlines, text.slice(cursor));
  return inlines;
}

function appendPlainText(
  text: string,
  blocks: SafeMathPreviewBlock[],
  current: SafeMathInline[],
): SafeMathInline[] {
  const parts = text.split(/\n\s*\n/);
  let active = current;
  parts.forEach((part, index) => {
    active.push(...parseRichText(part.trim()));
    if (index < parts.length - 1 && active.length > 0) {
      blocks.push({ kind: 'paragraph', inlines: active });
      active = [];
    }
  });
  return active;
}

function findNextToken(
  body: string,
  from: number,
  context: MathContext,
): {
  index: number;
  type: 'inline' | 'dollar' | 'display' | 'environment' | 'heading' | 'list';
  name?: string;
} | null {
  const candidates: Array<{
    index: number;
    type: 'inline' | 'dollar' | 'display' | 'environment' | 'heading' | 'list';
    name?: string;
  }> = [];
  const inline = body.indexOf('\\(', from);
  const display = body.indexOf('\\[', from);
  if (inline !== -1) candidates.push({ index: inline, type: 'inline' });
  if (display !== -1) candidates.push({ index: display, type: 'display' });
  for (let index = from; index < body.length; index++) {
    if (body[index] === '$' && (index === 0 || body[index - 1] !== '\\')) {
      candidates.push({ index, type: 'dollar' });
      break;
    }
  }

  const environmentNames = ['align*', 'equation', 'proof', ...context.theoremNames.keys()];
  for (const name of environmentNames) {
    const index = body.indexOf(`\\begin{${name}}`, from);
    if (index !== -1) candidates.push({ index, type: 'environment', name });
  }

  for (const name of ['itemize', 'enumerate']) {
    const index = body.indexOf(`\\begin{${name}}`, from);
    if (index !== -1) candidates.push({ index, type: 'list', name });
  }

  const headingMatch = body.slice(from).match(/\\(section|subsection|subsubsection)\*?(?![A-Za-z])\s*\{/);
  if (headingMatch?.index !== undefined) {
    candidates.push({
      index: from + headingMatch.index,
      type: 'heading',
      name: headingMatch[1],
    });
  }

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => a.index - b.index)[0];
}

function findClosingDollar(body: string, from: number): number {
  for (let index = from; index < body.length; index++) {
    if (body[index] === '$' && body[index - 1] !== '\\') return index;
  }
  return -1;
}

function findEnvironmentEnd(body: string, start: number, name: string): number {
  const pattern = new RegExp(`\\\\(begin|end)\\{${name}\\}`, 'g');
  pattern.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    if (match[1] === 'begin') depth++;
    if (match[1] === 'end') {
      depth--;
      if (depth === 0) return match.index;
    }
  }
  return -1;
}

function splitListItems(content: string): string[] {
  const items: string[] = [];
  const tokenPattern = /\\(begin|end)\{(itemize|enumerate)\}|\\item(?![A-Za-z])/g;
  let depth = 0;
  let itemStart = -1;
  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(content)) !== null) {
    if (match[1] === 'begin') {
      depth++;
      continue;
    }
    if (match[1] === 'end') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) {
      if (itemStart !== -1) items.push(content.slice(itemStart, match.index).trim());
      itemStart = tokenPattern.lastIndex;
    }
  }
  if (itemStart !== -1) items.push(content.slice(itemStart).trim());
  return items.filter(Boolean);
}

function parseBodyBlocks(
  body: string,
  context: MathContext,
  errors: string[],
  state: ParseState,
): SafeMathPreviewBlock[] {
  const blocks: SafeMathPreviewBlock[] = [];
  let current: SafeMathInline[] = [];
  let cursor = 0;

  const flushParagraph = () => {
    if (current.length > 0) {
      blocks.push({ kind: 'paragraph', inlines: current });
      current = [];
    }
  };

  while (cursor < body.length) {
    const token = findNextToken(body, cursor, context);
    if (!token) {
      current = appendPlainText(body.slice(cursor), blocks, current);
      break;
    }

    current = appendPlainText(body.slice(cursor, token.index), blocks, current);

    if (token.type === 'inline' || token.type === 'dollar' || token.type === 'display') {
      const close = token.type === 'inline' ? '\\)' : token.type === 'display' ? '\\]' : '$';
      const openingLength = token.type === 'dollar' ? 1 : 2;
      const end = token.type === 'dollar'
        ? findClosingDollar(body, token.index + 1)
        : body.indexOf(close, token.index + openingLength);
      if (end === -1) {
        errors.push(
          token.type === 'inline'
            ? 'Falta \\) para cerrar la expresión matemática en línea.'
            : token.type === 'dollar'
              ? 'Falta $ para cerrar la expresión matemática en línea.'
            : 'Falta \\] para cerrar la expresión matemática en bloque.',
        );
        current = appendPlainText(body.slice(token.index + openingLength), blocks, current);
        break;
      }
      const source = body.slice(token.index + openingLength, end);
      const html = renderMath(source, token.type === 'display', context, errors);
      if (html !== null) {
        if (token.type === 'inline' || token.type === 'dollar') {
          current.push({ kind: 'math', source, html });
        } else {
          flushParagraph();
          blocks.push({ kind: 'math', source, html });
        }
      }
      cursor = end + close.length;
      continue;
    }

    if (token.type === 'heading') {
      const commandMatch = body.slice(token.index).match(
        /^\\(section|subsection|subsubsection)(\*)?(?![A-Za-z])\s*\{/,
      );
      if (!commandMatch) {
        cursor = token.index + 1;
        continue;
      }
      const openingIndex = token.index + commandMatch[0].lastIndexOf('{');
      const closingIndex = findClosingBrace(body, openingIndex);
      if (closingIndex === -1) {
        errors.push(`Falta } para cerrar \\${token.name}.`);
        cursor = openingIndex + 1;
        continue;
      }
      flushParagraph();
      const starred = Boolean(commandMatch[2]);
      const level = token.name === 'section' ? 1 : token.name === 'subsection' ? 2 : 3;
      let number: string | null = null;
      if (!starred) {
        if (level === 1) {
          state.sectionNumber++;
          state.subsectionNumber = 0;
          state.subsubsectionNumber = 0;
          number = String(state.sectionNumber);
        } else if (level === 2) {
          state.subsectionNumber++;
          state.subsubsectionNumber = 0;
          number = `${state.sectionNumber}.${state.subsectionNumber}`;
        } else {
          state.subsubsectionNumber++;
          number = `${state.sectionNumber}.${state.subsectionNumber}.${state.subsubsectionNumber}`;
        }
      }
      blocks.push({
        kind: 'heading',
        level,
        number,
        inlines: parseRichText(body.slice(openingIndex + 1, closingIndex)),
      });
      cursor = closingIndex + 1;
      continue;
    }

    if (token.type === 'list') {
      const name = token.name!;
      const beginTag = `\\begin{${name}}`;
      const endTag = `\\end{${name}}`;
      const end = findEnvironmentEnd(body, token.index, name);
      if (end === -1) {
        errors.push(`Falta ${endTag} para cerrar el entorno ${name}.`);
        cursor = token.index + beginTag.length;
        continue;
      }
      flushParagraph();
      const source = body.slice(token.index + beginTag.length, end);
      blocks.push({
        kind: 'list',
        ordered: name === 'enumerate',
        items: splitListItems(source).map((item) => ({
          children: parseBodyBlocks(item, context, errors, state),
        })),
      });
      cursor = end + endTag.length;
      continue;
    }

    const name = token.name!;
    const beginTag = `\\begin{${name}}`;
    const endTag = `\\end{${name}}`;
    const end = body.indexOf(endTag, token.index + beginTag.length);
    if (end === -1) {
      errors.push(`Falta ${endTag} para cerrar el entorno ${name}.`);
      cursor = token.index + beginTag.length;
      continue;
    }

    flushParagraph();
    const source = body.slice(token.index + beginTag.length, end).trim();
    if (name === 'align*') {
      const html = renderMath(`\\begin{aligned}${source}\\end{aligned}`, true, context, errors);
      if (html !== null) blocks.push({ kind: 'math', source, html });
    } else if (name === 'equation') {
      const html = renderMath(source, true, context, errors);
      if (html !== null) {
        blocks.push({ kind: 'equation', source, html, number: state.equationNumber });
        state.equationNumber += 1;
      }
    } else {
      const title = name === 'proof'
        ? 'Demostración'
        : context.theoremNames.get(name) ?? name;
      const children = parseBodyBlocks(source, context, errors, state);
      blocks.push({ kind: 'formal', title, children });
    }
    cursor = end + endTag.length;
  }

  flushParagraph();
  return blocks;
}

export function parseSafeMathPreview(
  body: string,
  preamble: string,
  packageNames: string[],
): SafeMathPreviewParseResult {
  const errors: string[] = [];
  const packages = new Set(packageNames);
  const context = parsePreambleContext(preamble, packages, errors);

  if (/\\mathbb(?![A-Za-z])/.test(body) && !packages.has('amssymb')) {
    errors.push('Añade \\usepackage{amssymb} en el preámbulo para usar \\mathbb.');
  }
  if (
    /\\begin\{(?:align\*|cases|[pbvBV]?matrix)\}|\\(?:boxed|binom|text|iint|iiint|xrightarrow|implies|iff)(?![A-Za-z])/.test(body)
    && !packages.has('amsmath')
  ) {
    errors.push('Añade \\usepackage{amsmath} en el preámbulo para esta estructura matemática.');
  }
  if (
    (/\\begin\{proof\}/.test(body) || [...context.theoremNames.keys()].some((name) => body.includes(`\\begin{${name}}`)))
    && !packages.has('amsthm')
  ) {
    errors.push('Añade \\usepackage{amsthm} en el preámbulo para los entornos formales.');
  }

  return {
    blocks: parseBodyBlocks(body, context, errors, {
      equationNumber: 1,
      sectionNumber: 0,
      subsectionNumber: 0,
      subsubsectionNumber: 0,
    }),
    errors,
  };
}
