import { StateField, type Extension, type Range } from '@codemirror/state';
import { Decoration, type DecorationSet, EditorView } from '@codemirror/view';
import { classifyLineZones } from '../zone/latexZoneLogic';

const preambleDeco = Decoration.line({ class: 'cm-zone-preamble' });
const bodyDeco = Decoration.line({ class: 'cm-zone-body' });
const beginBoundaryDeco = Decoration.line({ class: 'cm-zone-beginBoundary' });
const endBoundaryDeco = Decoration.line({ class: 'cm-zone-endBoundary' });

const zoneTheme = EditorView.theme({
  '.cm-zone-preamble': {
    backgroundColor: 'color-mix(in srgb, var(--color-code-soft, #e3f2fd) 25%, transparent)',
  },
  '.cm-zone-body': {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-elevated, #f5f0ff) 20%, transparent)',
  },
  '.cm-zone-beginBoundary': {
    backgroundColor: 'color-mix(in srgb, var(--color-code-soft, #e3f2fd) 40%, transparent)',
    boxShadow: 'inset 0 1px 0 var(--color-border)',
  },
  '.cm-zone-endBoundary': {
    backgroundColor: 'color-mix(in srgb, var(--color-surface-elevated, #f5f0ff) 40%, transparent)',
    boxShadow: 'inset 0 1px 0 var(--color-border)',
  },
});

export const zoneStateField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    if (!tr.docChanged) return deco;
    const zones = classifyLineZones(tr.state.doc.toString());
    const decorations: Range<Decoration>[] = [];
    for (const zone of zones) {
      switch (zone.kind) {
        case 'preamble': decorations.push(preambleDeco.range(zone.from)); break;
        case 'body': decorations.push(bodyDeco.range(zone.from)); break;
        case 'begin-boundary': decorations.push(beginBoundaryDeco.range(zone.from)); break;
        case 'end-boundary': decorations.push(endBoundaryDeco.range(zone.from)); break;
      }
    }
    return Decoration.set(decorations);
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function latexZoneDecorations(): Extension {
  return [zoneStateField, zoneTheme];
}