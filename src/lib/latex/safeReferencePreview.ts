export type SafeReferenceObjectKind =
  | 'section'
  | 'equation'
  | 'table'
  | 'figure'
  | 'subfigure'
  | 'footnote'
  | 'theorem';

export type SafeReferenceDiagnosticCode =
  | 'DUPLICATE_LABEL'
  | 'EMPTY_LABEL'
  | 'LABEL_BEFORE_CAPTION'
  | 'LABEL_WITHOUT_NUMBERED_OBJECT'
  | 'WRONG_LABEL_PREFIX'
  | 'UNDEFINED_REFERENCE'
  | 'EQREF_WRONG_OBJECT'
  | 'EQREF_WITHOUT_AMSMATH'
  | 'CLEVEREF_NOT_LOADED'
  | 'REFERENCE_PACKAGE_ORDER';

export interface SafeReferenceDiagnostic {
  code: SafeReferenceDiagnosticCode;
  message: string;
  key?: string;
}

export interface SafeResolvedReference {
  command: 'ref' | 'pageref' | 'eqref' | 'cref' | 'Cref' | 'textsuperscript';
  key: string;
  value: string;
  objectKind: SafeReferenceObjectKind;
  linked: boolean;
}

export interface SafeReferenceLabel {
  key: string;
  value: string;
  objectKind: SafeReferenceObjectKind;
}

export interface SafeReferencePreviewResult {
  remainingBody: string;
  labels: SafeReferenceLabel[];
  references: SafeResolvedReference[];
  diagnostics: SafeReferenceDiagnostic[];
  errors: string[];
  limitations: string[];
  hyperrefEnabled: boolean;
  cleverefEnabled: boolean;
}

interface SourceRange {
  start: number;
  end: number;
}

interface CommandGroup extends SourceRange {
  content: string;
  commandStart: number;
}

interface LabelToken extends SourceRange {
  key: string;
}

interface Definition {
  key: string;
  value: string;
  objectKind: SafeReferenceObjectKind;
}

const EXPECTED_PREFIX: Record<SafeReferenceObjectKind, string> = {
  section: 'sec:',
  equation: 'eq:',
  table: 'tab:',
  figure: 'fig:',
  subfigure: 'fig:',
  footnote: 'nota:',
  theorem: 'thm:',
};

const KIND_NAME: Record<SafeReferenceObjectKind, string> = {
  section: 'sección',
  equation: 'ecuación',
  table: 'tabla',
  figure: 'figura',
  subfigure: 'subfigura',
  footnote: 'nota',
  theorem: 'teorema',
};

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

function commandAt(source: string, index: number, command: string): boolean {
  if (!source.startsWith(command, index)) return false;
  return !/[A-Za-z]/.test(source[index + command.length] ?? '');
}

function skipWhitespace(source: string, start: number): number {
  let index = start;
  while (index < source.length && /\s/.test(source[index])) index++;
  return index;
}

function parseBracedGroup(source: string, start: number): { content: string; end: number } | null {
  if (source[start] !== '{') return null;
  let depth = 0;
  for (let index = start; index < source.length; index++) {
    if (source[index] === '\\') {
      index++;
      continue;
    }
    if (source[index] === '{') {
      depth++;
    } else if (source[index] === '}') {
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

function findCommandGroups(source: string, command: string): CommandGroup[] {
  const groups: CommandGroup[] = [];
  for (let index = 0; index < source.length;) {
    if (!commandAt(source, index, command)) {
      index++;
      continue;
    }
    const argumentStart = skipWhitespace(source, index + command.length);
    const group = parseBracedGroup(source, argumentStart);
    if (!group) {
      index += command.length;
      continue;
    }
    groups.push({
      commandStart: index,
      start: argumentStart,
      end: group.end,
      content: group.content,
    });
    index = group.end;
  }
  return groups;
}

function isInside(index: number, range: SourceRange): boolean {
  return index >= range.start && index < range.end;
}

function isInsideAny(index: number, ranges: SourceRange[]): boolean {
  return ranges.some((range) => isInside(index, range));
}

function findEnvironmentRanges(source: string, name: string): SourceRange[] {
  const ranges: SourceRange[] = [];
  const beginPattern = new RegExp(`\\\\begin\\{${name.replace('*', '\\*')}\\}(?:\\{[^{}]*\\})?`, 'g');
  let match: RegExpExecArray | null;
  while ((match = beginPattern.exec(source)) !== null) {
    const endTag = `\\end{${name}}`;
    const endIndex = source.indexOf(endTag, match.index + match[0].length);
    if (endIndex !== -1) {
      ranges.push({ start: match.index, end: endIndex + endTag.length });
    }
  }
  return ranges;
}

function superscript(value: string): string {
  return value
    .split('')
    .map((character) => SUPERSCRIPT_DIGITS[character] ?? character)
    .join('');
}

function addDiagnostic(
  diagnostics: SafeReferenceDiagnostic[],
  code: SafeReferenceDiagnosticCode,
  message: string,
  key?: string,
): void {
  diagnostics.push({ code, message, key });
}

function expectedPrefix(kind: SafeReferenceObjectKind): string {
  return EXPECTED_PREFIX[kind];
}

function cleverReferenceValue(definition: Definition, capitalized: boolean): string {
  const noun = KIND_NAME[definition.objectKind];
  const label = definition.objectKind === 'equation'
    ? `${noun} (${definition.value})`
    : `${noun} ${definition.value}`;
  return capitalized ? label[0].toUpperCase() + label.slice(1) : label;
}

export function parseSafeReferencePreview(
  body: string,
  preamble: string,
  packageNames: string[],
): SafeReferencePreviewResult {
  const diagnostics: SafeReferenceDiagnostic[] = [];
  const references: SafeResolvedReference[] = [];
  const definitions = new Map<string, Definition>();
  const assignedLabels = new Set<number>();
  const invalidPositionLabels = new Set<number>();
  const labels = findCommandGroups(body, '\\label').map<LabelToken>((group) => ({
    start: group.commandStart,
    end: group.end,
    key: group.content.trim(),
  }));

  const keyCounts = new Map<string, number>();
  for (const label of labels) {
    keyCounts.set(label.key, (keyCounts.get(label.key) ?? 0) + 1);
    if (label.key === '') {
      addDiagnostic(diagnostics, 'EMPTY_LABEL', '\\label necesita una clave no vacía.');
    }
  }
  for (const [key, count] of keyCounts) {
    if (key !== '' && count > 1) {
      addDiagnostic(
        diagnostics,
        'DUPLICATE_LABEL',
        `La etiqueta "${key}" está duplicada; cada clave debe ser única.`,
        key,
      );
    }
  }

  const assign = (
    labelIndex: number,
    objectKind: SafeReferenceObjectKind,
    value: string,
  ): void => {
    if (assignedLabels.has(labelIndex)) return;
    assignedLabels.add(labelIndex);
    const label = labels[labelIndex];
    const definition = { key: label.key, value, objectKind };
    if (!definitions.has(label.key) && label.key !== '') {
      definitions.set(label.key, definition);
    }
    const prefix = expectedPrefix(objectKind);
    if (label.key !== '' && !label.key.startsWith(prefix)) {
      addDiagnostic(
        diagnostics,
        'WRONG_LABEL_PREFIX',
        `La etiqueta "${label.key}" debe usar el prefijo ${prefix} para esta ${KIND_NAME[objectKind]}.`,
        label.key,
      );
    }
  };

  // Encabezados numerados: la etiqueta debe seguir inmediatamente al comando.
  const sectionPattern = /\\(section|subsection|subsubsection)(\*)?\{([^{}]*)\}/g;
  let sectionMatch: RegExpExecArray | null;
  let sectionNumber = 0;
  let subsectionNumber = 0;
  let subsubsectionNumber = 0;
  while ((sectionMatch = sectionPattern.exec(body)) !== null) {
    const [, level, starred] = sectionMatch;
    let value = '';
    if (!starred) {
      if (level === 'section') {
        sectionNumber++;
        subsectionNumber = 0;
        subsubsectionNumber = 0;
        value = String(sectionNumber);
      } else if (level === 'subsection') {
        subsectionNumber++;
        subsubsectionNumber = 0;
        value = `${sectionNumber}.${subsectionNumber}`;
      } else {
        subsubsectionNumber++;
        value = `${sectionNumber}.${subsectionNumber}.${subsubsectionNumber}`;
      }
      const next = skipWhitespace(body, sectionMatch.index + sectionMatch[0].length);
      const labelIndex = labels.findIndex((label) => label.start === next);
      if (labelIndex !== -1) assign(labelIndex, 'section', value);
    }
  }

  // Ecuaciones numeradas.
  const equationRanges = findEnvironmentRanges(body, 'equation');
  equationRanges.forEach((range, equationIndex) => {
    labels.forEach((label, labelIndex) => {
      if (isInside(label.start, range)) assign(labelIndex, 'equation', String(equationIndex + 1));
    });
  });

  // Entornos formales declarados con newtheorem.
  const theoremNames = [...preamble.matchAll(/\\newtheorem\s*\{([A-Za-z][A-Za-z0-9-]*)\}\s*\{[^{}]+\}/g)]
    .map((match) => match[1]);
  theoremNames.forEach((name) => {
    findEnvironmentRanges(body, name).forEach((range, theoremIndex) => {
      labels.forEach((label, labelIndex) => {
        if (isInside(label.start, range)) assign(labelIndex, 'theorem', String(theoremIndex + 1));
      });
    });
  });

  // Notas directas.
  findCommandGroups(body, '\\footnote').forEach((footnote, footnoteIndex) => {
    const range = { start: footnote.start, end: footnote.end };
    labels.forEach((label, labelIndex) => {
      if (isInside(label.start, range)) assign(labelIndex, 'footnote', String(footnoteIndex + 1));
    });
  });

  // Figuras, subfiguras y posición de caption/label.
  const figureRanges = findEnvironmentRanges(body, 'figure');
  figureRanges.forEach((figureRange, figureIndex) => {
    const figureSource = body.slice(figureRange.start, figureRange.end);
    const localSubfigures = findEnvironmentRanges(figureSource, 'subfigure').map((range) => ({
      start: range.start + figureRange.start,
      end: range.end + figureRange.start,
    }));

    localSubfigures.forEach((subfigureRange, subfigureIndex) => {
      const captions = findCommandGroups(body.slice(subfigureRange.start, subfigureRange.end), '\\caption')
        .map((caption) => ({ ...caption, commandStart: caption.commandStart + subfigureRange.start, end: caption.end + subfigureRange.start }));
      const caption = captions[0];
      labels.forEach((label, labelIndex) => {
        if (!isInside(label.start, subfigureRange)) return;
        if (!caption || label.start < caption.end) {
          invalidPositionLabels.add(labelIndex);
          return;
        }
        assign(labelIndex, 'subfigure', `${figureIndex + 1}${String.fromCharCode(97 + subfigureIndex)}`);
      });
    });

    const outerCaptions = findCommandGroups(figureSource, '\\caption')
      .map((caption) => ({
        ...caption,
        commandStart: caption.commandStart + figureRange.start,
        end: caption.end + figureRange.start,
      }))
      .filter((caption) => !isInsideAny(caption.commandStart, localSubfigures));
    const outerCaption = outerCaptions[0];
    labels.forEach((label, labelIndex) => {
      if (assignedLabels.has(labelIndex) || !isInside(label.start, figureRange)) return;
      if (isInsideAny(label.start, localSubfigures)) return;
      if (!outerCaption || label.start < outerCaption.end) {
        invalidPositionLabels.add(labelIndex);
        return;
      }
      assign(labelIndex, 'figure', String(figureIndex + 1));
    });
  });

  // Tablas flotantes.
  findEnvironmentRanges(body, 'table').forEach((tableRange, tableIndex) => {
    const tableSource = body.slice(tableRange.start, tableRange.end);
    const caption = findCommandGroups(tableSource, '\\caption')[0];
    const captionEnd = caption ? caption.end + tableRange.start : null;
    labels.forEach((label, labelIndex) => {
      if (assignedLabels.has(labelIndex) || !isInside(label.start, tableRange)) return;
      if (captionEnd === null || label.start < captionEnd) {
        invalidPositionLabels.add(labelIndex);
        return;
      }
      assign(labelIndex, 'table', String(tableIndex + 1));
    });
  });

  invalidPositionLabels.forEach((labelIndex) => {
    const key = labels[labelIndex].key;
    addDiagnostic(
      diagnostics,
      'LABEL_BEFORE_CAPTION',
      `La etiqueta "${key}" debe colocarse después de \\caption.`,
      key,
    );
  });

  labels.forEach((label, labelIndex) => {
    if (!assignedLabels.has(labelIndex) && !invalidPositionLabels.has(labelIndex)) {
      addDiagnostic(
        diagnostics,
        'LABEL_WITHOUT_NUMBERED_OBJECT',
        `La etiqueta "${label.key}" no está asociada a un objeto numerable.`,
        label.key,
      );
    }
  });

  const hyperrefIndex = packageNames.indexOf('hyperref');
  const cleverefIndex = packageNames.indexOf('cleveref');
  const hyperrefEnabled = hyperrefIndex !== -1;
  const cleverefEnabled = cleverefIndex !== -1;

  if (cleverefEnabled && !hyperrefEnabled) {
    addDiagnostic(
      diagnostics,
      'REFERENCE_PACKAGE_ORDER',
      '\\usepackage{cleveref} debe cargarse después de \\usepackage{hyperref}.',
    );
  } else if (cleverefEnabled && cleverefIndex < hyperrefIndex) {
    addDiagnostic(
      diagnostics,
      'REFERENCE_PACKAGE_ORDER',
      'Carga cleveref después de hyperref.',
    );
  }
  if (hyperrefEnabled) {
    const allowedAfterHyperref = cleverefEnabled ? 1 : 0;
    if (packageNames.length - hyperrefIndex - 1 !== allowedAfterHyperref) {
      addDiagnostic(
        diagnostics,
        'REFERENCE_PACKAGE_ORDER',
        'Carga hyperref cerca del final del preámbulo; solo cleveref debe ir después.',
      );
    }
  }
  if (cleverefEnabled && cleverefIndex !== packageNames.length - 1) {
    addDiagnostic(
      diagnostics,
      'REFERENCE_PACKAGE_ORDER',
      'Carga cleveref al final, después de hyperref.',
    );
  }

  const resolve = (
    command: SafeResolvedReference['command'],
    key: string,
  ): string => {
    const definition = definitions.get(key);
    if (!definition) {
      addDiagnostic(
        diagnostics,
        'UNDEFINED_REFERENCE',
        `La referencia "${key}" no coincide con ninguna etiqueta.`,
        key,
      );
      return '??';
    }
    if (command === 'eqref' && definition.objectKind !== 'equation') {
      addDiagnostic(
        diagnostics,
        'EQREF_WRONG_OBJECT',
        `\\eqref{${key}} solo puede apuntar a una ecuación numerada.`,
        key,
      );
      return '??';
    }
    if (command === 'eqref' && !packageNames.includes('amsmath')) {
      addDiagnostic(
        diagnostics,
        'EQREF_WITHOUT_AMSMATH',
        '\\eqref requiere \\usepackage{amsmath}.',
        key,
      );
    }
    if ((command === 'cref' || command === 'Cref') && !cleverefEnabled) {
      addDiagnostic(
        diagnostics,
        'CLEVEREF_NOT_LOADED',
        `\\${command} requiere \\usepackage{cleveref}.`,
        key,
      );
    }

    const value = command === 'pageref'
      ? '1'
      : command === 'eqref'
        ? `(${definition.value})`
        : command === 'cref' || command === 'Cref'
          ? cleverReferenceValue(definition, command === 'Cref')
          : command === 'textsuperscript'
            ? superscript(definition.value)
            : definition.value;
    references.push({
      command,
      key,
      value,
      objectKind: definition.objectKind,
      linked: hyperrefEnabled,
    });
    return value;
  };

  let remainingBody = body;
  remainingBody = remainingBody.replace(
    /\\textsuperscript\s*\{\s*\\ref\s*\{([^{}]*)\}\s*\}/g,
    (_match, key: string) => resolve('textsuperscript', key.trim()),
  );
  remainingBody = remainingBody.replace(
    /\\(pageref|eqref|Cref|cref|ref)\s*\{([^{}]*)\}/g,
    (_match, command: 'pageref' | 'eqref' | 'Cref' | 'cref' | 'ref', key: string) => (
      resolve(command, key.trim())
    ),
  );
  remainingBody = remainingBody.replace(/\\label\s*\{[^{}]*\}/g, '');

  const limitations: string[] = [];
  if (references.length > 0) {
    limitations.push(
      'TexDock simula la numeración en una sola página; una compilación LaTeX real puede requerir varias pasadas.',
    );
  }
  if (references.some((reference) => reference.command === 'pageref')) {
    limitations.push(
      'Los números de página son orientativos porque esta vista previa no ejecuta el motor de maquetación de LaTeX.',
    );
  }
  if (hyperrefEnabled && references.length > 0) {
    limitations.push(
      'Los enlaces se identifican de forma educativa, pero no ejecutan navegación dentro de un PDF real.',
    );
  }

  return {
    remainingBody,
    labels: [...definitions.values()],
    references,
    diagnostics,
    errors: diagnostics.map((diagnostic) => diagnostic.message),
    limitations,
    hyperrefEnabled,
    cleverefEnabled,
  };
}
