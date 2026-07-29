export type SafeTableAlignment = 'left' | 'center' | 'right';
export type SafeTableRule = 'none' | 'standard' | 'strong' | 'partial';

export interface SafeTableCell {
  text: string;
  column: number;
  colSpan: number;
  rowSpan: number;
  alignment: SafeTableAlignment;
}

export interface SafeTableRow {
  cells: SafeTableCell[];
  ruleBefore: SafeTableRule;
}

export interface SafeTablePreview {
  columns: SafeTableAlignment[];
  verticalRules: number[];
  rows: SafeTableRow[];
  caption: string | null;
  centered: boolean;
  placement: string | null;
  bottomRule: SafeTableRule;
  usesBooktabs: boolean;
}

export interface SafeTablePreviewResult {
  tables: SafeTablePreview[];
  remainingBody: string;
  errors: string[];
}

interface RawTableCell {
  text: string;
  colSpan: number;
  rowSpan: number;
  alignment: SafeTableAlignment | null;
}

const TABLE_PATTERN = /\\begin\{table\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{table\}/g;
const TABULAR_PATTERN = /\\begin\{tabular\}\{((?:[^{}]|\{[^{}]*\})*)\}([\s\S]*?)\\end\{tabular\}/g;
const RULE_PATTERN = /\\(?:hline|toprule|midrule|bottomrule)(?![A-Za-z])|\\cmidrule(?:\([^)]*\))?\{[^{}]*\}/g;

function countMatches(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

function alignmentFromToken(token: string): SafeTableAlignment {
  if (token === 'c') return 'center';
  if (token === 'r') return 'right';
  return 'left';
}

function parseColumnSpec(
  source: string,
  errors: string[],
): { columns: SafeTableAlignment[]; verticalRules: number[] } | null {
  const compact = source.replace(/\s/g, '');
  if (compact === '' || /[^lcr|]/.test(compact)) {
    errors.push(`Especificación de columnas no soportada: {${source}}. Usa únicamente l, c, r y |.`);
    return null;
  }

  const columns: SafeTableAlignment[] = [];
  const verticalRules = new Set<number>();
  for (const token of compact) {
    if (token === '|') {
      verticalRules.add(columns.length);
    } else {
      columns.push(alignmentFromToken(token));
    }
  }
  if (columns.length === 0) {
    errors.push('El entorno tabular necesita al menos una columna l, c o r.');
    return null;
  }
  return { columns, verticalRules: [...verticalRules] };
}

function splitCells(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let depth = 0;
  for (let index = 0; index < row.length; index++) {
    const token = row[index];
    if (token === '\\' && row[index + 1] === '&') {
      current += '&';
      index++;
    } else if (token === '{') {
      depth++;
      current += token;
    } else if (token === '}') {
      depth = Math.max(0, depth - 1);
      current += token;
    } else if (token === '&' && depth === 0) {
      cells.push(current.trim());
      current = '';
    } else {
      current += token;
    }
  }
  cells.push(current.trim());
  return cells;
}

function plainCellText(source: string): string {
  return source
    .replace(/\\(?:textbf|textit|emph)\{([^{}]*)\}/g, '$1')
    .replace(/\\([%&_#{}])/g, '$1')
    .replace(/\\[A-Za-z]+(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCell(source: string): RawTableCell {
  const multicolumn = source.match(/^\\multicolumn\{(\d+)\}\{([lcr|]+)\}\{([\s\S]*)\}$/);
  if (multicolumn) {
    const alignmentToken = [...multicolumn[2]].find((token) => /[lcr]/.test(token)) ?? 'l';
    return {
      text: plainCellText(multicolumn[3]),
      colSpan: Math.max(1, Number(multicolumn[1])),
      rowSpan: 1,
      alignment: alignmentFromToken(alignmentToken),
    };
  }

  const multirow = source.match(/^\\multirow\{(\d+)\}\{(?:\*|[^{}]*)\}\{([\s\S]*)\}$/);
  if (multirow) {
    return {
      text: plainCellText(multirow[2]),
      colSpan: 1,
      rowSpan: Math.max(1, Number(multirow[1])),
      alignment: null,
    };
  }

  return {
    text: plainCellText(source),
    colSpan: 1,
    rowSpan: 1,
    alignment: null,
  };
}

function ruleFromCommands(commands: string[]): SafeTableRule {
  if (commands.some((command) => command.startsWith('\\toprule'))) return 'strong';
  if (commands.some((command) => command.startsWith('\\cmidrule'))) return 'partial';
  if (commands.some((command) => command.startsWith('\\midrule'))) return 'standard';
  if (commands.some((command) => command.startsWith('\\hline'))) return 'standard';
  return 'none';
}

function parseTabular(
  columnSource: string,
  content: string,
  context: { caption: string | null; centered: boolean; placement: string | null },
  errors: string[],
): SafeTablePreview | null {
  const specification = parseColumnSpec(columnSource, errors);
  if (!specification) return null;

  const rows: SafeTableRow[] = [];
  const activeRowSpans = Array<number>(specification.columns.length).fill(0);
  let bottomRule: SafeTableRule = 'none';
  let usesBooktabs = false;

  for (const segment of content.split('\\\\')) {
    const commands = segment.match(RULE_PATTERN) ?? [];
    usesBooktabs ||= commands.some((command) => /\\(?:toprule|midrule|bottomrule|cmidrule)/.test(command));
    if (commands.some((command) => command.startsWith('\\bottomrule'))) {
      bottomRule = 'strong';
    } else if (commands.some((command) => command.startsWith('\\hline'))) {
      bottomRule = 'standard';
    }

    const rowSource = segment.replace(RULE_PATTERN, '').trim();
    if (rowSource === '') continue;

    const rawCells = splitCells(rowSource).map(parseCell);
    const occupiedColumns = rawCells.reduce((total, cell) => total + cell.colSpan, 0);
    if (occupiedColumns !== specification.columns.length) {
      errors.push(
        `Una fila de tabular ocupa ${occupiedColumns} columnas, pero la especificación declara ${specification.columns.length}.`,
      );
    }

    const cells: SafeTableCell[] = [];
    const newRowSpans: Array<{ column: number; remaining: number }> = [];
    let column = 0;
    for (const rawCell of rawCells) {
      if (
        rawCell.text === ''
        && rawCell.colSpan === 1
        && activeRowSpans[column] > 0
      ) {
        column++;
        continue;
      }
      while (column < activeRowSpans.length && activeRowSpans[column] > 0) {
        column++;
      }
      if (column >= specification.columns.length) break;
      const safeSpan = Math.min(rawCell.colSpan, specification.columns.length - column);
      cells.push({
        text: rawCell.text,
        column,
        colSpan: safeSpan,
        rowSpan: rawCell.rowSpan,
        alignment: rawCell.alignment ?? specification.columns[column],
      });
      if (rawCell.rowSpan > 1) {
        newRowSpans.push({ column, remaining: rawCell.rowSpan - 1 });
      }
      column += safeSpan;
    }

    for (let index = 0; index < activeRowSpans.length; index++) {
      activeRowSpans[index] = Math.max(0, activeRowSpans[index] - 1);
    }
    for (const span of newRowSpans) {
      activeRowSpans[span.column] = Math.max(activeRowSpans[span.column], span.remaining);
    }

    rows.push({
      cells,
      ruleBefore: ruleFromCommands(commands),
    });
  }

  if (rows.length === 0) {
    errors.push('El entorno tabular no contiene filas visibles.');
  }

  return {
    columns: specification.columns,
    verticalRules: specification.verticalRules,
    rows,
    caption: context.caption,
    centered: context.centered,
    placement: context.placement,
    bottomRule,
    usesBooktabs,
  };
}

function parseTableContents(
  source: string,
  context: { caption: string | null; centered: boolean; placement: string | null },
  errors: string[],
): SafeTablePreview[] {
  const tables: SafeTablePreview[] = [];
  let match: RegExpExecArray | null;
  const pattern = new RegExp(TABULAR_PATTERN.source, 'g');
  while ((match = pattern.exec(source)) !== null) {
    const parsed = parseTabular(match[1], match[2], context, errors);
    if (parsed) tables.push(parsed);
  }
  return tables;
}

export function parseSafeTablePreview(
  body: string,
  packages: string[],
): SafeTablePreviewResult {
  const errors: string[] = [];
  const tables: SafeTablePreview[] = [];

  const tableBeginCount = countMatches(body, /\\begin\{table\}/g);
  const tableEndCount = countMatches(body, /\\end\{table\}/g);
  if (tableBeginCount !== tableEndCount) {
    errors.push('El entorno table debe abrirse y cerrarse correctamente.');
  }
  const tabularBeginCount = countMatches(body, /\\begin\{tabular\}/g);
  const tabularEndCount = countMatches(body, /\\end\{tabular\}/g);
  if (tabularBeginCount !== tabularEndCount) {
    errors.push('El entorno tabular debe abrirse y cerrarse correctamente.');
  }

  const tablePattern = new RegExp(TABLE_PATTERN.source, 'g');
  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tablePattern.exec(body)) !== null) {
    const placement = tableMatch[1]?.trim() || null;
    if (placement && /[^htbp]/.test(placement)) {
      errors.push(`Preferencia de colocación no soportada: [${placement}]. Usa h, t, b o p.`);
    }
    const tableBody = tableMatch[2];
    const caption = tableBody.match(/\\caption\{([^{}]*)\}/)?.[1].trim() ?? null;
    const nested = parseTableContents(tableBody, {
      caption,
      centered: /\\centering(?![A-Za-z])/.test(tableBody),
      placement,
    }, errors);
    if (nested.length === 0) {
      errors.push('El entorno table necesita un tabular para mostrar datos.');
    }
    tables.push(...nested);
  }

  const withoutFloatingTables = body.replace(new RegExp(TABLE_PATTERN.source, 'g'), '\n');
  tables.push(...parseTableContents(withoutFloatingTables, {
    caption: null,
    centered: false,
    placement: null,
  }, errors));
  const remainingBody = withoutFloatingTables.replace(new RegExp(TABULAR_PATTERN.source, 'g'), '\n');

  const usesBooktabs = tables.some((table) => table.usesBooktabs);
  if (usesBooktabs && !packages.includes('booktabs')) {
    errors.push('Las reglas académicas requieren \\usepackage{booktabs} en el preámbulo.');
  }
  if (/\\multirow(?![A-Za-z])/.test(body) && !packages.includes('multirow')) {
    errors.push('\\multirow requiere \\usepackage{multirow} en el preámbulo.');
  }

  return { tables, remainingBody, errors };
}
