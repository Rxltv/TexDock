export type ZoneKind = 'preamble' | 'begin-boundary' | 'body' | 'end-boundary' | 'unknown';

export interface LineZone {
  from: number;
  kind: ZoneKind;
}

export function classifyLineZones(doc: string): LineZone[] {
  const lines: LineZone[] = [];
  const text = doc;
  const beginIdx = text.indexOf('\\begin{document}');
  const endIdx = text.indexOf('\\end{document}');

  let lineStart = 0;
  while (lineStart < text.length) {
    const lineEnd = text.indexOf('\n', lineStart);
    const lineEndIdx = lineEnd === -1 ? text.length : lineEnd;
    const lineContent = text.slice(lineStart, lineEndIdx);
    const lineLen = lineEndIdx - lineStart;

    let kind: ZoneKind;
    if (beginIdx === -1 && endIdx === -1) {
      kind = 'unknown';
    } else if (beginIdx !== -1 && lineStart <= beginIdx && lineStart + lineLen > beginIdx) {
      kind = lineContent.includes('\\begin{document}') ? 'begin-boundary' : 'preamble';
    } else if (endIdx !== -1 && lineStart <= endIdx && lineStart + lineLen > endIdx) {
      kind = lineContent.includes('\\end{document}') ? 'end-boundary' : 'body';
    } else if (beginIdx !== -1 && endIdx !== -1 && lineStart >= beginIdx && lineStart < endIdx) {
      kind = 'body';
    } else if (beginIdx !== -1 && endIdx === -1 && lineStart >= beginIdx) {
      kind = 'body';
    } else if (beginIdx !== -1 && lineStart < beginIdx) {
      kind = 'preamble';
    } else {
      kind = 'unknown';
    }

    lines.push({ from: lineStart, kind });
    lineStart = lineEnd === -1 ? text.length : lineEnd + 1;
  }

  return lines;
}