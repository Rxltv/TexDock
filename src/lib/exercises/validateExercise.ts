import { parseSafeFootnotePreview } from '../latex/safeFootnotePreview';
import { parseSafeBibliographyPreview } from '../latex/safeBibliographyPreview';
import { parseSafeLatexPreview } from '../latex/safeLatexPreview';
import { parseSafeFigurePreview } from '../latex/safeFigurePreview';
import { parseSafeTablePreview } from '../latex/safeTablePreview';
import {
  parseSafeReferencePreview,
  type SafeResolvedReference,
} from '../latex/safeReferencePreview';

export type RuleType =
  | 'REQUIRE_COMMAND'
  | 'REQUIRE_ENVIRONMENT'
  | 'REQUIRE_ARGUMENT'
  | 'REQUIRE_NONEMPTY_ARGUMENT'
  | 'REQUIRE_TEXT'
  | 'REQUIRE_COUNT'
  | 'REQUIRE_PACKAGE'
  | 'REQUIRE_MATH_STRUCTURE'
  | 'REQUIRE_ORDER'
  | 'REQUIRE_FIRST_CONTENT'
  | 'REQUIRE_SENTENCE_COUNT'
  | 'REQUIRE_HEADING_STRUCTURE'
  | 'REQUIRE_TABLE_STRUCTURE'
  | 'REQUIRE_FIGURE_STRUCTURE'
  | 'REQUIRE_VALID_FOOTNOTES'
  | 'REQUIRE_FOOTNOTE_PAIR'
  | 'REQUIRE_UNIQUE_LABELS'
  | 'REQUIRE_RESOLVED_REFERENCES'
  | 'REQUIRE_VALID_LABELS'
  | 'REQUIRE_REFERENCE_PACKAGE_ORDER'
  | 'REQUIRE_REFERENCE_COUNT'
  | 'REQUIRE_VALID_BIBLIOGRAPHY'
  | 'REQUIRE_BIBITEM_COUNT'
  | 'REQUIRE_RESOLVED_CITATIONS'
  | 'REQUIRE_CITATION_COUNT'
  | 'REQUIRE_VALID_DOCUMENT'
  | 'REQUIRE_USED_PACKAGES'
  | 'REQUIRE_PROJECT_REQUIREMENTS'
  | 'REQUIRE_PARAGRAPH_COUNT'
  | 'REQUIRE_DISTINCT_LINES'
  | 'REQUIRE_NESTED_ENVIRONMENT'
  | 'REQUIRE_MATCHING_ARGUMENTS'
  | 'FORBID_ALTERNATIVE';

export type RuleScope = 'PREAMBLE' | 'BODY' | 'MATH' | 'FULL_DOCUMENT';

export type ValidationFailureCode =
  | 'MISSING_COMMAND'
  | 'MISSING_ENVIRONMENT'
  | 'WRONG_ARGUMENT'
  | 'MISSING_TEXT'
  | 'WRONG_ORDER'
  | 'INVALID_FOOTNOTE'
  | 'INVALID_REFERENCE'
  | 'INVALID_BIBLIOGRAPHY'
  | 'INVALID_CITATION'
  | 'INVALID_DOCUMENT'
  | 'UNUSED_PACKAGE'
  | 'INCOMPLETE_PROJECT'
  | 'INVALID_STRUCTURE'
  | 'FORBIDDEN_ALTERNATIVE';

const UNSUPPORTED_CODE = 'UNSUPPORTED_RULE' as const;
type UnsupportedCode = typeof UNSUPPORTED_CODE;

type RuleEvalCode = ValidationFailureCode | 'OK';

export interface ValidationRule {
  id: string;
  type: RuleType;
  required: boolean;
  scope: RuleScope;
  target?: string;
  expected?: unknown;
  arguments?: unknown;
  normalization?: string[];
  feedback: string;
  orderSensitive?: boolean;
}

export interface FailedRuleInfo {
  id: string;
  code: ValidationFailureCode;
  message: string;
  command?: string;
  argument?: string;
}

export interface UnsupportedRuleInfo {
  id: string;
  type: RuleType;
  required: boolean;
  code: UnsupportedCode;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  matchedRules: string[];
  failedRules: FailedRuleInfo[];
  unsupportedRules: UnsupportedRuleInfo[];
  feedback: string[];
}

interface RuleEvalResult {
  passed: boolean;
  code: RuleEvalCode;
  command?: string;
  argument?: string;
}

const SUPPORTED_TYPES: ReadonlySet<RuleType> = new Set([
  'REQUIRE_COMMAND',
  'REQUIRE_ENVIRONMENT',
  'REQUIRE_ARGUMENT',
  'REQUIRE_NONEMPTY_ARGUMENT',
  'REQUIRE_TEXT',
  'REQUIRE_COUNT',
  'REQUIRE_PACKAGE',
  'REQUIRE_ORDER',
  'REQUIRE_FIRST_CONTENT',
  'REQUIRE_SENTENCE_COUNT',
  'REQUIRE_HEADING_STRUCTURE',
  'REQUIRE_TABLE_STRUCTURE',
  'REQUIRE_FIGURE_STRUCTURE',
  'REQUIRE_VALID_FOOTNOTES',
  'REQUIRE_FOOTNOTE_PAIR',
  'REQUIRE_UNIQUE_LABELS',
  'REQUIRE_RESOLVED_REFERENCES',
  'REQUIRE_VALID_LABELS',
  'REQUIRE_REFERENCE_PACKAGE_ORDER',
  'REQUIRE_REFERENCE_COUNT',
  'REQUIRE_VALID_BIBLIOGRAPHY',
  'REQUIRE_BIBITEM_COUNT',
  'REQUIRE_RESOLVED_CITATIONS',
  'REQUIRE_CITATION_COUNT',
  'REQUIRE_VALID_DOCUMENT',
  'REQUIRE_USED_PACKAGES',
  'REQUIRE_PROJECT_REQUIREMENTS',
  'REQUIRE_PARAGRAPH_COUNT',
  'REQUIRE_DISTINCT_LINES',
  'REQUIRE_NESTED_ENVIRONMENT',
  'FORBID_ALTERNATIVE',
]);

function isRuleSupported(rule: ValidationRule): boolean {
  return SUPPORTED_TYPES.has(rule.type);
}

function stripComments(latex: string): string {
  return latex.split('\n').map(line => {
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
  }).join('\n');
}

function normalizeLatex(latex: string): string {
  let result = latex.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  result = stripComments(result);
  result = result.split('\n').map(line => line.trim()).join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result;
}

function extractScope(normalized: string, scope: RuleScope): string {
  const beginDocument = normalized.match(/\\begin\s*\{document\}/)?.[0] ?? '\\begin{document}';
  switch (scope) {
    case 'FULL_DOCUMENT':
      return normalized;
    case 'PREAMBLE': {
      const beginIdx = normalized.search(/\\begin\s*\{document\}/);
      if (beginIdx === -1) return normalized;
      return normalized.slice(0, beginIdx);
    }
    case 'BODY': {
      const beginIdx = normalized.search(/\\begin\s*\{document\}/);
      if (beginIdx === -1) return '';
      const firstEndIdx = normalized.search(/\\end\s*\{document\}/);
      if (firstEndIdx !== -1 && firstEndIdx < beginIdx) return '';
      const endMatch = /\\end\s*\{document\}/.exec(normalized.slice(beginIdx + beginDocument.length));
      const endIdx = endMatch ? beginIdx + beginDocument.length + endMatch.index : -1;
      if (endIdx === -1) return '';
      return normalized.slice(
        beginIdx + beginDocument.length,
        endIdx,
      );
    }
    case 'MATH': {
      const mathParts: string[] = [];
      const pattern = /\$\$([\s\S]*?)\$\$|\$((?:\\.|[^$])+)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(normalized)) !== null) {
        mathParts.push(match.slice(1).find((part) => part !== undefined) ?? '');
      }
      return mathParts.join(' ');
    }
    default:
      return normalized;
  }
}

type MathDelimiterKind = 'inline-dollar' | 'display-bracket' | 'inline-paren' | 'display-dollar';

interface MathDelimiterSpan {
  kind: MathDelimiterKind;
  source: string;
}

function scanMathDelimiters(source: string): MathDelimiterSpan[] {
  const spans: MathDelimiterSpan[] = [];
  for (let index = 0; index < source.length;) {
    if (source.startsWith('\\(', index)) {
      const end = source.indexOf('\\)', index + 2);
      if (end === -1) break;
      spans.push({ kind: 'inline-paren', source: source.slice(index + 2, end) });
      index = end + 2;
      continue;
    }
    if (source.startsWith('\\[', index)) {
      const end = source.indexOf('\\]', index + 2);
      if (end === -1) break;
      spans.push({ kind: 'display-bracket', source: source.slice(index + 2, end) });
      index = end + 2;
      continue;
    }
    if (source[index] !== '$' || source[index - 1] === '\\') {
      index++;
      continue;
    }
    if (source[index + 1] === '$') {
      const end = source.indexOf('$$', index + 2);
      if (end === -1) break;
      spans.push({ kind: 'display-dollar', source: source.slice(index + 2, end) });
      index = end + 2;
      continue;
    }
    let end = index + 1;
    while (end < source.length) {
      if (source[end] === '$' && source[end - 1] !== '\\' && source[end + 1] !== '$') break;
      end++;
    }
    if (end >= source.length) break;
    spans.push({ kind: 'inline-dollar', source: source.slice(index + 1, end) });
    index = end + 1;
  }
  return spans;
}

function extractFirstArgument(cmd: string, content: string): string | null {
  const escaped = cmd.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
  const pattern = new RegExp(escaped + '\\s*(?:\\[[^\\]]*\\])?\\s*\\{([^}]*)\\}');
  const match = pattern.exec(content);
  return match ? match[1] : null;
}

function findExactCommand(target: string, content: string): boolean {
  if (!target.startsWith('\\')) return content.includes(target);
  const escaped = target
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
  const withBoundary = escaped.replace(
    /\\([a-zA-Z]+)/,
    m => m + '(?![a-zA-Z])',
  ) + '(?![a-zA-Z])';
  return new RegExp(withBoundary).test(content);
}

function checkRequireCommand(rule: ValidationRule, content: string): RuleEvalResult {
  const target = rule.target;
  if (!target) {
    return { passed: false, code: 'MISSING_COMMAND' };
  }
  const found = findExactCommand(target, content);
  return {
    passed: found,
    code: found ? 'OK' : 'MISSING_COMMAND',
    command: target,
  };
}

function checkRequireEnvironment(rule: ValidationRule, fullContent: string): RuleEvalResult {
  const envName = rule.target || '';
  if (!envName) {
    return { passed: false, code: 'MISSING_ENVIRONMENT' };
  }
  const beginTag = `\\begin{${envName}}`;
  const endTag = `\\end{${envName}}`;
  const beginPos = fullContent.indexOf(beginTag);
  const endPos = fullContent.indexOf(endTag);

  if (beginPos === -1) {
    return { passed: false, code: 'MISSING_ENVIRONMENT', command: beginTag };
  }
  if (endPos === -1) {
    return { passed: false, code: 'MISSING_ENVIRONMENT', command: endTag };
  }
  if (endPos < beginPos) {
    return { passed: false, code: 'WRONG_ORDER', command: envName };
  }
  return { passed: true, code: 'OK' };
}

function checkRequireArgument(rule: ValidationRule, content: string): RuleEvalResult {
  const cmd = rule.target;
  const expectedRaw = rule.expected;
  if (!cmd || expectedRaw === undefined || expectedRaw === null) {
    return { passed: false, code: 'WRONG_ARGUMENT' };
  }
  const actual = extractFirstArgument(cmd, content);
  const expected = String(expectedRaw);
  if (actual === null) {
    return { passed: false, code: 'WRONG_ARGUMENT', command: cmd, argument: expected };
  }
  const match = actual.trim() === expected;
  return {
    passed: match,
    code: match ? 'OK' : 'WRONG_ARGUMENT',
    command: cmd,
    argument: expected,
  };
}

function checkNonemptyArgument(rule: ValidationRule, content: string): RuleEvalResult {
  const cmd = rule.target;
  if (!cmd) return { passed: false, code: 'WRONG_ARGUMENT' };
  const actual = extractFirstArgument(cmd, content);
  const passed = actual !== null && actual.trim() !== '';
  return {
    passed,
    code: passed ? 'OK' : 'WRONG_ARGUMENT',
    command: cmd,
  };
}

function hasVisibleProse(content: string): boolean {
  const transparent = new Set(['textbf', 'textit', 'emph', 'underline']);
  const skipCommands = new Set([
    'begin', 'end', 'label', 'ref', 'pageref', 'eqref', 'cref', 'Cref', 'cite',
    'caption', 'section', 'subsection', 'subsubsection', 'maketitle', 'tableofcontents',
    'includegraphics', 'documentclass', 'usepackage', 'title', 'author', 'date',
    'newcommand', 'newtheorem', 'DeclareMathOperator', 'bibitem', 'item',
  ]);
  const readGroup = (source: string, start: number): { value: string; end: number } | null => {
    if (source[start] !== '{') return null;
    let depth = 0;
    for (let index = start; index < source.length; index++) {
      if (source[index] === '\\') { index++; continue; }
      if (source[index] === '{') depth++;
      if (source[index] === '}' && --depth === 0) {
        return { value: source.slice(start + 1, index), end: index + 1 };
      }
    }
    return null;
  };
  const scan = (source: string): string => {
    let result = '';
    for (let index = 0; index < source.length;) {
      if (source[index] !== '\\') { result += source[index++]; continue; }
      const match = source.slice(index).match(/^\\([A-Za-z@]+)/);
      if (!match) { result += source[index++]; continue; }
      const name = match[1];
      index += match[0].length;
      while (/\s/.test(source[index] ?? '')) index++;
      while (source[index] === '[') {
        const close = source.indexOf(']', index + 1);
        index = close === -1 ? source.length : close + 1;
        while (/\s/.test(source[index] ?? '')) index++;
      }
      const group = readGroup(source, index);
      if (!group) continue;
      index = group.end;
      if (transparent.has(name)) result += scan(group.value);
      else if (!skipCommands.has(name)) continue;
    }
    return result;
  };
  return /[\p{L}\p{N}]/u.test(scan(content));
}

function checkRequireText(rule: ValidationRule, content: string): RuleEvalResult {
  const target = (rule.target || '').trim();
  if (target === '') {
    const hasContent = rule.normalization?.includes('VISIBLE_PROSE')
      ? hasVisibleProse(content.replace(/\$\$[\s\S]*?\$\$|\$[^$]+\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, ' '))
      : /\S/.test(content);
    return { passed: hasContent, code: hasContent ? 'OK' : 'MISSING_TEXT' };
  }
  const found = content.includes(target);
  return {
    passed: found,
    code: found ? 'OK' : 'MISSING_TEXT',
    argument: target,
  };
}

function checkCount(rule: ValidationRule, content: string): RuleEvalResult {
  const target = rule.target ?? '';
  const expected = Number(rule.expected);
  if (!target || !Number.isInteger(expected) || expected < 0) {
    return { passed: false, code: 'INVALID_STRUCTURE' };
  }
  let count = 0;
  let cursor = 0;
  while ((cursor = content.indexOf(target, cursor)) !== -1) {
    count++;
    cursor += target.length;
  }
  const passed = count === expected;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_STRUCTURE',
    command: target,
    argument: String(expected),
  };
}

function checkParagraphCount(rule: ValidationRule, content: string): RuleEvalResult {
  const expected = Number(rule.expected);
  const paragraphs = content
    .split(/\n[ \t]*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const passed = Number.isInteger(expected)
    && expected > 0
    && paragraphs.length === expected;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_STRUCTURE',
    argument: Number.isInteger(expected) ? String(expected) : undefined,
  };
}

function getStructuralTargets(rule: ValidationRule): string[] {
  if (Array.isArray(rule.arguments)) {
    return rule.arguments.map(String).map((target) => target.trim()).filter(Boolean);
  }
  return (rule.target ?? '').split('\u2192').map((target) => target.trim()).filter(Boolean);
}

function checkDistinctLines(rule: ValidationRule, content: string): RuleEvalResult {
  const targets = getStructuralTargets(rule);
  if (targets.length < 2) {
    return { passed: false, code: 'INVALID_STRUCTURE' };
  }
  const lines = content.split('\n');
  const positions = targets.map((target) => lines.findIndex((line) => line.includes(target)));
  const allPresent = positions.every((position) => position !== -1);
  const allDistinct = new Set(positions).size === positions.length;
  const ordered = !rule.orderSensitive
    || positions.every((position, index) => index === 0 || position > positions[index - 1]);
  const passed = allPresent && allDistinct && ordered;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_STRUCTURE',
    command: targets.find((_target, index) => positions[index] === -1),
  };
}

function checkNestedEnvironment(rule: ValidationRule, content: string): RuleEvalResult {
  const args = (
    typeof rule.arguments === 'object'
    && rule.arguments !== null
    && !Array.isArray(rule.arguments)
  ) ? rule.arguments as { parent?: unknown; child?: unknown } : {};
  const parent = String(args.parent ?? rule.target ?? '').trim();
  const child = String(args.child ?? rule.expected ?? '').trim();
  if (!parent || !child) {
    return { passed: false, code: 'INVALID_STRUCTURE' };
  }

  const stack: string[] = [];
  const pattern = /\\(begin|end)\s*\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  let passed = false;
  while ((match = pattern.exec(content)) !== null) {
    const [, action, environment] = match;
    if (action === 'begin') {
      if (environment === child && stack.includes(parent)) passed = true;
      stack.push(environment);
    } else if (stack.at(-1) === environment) {
      stack.pop();
    } else {
      return { passed: false, code: 'INVALID_STRUCTURE', command: environment };
    }
  }
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_STRUCTURE',
    command: `${child} dentro de ${parent}`,
  };
}

function checkRequireOrder(rule: ValidationRule, content: string): RuleEvalResult {
  const targets = getStructuralTargets(rule);
  if (targets.length < 2) {
    return { passed: false, code: 'INVALID_STRUCTURE' };
  }
  let cursor = 0;
  for (const t of targets) {
    const pos = content.indexOf(t, cursor);
    if (pos === -1) {
      return { passed: false, code: 'WRONG_ORDER', command: t };
    }
    cursor = pos + t.length;
  }
  return { passed: true, code: 'OK' };
}

function checkFirstContent(rule: ValidationRule, content: string): RuleEvalResult {
  const target = rule.target?.trim() ?? '';
  const passed = target !== '' && content.trimStart().startsWith(target);
  return {
    passed,
    code: passed ? 'OK' : 'WRONG_ORDER',
    command: target || undefined,
  };
}

function checkSentenceCount(rule: ValidationRule, content: string): RuleEvalResult {
  const environment = rule.target?.trim() ?? '';
  const expected = Number(rule.expected);
  const match = environment
    ? content.match(new RegExp(`\\\\begin\\{${environment}\\}([\\s\\S]*?)\\\\end\\{${environment}\\}`))
    : null;
  const text = match?.[1] ?? '';
  const visible = text.replace(/\\(?:label|caption|section|subsection|subsubsection|title|author|date)\s*(?:\[[^\]]*\])?\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const sentences = visible.split(/(?<=[.!?])(?=\s|$)/).map((part) => part.trim()).filter(Boolean);
  const count = sentences.length;
  const passed = Number.isInteger(expected) && expected > 0 && count === expected
    && sentences.every((sentence) => /[\p{L}\p{N}]/u.test(sentence) && /[.!?]$/.test(sentence));
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_STRUCTURE',
    command: environment || undefined,
    argument: Number.isInteger(expected) ? String(expected) : undefined,
  };
}

interface ExpectedHeading {
  level: 'section' | 'subsection' | 'subsubsection';
  title: string;
  starred?: boolean;
}

function checkHeadingStructure(rule: ValidationRule, content: string): RuleEvalResult {
  const args = typeof rule.arguments === 'object' && rule.arguments !== null
    ? rule.arguments as { tocFirst?: unknown; headings?: unknown }
    : {};
  const expected = Array.isArray(args.headings) ? args.headings as ExpectedHeading[] : [];
  if (expected.length === 0 || expected.some((item) => (
    !item || !['section', 'subsection', 'subsubsection'].includes(item.level) || !item.title
  ))) {
    return { passed: false, code: 'INVALID_STRUCTURE' };
  }

  const headings: ExpectedHeading[] = [];
  const pattern = /\\(section|subsection|subsubsection)(\*)?\s*\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    headings.push({
      level: match[1] as ExpectedHeading['level'],
      title: match[3].trim(),
      starred: Boolean(match[2]),
    });
  }
  const sameHeadings = headings.length === expected.length && headings.every((heading, index) => (
    heading.level === expected[index].level
    && heading.title === expected[index].title
    && Boolean(heading.starred) === Boolean(expected[index].starred)
  ));
  const tocMatches = content.match(/\\tableofcontents(?![A-Za-z])/g)?.length ?? 0;
  const firstHeading = content.search(/\\(?:section|subsection|subsubsection)\*?\s*\{/);
  const tocPosition = content.search(/\\tableofcontents(?![A-Za-z])/);
  const tocValid = !args.tocFirst || (
    tocMatches === 1 && tocPosition !== -1 && (firstHeading === -1 || tocPosition < firstHeading)
  );
  const passed = sameHeadings && tocValid;
  return { passed, code: passed ? 'OK' : 'INVALID_STRUCTURE' };
}

interface ExpectedTableCell {
  text: string;
  column?: number;
  colSpan?: number;
  rowSpan?: number;
}

function checkTableStructure(rule: ValidationRule, fullContent: string): RuleEvalResult {
  const args = typeof rule.arguments === 'object' && rule.arguments !== null
    ? rule.arguments as {
      columns?: unknown;
      rows?: unknown;
      verticalRules?: unknown;
      caption?: unknown;
      centered?: unknown;
      placement?: unknown;
      rowRules?: unknown;
      partialRules?: unknown;
      bottomRule?: unknown;
      usesBooktabs?: unknown;
    }
    : {};
  const expectedColumns = Number(args.columns);
  const expectedRows = Array.isArray(args.rows) ? args.rows as ExpectedTableCell[][] : [];
  if (!Number.isInteger(expectedColumns) || expectedColumns < 1 || expectedRows.length === 0) {
    return { passed: false, code: 'INVALID_STRUCTURE' };
  }
  const normalized = normalizeLatex(fullContent);
  const body = extractScope(normalized, 'BODY');
  const preamble = extractScope(normalized, 'PREAMBLE');
  const tablePreview = parseSafeTablePreview(body, packageNamesFromPreamble(preamble));
  if (tablePreview.errors.length > 0) {
    return {
      passed: false,
      code: 'INVALID_STRUCTURE',
      command: '\\begin{tabular}',
      argument: tablePreview.errors[0],
    };
  }
  const passed = tablePreview.tables.some((table) => {
    if (table.columns.length !== expectedColumns || table.rows.length !== expectedRows.length) return false;
    if (typeof args.verticalRules === 'boolean'
      && (table.verticalRules.length > 0) !== args.verticalRules) return false;
    if (typeof args.caption === 'string' && table.caption !== args.caption) return false;
    if (typeof args.centered === 'boolean' && table.centered !== args.centered) return false;
    if (typeof args.placement === 'string' && table.placement !== args.placement) return false;
    if (typeof args.usesBooktabs === 'boolean' && table.usesBooktabs !== args.usesBooktabs) return false;
    if (typeof args.bottomRule === 'string' && table.bottomRule !== args.bottomRule) return false;
    const rowRules = Array.isArray(args.rowRules) ? args.rowRules.map(String) : null;
    if (rowRules
      && table.rows.some((row, index) => row.ruleBefore !== rowRules[index])) return false;
    if (Array.isArray(args.partialRules)) {
      const expectedRules = args.partialRules as Array<{ start?: unknown; end?: unknown; trim?: unknown }>;
      if (table.partialRules.length !== expectedRules.length
        || table.partialRules.some((actual, index) => (
          actual.start !== Number(expectedRules[index].start)
          || actual.end !== Number(expectedRules[index].end)
          || actual.trim !== String(expectedRules[index].trim ?? '')
        ))) return false;
    }
    return table.rows.every((row, rowIndex) => {
      const expectedCells = expectedRows[rowIndex];
      return row.cells.length === expectedCells.length && row.cells.every((cell, cellIndex) => {
        const expectedCell = expectedCells[cellIndex];
        return cell.text === expectedCell.text
          && (expectedCell.column === undefined || cell.column === expectedCell.column)
          && (expectedCell.colSpan === undefined || cell.colSpan === expectedCell.colSpan)
          && (expectedCell.rowSpan === undefined || cell.rowSpan === expectedCell.rowSpan);
      });
    });
  });
  return { passed, code: passed ? 'OK' : 'INVALID_STRUCTURE', command: '\\begin{tabular}' };
}

function checkFigureStructure(rule: ValidationRule, fullContent: string): RuleEvalResult {
  const args = typeof rule.arguments === 'object' && rule.arguments !== null
    ? rule.arguments as { items?: unknown; caption?: unknown }
    : {};
  const expectedItems = Array.isArray(args.items)
    ? args.items as Array<{ fileName?: unknown; caption?: unknown; label?: unknown }>
    : [];
  if (expectedItems.length === 0) return { passed: false, code: 'INVALID_STRUCTURE' };
  const preview = parseSafeLatexPreview(fullContent);
  const body = extractScope(normalizeLatex(fullContent), 'BODY');
  const preamble = extractScope(normalizeLatex(fullContent), 'PREAMBLE');
  const figuresWithLabels = parseSafeFigurePreview(body, packageNamesFromPreamble(preamble)).figures;
  const passed = preview.figures.some((figure, figureIndex) => (
    figuresWithLabels[figureIndex]
    &&
    figure.items.length === expectedItems.length
    && (typeof args.caption !== 'string' || figure.caption === args.caption)
    && figure.items.every((item, index) => (
      item.image.fileName === expectedItems[index].fileName
      && item.caption === expectedItems[index].caption
      && (!expectedItems[index].label || figuresWithLabels[figureIndex].items[index]?.labels?.length === 1
        && figuresWithLabels[figureIndex].items[index].labels[0] === String(expectedItems[index].label))
    ))
  ));
  return { passed, code: passed ? 'OK' : 'INVALID_STRUCTURE', command: '\\begin{figure}' };
}

function checkRequirePackage(rule: ValidationRule, content: string): RuleEvalResult {
  const pkgName = rule.target;
  if (!pkgName) {
    return { passed: false, code: 'MISSING_COMMAND' };
  }
  const usepackageRegex = /\\usepackage\s*(?:\[([^\]]*)\])?\s*\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = usepackageRegex.exec(content)) !== null) {
    const name = match[2].trim();
    if (name !== pkgName) continue;
    const expectedOption = rule.expected as string | undefined;
    if (expectedOption !== undefined) {
      const actualOption = match[1] ? match[1].trim() : null;
      if (actualOption !== expectedOption) {
        return {
          passed: false,
          code: 'WRONG_ARGUMENT',
          command: `\\usepackage[${actualOption ?? ''}]{${name}}`,
          argument: expectedOption,
        };
      }
    }
    return { passed: true, code: 'OK' };
  }
  return { passed: false, code: 'MISSING_COMMAND', command: `\\usepackage{${pkgName}}` };
}

function checkForbidAlternative(rule: ValidationRule, content: string): RuleEvalResult {
  const target = rule.target;
  if (!target) {
    return { passed: true, code: 'OK' };
  }
  const forbidden = content.includes(target);
  if (forbidden) {
    return { passed: false, code: 'FORBIDDEN_ALTERNATIVE', command: target };
  }
  return { passed: true, code: 'OK' };
}

function checkValidFootnotes(content: string): RuleEvalResult {
  const parsed = parseSafeFootnotePreview(content);
  const passed = parsed.directFootnoteCount > 0
    && parsed.errors.length === 0
    && !parsed.hasDetachedDirectFootnote;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_FOOTNOTE',
    command: '\\footnote',
  };
}

function checkFootnotePair(content: string): RuleEvalResult {
  const parsed = parseSafeFootnotePreview(content);
  const passed = parsed.pairedFootnoteCount > 0
    && parsed.footnotemarkCount === parsed.footnotetextCount
    && parsed.pairedFootnoteCount === parsed.footnotemarkCount
    && parsed.errors.length === 0;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_FOOTNOTE',
    command: '\\footnotemark / \\footnotetext',
  };
}

function packageNamesFromPreamble(preamble: string): string[] {
  return [...preamble.matchAll(/\\usepackage\s*(?:\[[^\]]*\])?\s*\{([^{}]*)\}/g)]
    .flatMap((match) => match[1].split(','))
    .map((name) => name.trim())
    .filter(Boolean);
}

function analyzeReferences(normalizedFull: string) {
  const preamble = extractScope(normalizedFull, 'PREAMBLE');
  const body = extractScope(normalizedFull, 'BODY');
  return parseSafeReferencePreview(
    body,
    preamble,
    packageNamesFromPreamble(preamble),
  );
}

function hasDiagnostic(
  diagnostics: ReturnType<typeof analyzeReferences>['diagnostics'],
  codes: ReadonlySet<string>,
): boolean {
  return diagnostics.some((diagnostic) => codes.has(diagnostic.code));
}

function checkUniqueLabels(normalizedFull: string): RuleEvalResult {
  const parsed = analyzeReferences(normalizedFull);
  const labelCount = extractScope(normalizedFull, 'BODY').match(/\\label\s*\{[^{}]*\}/g)?.length ?? 0;
  const passed = labelCount > 0 && !hasDiagnostic(
    parsed.diagnostics,
    new Set(['DUPLICATE_LABEL', 'EMPTY_LABEL']),
  );
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_REFERENCE',
    command: '\\label',
  };
}

function checkResolvedReferences(normalizedFull: string): RuleEvalResult {
  const parsed = analyzeReferences(normalizedFull);
  const referenceCount = extractScope(normalizedFull, 'BODY')
    .match(/\\(?:ref|pageref|eqref|cref|Cref)\s*\{[^{}]*\}/g)?.length ?? 0;
  const passed = referenceCount > 0 && !hasDiagnostic(
    parsed.diagnostics,
    new Set([
      'UNDEFINED_REFERENCE',
      'EQREF_WRONG_OBJECT',
      'EQREF_WITHOUT_AMSMATH',
      'CLEVEREF_NOT_LOADED',
    ]),
  );
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_REFERENCE',
    command: '\\ref',
  };
}

function checkValidLabels(normalizedFull: string): RuleEvalResult {
  const parsed = analyzeReferences(normalizedFull);
  const labelCount = extractScope(normalizedFull, 'BODY').match(/\\label\s*\{[^{}]*\}/g)?.length ?? 0;
  const passed = labelCount > 0 && !hasDiagnostic(
    parsed.diagnostics,
    new Set([
      'EMPTY_LABEL',
      'LABEL_BEFORE_CAPTION',
      'LABEL_WITHOUT_NUMBERED_OBJECT',
      'WRONG_LABEL_PREFIX',
    ]),
  );
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_REFERENCE',
    command: '\\label',
  };
}

function checkReferencePackageOrder(
  rule: ValidationRule,
  normalizedFull: string,
): RuleEvalResult {
  const preamble = extractScope(normalizedFull, 'PREAMBLE');
  const packages = packageNamesFromPreamble(preamble);
  const parsed = analyzeReferences(normalizedFull);
  const target = rule.target?.trim() || 'hyperref';
  const passed = packages.includes(target) && !hasDiagnostic(
    parsed.diagnostics,
    new Set(['REFERENCE_PACKAGE_ORDER']),
  );
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_REFERENCE',
    command: `\\usepackage{${target}}`,
  };
}

function checkReferenceCount(
  rule: ValidationRule,
  normalizedFull: string,
): RuleEvalResult {
  const parsed = analyzeReferences(normalizedFull);
  const target = rule.target?.trim() ?? '';
  const expected = Number(rule.expected);
  const command = (
    typeof rule.arguments === 'object'
    && rule.arguments !== null
    && 'command' in rule.arguments
  )
    ? String((rule.arguments as { command?: unknown }).command ?? '')
    : '';
  const count = parsed.references.filter((reference: SafeResolvedReference) => (
    reference.key === target
    && (command === '' || reference.command === command)
    && (typeof rule.arguments !== 'object' || rule.arguments === null
      || !('context' in rule.arguments)
      || reference.context === String((rule.arguments as { context?: unknown }).context))
  )).length;
  const passed = target !== '' && Number.isInteger(expected) && expected >= 0 && count === expected;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_REFERENCE',
    command: command ? `\\${command}` : '\\ref',
    argument: `${target}: ${expected}`,
  };
}

function analyzeBibliography(normalizedFull: string) {
  const beginTag = '\\begin{document}';
  const endTag = '\\end{document}';
  const beginIndex = normalizedFull.indexOf(beginTag);
  const endIndex = normalizedFull.indexOf(endTag, Math.max(0, beginIndex + beginTag.length));
  const body = beginIndex !== -1 && endIndex !== -1
    ? normalizedFull.slice(beginIndex + beginTag.length, endIndex)
    : '';
  const afterDocument = endIndex !== -1
    ? normalizedFull.slice(endIndex + endTag.length)
    : '';
  return parseSafeBibliographyPreview(body, afterDocument);
}

function checkValidBibliography(normalizedFull: string): RuleEvalResult {
  const parsed = analyzeBibliography(normalizedFull);
  const invalidCodes = new Set([
    'MALFORMED_BIBLIOGRAPHY',
    'MULTIPLE_BIBLIOGRAPHIES',
    'INVALID_BIBLIOGRAPHY_WIDTH',
    'EMPTY_BIBITEM_KEY',
    'DUPLICATE_BIBITEM_KEY',
    'BIBITEM_OUTSIDE_BIBLIOGRAPHY',
    'BIBLIOGRAPHY_AFTER_DOCUMENT',
    'UNESCAPED_BIBLIOGRAPHY_AMPERSAND',
  ]);
  const passed = parsed.hasBibliography
    && !parsed.diagnostics.some((diagnostic) => invalidCodes.has(diagnostic.code));
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_BIBLIOGRAPHY',
    command: '\\begin{thebibliography}',
  };
}

function checkBibitemCount(
  rule: ValidationRule,
  normalizedFull: string,
): RuleEvalResult {
  const parsed = analyzeBibliography(normalizedFull);
  const expected = Number(rule.expected);
  const args = typeof rule.arguments === 'object' && rule.arguments !== null
    ? rule.arguments as {
      minimumWordsPerEntry?: unknown;
      distinctEntryText?: unknown;
      requireEveryEntryCited?: unknown;
    }
    : {};
  const normalizedTexts = parsed.entries.map((entry) => entry.text
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/\\(?:textbf|textit|emph)\s*\{([^{}]*)\}/g, '$1')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim());
  const minimumWords = Number(args.minimumWordsPerEntry ?? 0);
  const significant = minimumWords <= 0 || parsed.entries.every((entry) => (
    entry.text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0
  ) >= minimumWords);
  const distinct = args.distinctEntryText !== true || new Set(normalizedTexts).size === normalizedTexts.length;
  const citedKeys = new Set(parsed.citations.flatMap((citation) => citation.keys));
  const cited = args.requireEveryEntryCited !== true || parsed.entries.every((entry) => citedKeys.has(entry.key));
  const passed = Number.isInteger(expected)
    && expected >= 0
    && parsed.entries.length === expected
    && significant && distinct && cited;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_BIBLIOGRAPHY',
    command: '\\bibitem',
    argument: String(expected),
  };
}

function checkResolvedCitations(normalizedFull: string): RuleEvalResult {
  const parsed = analyzeBibliography(normalizedFull);
  const invalidCodes = new Set(['UNDEFINED_CITATION', 'EMPTY_CITATION_KEY']);
  const passed = parsed.citations.length > 0
    && !parsed.diagnostics.some((diagnostic) => invalidCodes.has(diagnostic.code));
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_CITATION',
    command: '\\cite',
  };
}

function checkCitationCount(
  rule: ValidationRule,
  normalizedFull: string,
): RuleEvalResult {
  const parsed = analyzeBibliography(normalizedFull);
  const expected = Number(rule.expected);
  const target = rule.target?.trim() ?? '';
  const count = target === ''
    ? parsed.citations.length
    : parsed.citations.flatMap((citation) => citation.keys)
      .filter((key) => key === target).length;
  const passed = Number.isInteger(expected) && expected >= 0 && count === expected;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_CITATION',
    command: '\\cite',
    argument: target === '' ? String(expected) : `${target}: ${expected}`,
  };
}

function hasBalancedBraces(content: string): boolean {
  let depth = 0;
  for (let index = 0; index < content.length; index++) {
    if (content[index] === '\\') {
      index++;
      continue;
    }
    if (content[index] === '{') depth++;
    if (content[index] === '}') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

function hasBalancedEnvironments(content: string): boolean {
  const stack: string[] = [];
  const pattern = /\\(begin|end)\s*\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    const [, action, environment] = match;
    if (action === 'begin') {
      stack.push(environment);
    } else if (stack.pop() !== environment) {
      return false;
    }
  }
  return stack.length === 0;
}

function checkValidDocument(normalizedFull: string): RuleEvalResult {
  const preview = parseSafeLatexPreview(normalizedFull);
  const passed = hasBalancedBraces(normalizedFull)
    && hasBalancedEnvironments(normalizedFull)
    && preview.errors.length === 0
    && preview.unsupportedCommands.length === 0;
  return {
    passed,
    code: passed ? 'OK' : 'INVALID_DOCUMENT',
    command: '\\documentclass / \\begin{document} / \\end{document}',
  };
}

function packageIsUsed(packageName: string, normalizedFull: string): boolean {
  const body = extractScope(normalizedFull, 'BODY');
  const alwaysStructural = new Set(['babel', 'inputenc', 'fontenc']);
  if (alwaysStructural.has(packageName)) return true;

  const usePatterns: Record<string, RegExp> = {
    amsmath: /\\(?:begin\s*\{(?:align\*?|equation\*?|cases)\}|eqref|dfrac|text)\b/,
    amssymb: /\\(?:mathbb|mathfrak|therefore|nexists)\b/,
    booktabs: /\\(?:toprule|midrule|bottomrule|cmidrule)\b/,
    graphicx: /\\includegraphics\b/,
    hyperref: /\\(?:ref|pageref|eqref|cite|href|url|cref|Cref)\b/,
    cleveref: /\\(?:cref|Cref)\b/,
    amsthm: /\\(?:newtheorem|begin\s*\{(?:theorem|teorema|proof)\})\b/,
    multirow: /\\multirow\b/,
    subcaption: /\\begin\s*\{subfigure\}/,
  };
  return usePatterns[packageName]?.test(normalizedFull)
    ?? new RegExp(`\\\\${packageName}\\b`).test(body);
}

function checkUsedPackages(
  rule: ValidationRule,
  normalizedFull: string,
): RuleEvalResult {
  const preamble = extractScope(normalizedFull, 'PREAMBLE');
  const loaded = packageNamesFromPreamble(preamble);
  const requested = rule.target
    ? rule.target.split(',').map((name) => name.trim()).filter(Boolean)
    : loaded;
  const unused = requested.filter((name) => (
    loaded.includes(name) && !packageIsUsed(name, normalizedFull)
  ));
  const passed = requested.length > 0
    && requested.every((name) => loaded.includes(name))
    && unused.length === 0;
  return {
    passed,
    code: passed ? 'OK' : 'UNUSED_PACKAGE',
    command: unused.length > 0 ? `\\usepackage{${unused[0]}}` : '\\usepackage',
  };
}

function checkProjectRequirements(normalizedFull: string): RuleEvalResult {
  const preview = parseSafeLatexPreview(normalizedFull);
  const body = extractScope(normalizedFull, 'BODY');
  const preamble = extractScope(normalizedFull, 'PREAMBLE');
  const sectionCount = body.match(/\\section(?!\*)\s*\{/g)?.length ?? 0;
  const subsectionCount = body.match(/\\subsection(?!\*)\s*\{/g)?.length ?? 0;
  const hasNestedList = /\\begin\{(?:enumerate|itemize)\}[\s\S]*\\begin\{(?:enumerate|itemize)\}/.test(body);
  const mathSpans = scanMathDelimiters(body);
  const hasInlineMath = mathSpans.some((span) => span.kind === 'inline-dollar' || span.kind === 'inline-paren');
  const hasDisplayMath = mathSpans.some((span) => span.kind === 'display-bracket' || span.kind === 'display-dollar')
    || /\\begin\{(?:align|align\*|equation|equation\*)\}/.test(body);
  const hasFormatting = /\\(?:textbf|textit|emph|underline)\s*\{/.test(body);
  const hasTableProject = /\\begin\{table\}/.test(body)
    && /\\begin\{tabular\}/.test(body)
    && /\\(?:toprule|midrule|bottomrule)/.test(body)
    && /\\caption\s*\{/.test(body)
    && /\\label\s*\{tab:/.test(body)
    && /\\ref\s*\{tab:/.test(body);
  const hasFigureProject = /\\begin\{figure\}/.test(body)
    && /\\includegraphics/.test(body)
    && /\\caption\s*\{/.test(body)
    && /\\label\s*\{fig:/.test(body)
    && /\\ref\s*\{fig:/.test(body);
  const hasEquationProject = /\\begin\{equation\}/.test(body)
    && /\\label\s*\{eq:/.test(body)
    && /\\eqref\s*\{eq:/.test(body);
  const hasSpanish = /\\usepackage\s*\[spanish\]\s*\{babel\}/.test(preamble);
  const hasMetadata = ['title', 'author', 'date'].every((command) => (
    new RegExp(`\\\\${command}\\s*\\{`).test(preamble)
  ));
  const passed = preview.errors.length === 0
    && preview.unsupportedCommands.length === 0
    && preview.documentClass === 'article'
    && hasSpanish
    && hasMetadata
    && /\\maketitle\b/.test(body)
    && /\\begin\{abstract\}/.test(body)
    && /\\tableofcontents\b/.test(body)
    && sectionCount >= 3
    && subsectionCount >= 2
    && hasFormatting
    && hasNestedList
    && hasInlineMath
    && hasDisplayMath
    && hasEquationProject
    && hasTableProject
    && hasFigureProject
    && /\\footnote\s*\{/.test(body)
    && new Set(preview.bibliographyEntries.map((entry) => entry.key)).size >= 2
    && preview.bibliographyEntries.every((entry) => (
      (entry.text.match(/[\p{L}\p{N}]+/gu)?.length ?? 0) >= 4
    ))
    && new Set(preview.bibliographyEntries.map((entry) => entry.text
      .normalize('NFKC').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim())).size
      === preview.bibliographyEntries.length
    && (() => {
      const citedKeys = new Set(preview.citations.flatMap((citation) => citation.keys));
      return preview.bibliographyEntries.every((entry) => citedKeys.has(entry.key));
    })();
  return {
    passed,
    code: passed ? 'OK' : 'INCOMPLETE_PROJECT',
    command: 'requisitos mínimos del Proyecto Final',
  };
}

function evaluateRule(rule: ValidationRule, normalizedFull: string): RuleEvalResult {
  const scopeContent = extractScope(normalizedFull, rule.scope);

  switch (rule.type) {
    case 'REQUIRE_COMMAND':
      return checkRequireCommand(rule, scopeContent);
    case 'REQUIRE_ENVIRONMENT':
      return checkRequireEnvironment(rule, scopeContent);
    case 'REQUIRE_ARGUMENT':
      return checkRequireArgument(rule, scopeContent);
    case 'REQUIRE_NONEMPTY_ARGUMENT':
      return checkNonemptyArgument(rule, scopeContent);
    case 'REQUIRE_TEXT':
      return checkRequireText(rule, scopeContent);
    case 'REQUIRE_COUNT':
      return checkCount(rule, scopeContent);
    case 'REQUIRE_PACKAGE':
      return checkRequirePackage(rule, scopeContent);
    case 'REQUIRE_ORDER':
      return checkRequireOrder(rule, scopeContent);
    case 'REQUIRE_FIRST_CONTENT':
      return checkFirstContent(rule, scopeContent);
    case 'REQUIRE_SENTENCE_COUNT':
      return checkSentenceCount(rule, scopeContent);
    case 'REQUIRE_HEADING_STRUCTURE':
      return checkHeadingStructure(rule, scopeContent);
    case 'REQUIRE_TABLE_STRUCTURE':
      return checkTableStructure(rule, normalizedFull);
    case 'REQUIRE_FIGURE_STRUCTURE':
      return checkFigureStructure(rule, normalizedFull);
    case 'REQUIRE_VALID_FOOTNOTES':
      return checkValidFootnotes(scopeContent);
    case 'REQUIRE_FOOTNOTE_PAIR':
      return checkFootnotePair(scopeContent);
    case 'REQUIRE_UNIQUE_LABELS':
      return checkUniqueLabels(normalizedFull);
    case 'REQUIRE_RESOLVED_REFERENCES':
      return checkResolvedReferences(normalizedFull);
    case 'REQUIRE_VALID_LABELS':
      return checkValidLabels(normalizedFull);
    case 'REQUIRE_REFERENCE_PACKAGE_ORDER':
      return checkReferencePackageOrder(rule, normalizedFull);
    case 'REQUIRE_REFERENCE_COUNT':
      return checkReferenceCount(rule, normalizedFull);
    case 'REQUIRE_VALID_BIBLIOGRAPHY':
      return checkValidBibliography(normalizedFull);
    case 'REQUIRE_BIBITEM_COUNT':
      return checkBibitemCount(rule, normalizedFull);
    case 'REQUIRE_RESOLVED_CITATIONS':
      return checkResolvedCitations(normalizedFull);
    case 'REQUIRE_CITATION_COUNT':
      return checkCitationCount(rule, normalizedFull);
    case 'REQUIRE_VALID_DOCUMENT':
      return checkValidDocument(normalizedFull);
    case 'REQUIRE_USED_PACKAGES':
      return checkUsedPackages(rule, normalizedFull);
    case 'REQUIRE_PROJECT_REQUIREMENTS':
      return checkProjectRequirements(normalizedFull);
    case 'REQUIRE_PARAGRAPH_COUNT':
      return checkParagraphCount(rule, scopeContent);
    case 'REQUIRE_DISTINCT_LINES':
      return checkDistinctLines(rule, scopeContent);
    case 'REQUIRE_NESTED_ENVIRONMENT':
      return checkNestedEnvironment(rule, scopeContent);
    case 'FORBID_ALTERNATIVE':
      return checkForbidAlternative(rule, scopeContent);
    default:
      return { passed: false, code: 'MISSING_COMMAND' };
  }
}

export function validateExercise(
  userCode: string,
  rules: ValidationRule[],
): ValidationResult {
  const normalized = normalizeLatex(userCode);
  const matchedRules: string[] = [];
  const failedRules: FailedRuleInfo[] = [];
  const unsupportedRules: UnsupportedRuleInfo[] = [];
  const feedback: string[] = [];

  for (const rule of rules) {
    if (!isRuleSupported(rule)) {
      unsupportedRules.push({
        id: rule.id,
        type: rule.type,
        required: rule.required,
        code: UNSUPPORTED_CODE,
        message: rule.feedback,
      });
      continue;
    }

    const result = evaluateRule(rule, normalized);
    if (result.passed) {
      matchedRules.push(rule.id);
    } else {
      failedRules.push({
        id: rule.id,
        code: result.code as ValidationFailureCode,
        message: rule.feedback,
        command: result.command,
        argument: result.argument,
      });
      feedback.push(rule.feedback);
    }
  }

  const anyRequiredFailed = rules.some(
    r => r.required && failedRules.some(f => f.id === r.id),
  );
  const anyRequiredUnsupported = unsupportedRules.some(r => r.required);

  return {
    valid: !anyRequiredFailed && !anyRequiredUnsupported,
    matchedRules,
    failedRules,
    unsupportedRules,
    feedback,
  };
}
