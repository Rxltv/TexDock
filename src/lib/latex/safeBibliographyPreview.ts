export type SafeBibliographyDiagnosticCode =
  | 'MALFORMED_BIBLIOGRAPHY'
  | 'MULTIPLE_BIBLIOGRAPHIES'
  | 'INVALID_BIBLIOGRAPHY_WIDTH'
  | 'EMPTY_BIBITEM_KEY'
  | 'DUPLICATE_BIBITEM_KEY'
  | 'BIBITEM_OUTSIDE_BIBLIOGRAPHY'
  | 'UNDEFINED_CITATION'
  | 'EMPTY_CITATION_KEY'
  | 'BIBLIOGRAPHY_AFTER_DOCUMENT'
  | 'UNESCAPED_BIBLIOGRAPHY_AMPERSAND';

export interface SafeBibliographyDiagnostic {
  code: SafeBibliographyDiagnosticCode;
  message: string;
  key?: string;
}

export interface SafeBibliographyEntry {
  key: string;
  number: number;
  text: string;
}

export interface SafeCitation {
  keys: string[];
  numbers: Array<number | null>;
  value: string;
}

export interface SafeBibliographyPreviewResult {
  remainingBody: string;
  hasBibliography: boolean;
  widthArgument: string | null;
  entries: SafeBibliographyEntry[];
  citations: SafeCitation[];
  diagnostics: SafeBibliographyDiagnostic[];
  errors: string[];
  limitations: string[];
}

interface BibliographyRange {
  start: number;
  end: number;
  width: string;
  content: string;
}

function addDiagnostic(
  diagnostics: SafeBibliographyDiagnostic[],
  code: SafeBibliographyDiagnosticCode,
  message: string,
  key?: string,
): void {
  if (diagnostics.some((item) => (
    item.code === code && item.message === message && item.key === key
  ))) return;
  diagnostics.push({ code, message, key });
}

function findBibliographies(body: string): BibliographyRange[] {
  const ranges: BibliographyRange[] = [];
  const pattern = /\\begin\s*\{thebibliography\}\s*\{([^{}]*)\}([\s\S]*?)\\end\s*\{thebibliography\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
      width: match[1].trim(),
      content: match[2],
    });
  }
  return ranges;
}

function entryText(raw: string): string {
  return raw
    .replace(/\\(?:emph|textit|textbf)\s*\{([^{}]*)\}/g, '$1')
    .replace(/\\&/g, '&')
    .replace(/~/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseEntries(
  content: string,
  entries: SafeBibliographyEntry[],
  diagnostics: SafeBibliographyDiagnostic[],
): void {
  const tokens = [...content.matchAll(/\\bibitem\s*\{([^{}]*)\}/g)];
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    const key = token[1].trim();
    const textStart = (token.index ?? 0) + token[0].length;
    const textEnd = tokens[index + 1]?.index ?? content.length;
    const rawText = content.slice(textStart, textEnd);

    if (key === '') {
      addDiagnostic(
        diagnostics,
        'EMPTY_BIBITEM_KEY',
        '\\bibitem necesita una clave bibliográfica no vacía.',
      );
    }
    if (/(^|[^\\])&/.test(rawText)) {
      addDiagnostic(
        diagnostics,
        'UNESCAPED_BIBLIOGRAPHY_AMPERSAND',
        'Escribe el ampersand como \\& dentro de una referencia.',
        key || undefined,
      );
    }

    entries.push({
      key,
      number: entries.length + 1,
      text: entryText(rawText),
    });
  }
}

export function parseSafeBibliographyPreview(
  body: string,
  afterDocument = '',
): SafeBibliographyPreviewResult {
  const diagnostics: SafeBibliographyDiagnostic[] = [];
  const entries: SafeBibliographyEntry[] = [];
  const citations: SafeCitation[] = [];
  const ranges = findBibliographies(body);
  const beginCount = body.match(/\\begin\s*\{thebibliography\}/g)?.length ?? 0;
  const endCount = body.match(/\\end\s*\{thebibliography\}/g)?.length ?? 0;

  if (beginCount !== endCount || ranges.length !== beginCount) {
    addDiagnostic(
      diagnostics,
      'MALFORMED_BIBLIOGRAPHY',
      'El entorno thebibliography debe abrirse, recibir su argumento de ancho y cerrarse dentro del documento.',
    );
  }
  if (ranges.length > 1) {
    addDiagnostic(
      diagnostics,
      'MULTIPLE_BIBLIOGRAPHIES',
      'Usa un solo entorno thebibliography en este documento breve.',
    );
  }
  if (/\\(?:begin\s*\{thebibliography\}|bibitem)\b/.test(afterDocument)) {
    addDiagnostic(
      diagnostics,
      'BIBLIOGRAPHY_AFTER_DOCUMENT',
      'La bibliografía debe colocarse antes de \\end{document}.',
    );
  }

  for (const range of ranges) {
    if (!/^[1-9]\d*$/.test(range.width)) {
      addDiagnostic(
        diagnostics,
        'INVALID_BIBLIOGRAPHY_WIDTH',
        'El argumento de thebibliography debe reservar un ancho numérico, por ejemplo {9} o {99}.',
      );
    }
    parseEntries(range.content, entries, diagnostics);
  }

  const keyCounts = new Map<string, number>();
  for (const entry of entries) {
    keyCounts.set(entry.key, (keyCounts.get(entry.key) ?? 0) + 1);
  }
  for (const [key, count] of keyCounts) {
    if (key !== '' && count > 1) {
      addDiagnostic(
        diagnostics,
        'DUPLICATE_BIBITEM_KEY',
        `La clave bibliográfica "${key}" está duplicada; cada \\bibitem necesita una clave única.`,
        key,
      );
    }
  }

  let remainingBody = body;
  for (const range of [...ranges].sort((a, b) => b.start - a.start)) {
    remainingBody = remainingBody.slice(0, range.start)
      + '\n'
      + remainingBody.slice(range.end);
  }
  if (/\\bibitem\s*\{/.test(remainingBody)) {
    addDiagnostic(
      diagnostics,
      'BIBITEM_OUTSIDE_BIBLIOGRAPHY',
      '\\bibitem debe escribirse dentro de thebibliography.',
    );
    remainingBody = remainingBody.replace(/\\bibitem\s*\{[^{}]*\}/g, '');
  }

  const entryByKey = new Map<string, SafeBibliographyEntry>();
  for (const entry of entries) {
    if (entry.key !== '' && !entryByKey.has(entry.key)) {
      entryByKey.set(entry.key, entry);
    }
  }

  remainingBody = remainingBody.replace(
    /\\cite(?:\s*\[[^\]]*\])?\s*\{([^{}]*)\}/g,
    (_match, rawKeys: string) => {
      const keys = rawKeys.split(',').map((key) => key.trim());
      const numbers = keys.map((key) => entryByKey.get(key)?.number ?? null);
      if (keys.some((key) => key === '')) {
        addDiagnostic(
          diagnostics,
          'EMPTY_CITATION_KEY',
          '\\cite necesita una o más claves no vacías.',
        );
      }
      keys.forEach((key, index) => {
        if (key !== '' && numbers[index] === null) {
          addDiagnostic(
            diagnostics,
            'UNDEFINED_CITATION',
            `La cita "${key}" no coincide con ningún \\bibitem.`,
            key,
          );
        }
      });
      const value = `[${numbers.map((number) => number ?? '??').join(', ')}]`;
      citations.push({ keys, numbers, value });
      return value;
    },
  );

  const hasBibliography = ranges.length > 0;
  const hasBibliographicContent = hasBibliography || citations.length > 0;
  const limitations = hasBibliographicContent
    ? [
      'La numeración y las citas son una simulación segura; TexDock no ejecuta una compilación LaTeX real.',
      'La vista educativa conserva el orden de los \\bibitem y no sustituye a un gestor bibliográfico.',
    ]
    : [];

  return {
    remainingBody,
    hasBibliography,
    widthArgument: ranges[0]?.width ?? null,
    entries,
    citations,
    diagnostics,
    errors: diagnostics.map((diagnostic) => diagnostic.message),
    limitations,
  };
}
