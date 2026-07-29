import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(relativePath: string): string {
  return readFileSync(resolve(relativePath), 'utf8');
}

describe('presentación reutilizable de los ejercicios', () => {
  const exerciseView = source('src/components/content/ExerciseView.astro');
  const workspace = source('src/components/editor/SafeLatexWorkspace.tsx');
  const preview = source('src/components/preview/SafeLatexPreviewPanel.tsx');
  const lessonPage = source('src/pages/aprender/[...slug].astro');

  it('separa el objetivo del código y de la vista previa sin duplicarlo', () => {
    expect(exerciseView).toContain('objective={exercise.objective}');
    expect(exerciseView).not.toContain('<h4>Objetivo</h4>');
    expect(workspace).toContain('className={`workspace-objective workspace-objective--${objectiveState.kind}`}');
    expect(workspace).toContain('grid-column: 1 / -1');
    expect(preview).not.toContain('preview-objective');
  });

  it('abre la solución directamente en el código y elimina la etiqueta anterior', () => {
    expect(exerciseView).toContain('<summary><span class="summary-text">Ver solución</span></summary>');
    expect(exerciseView).toContain('{exercise.canonicalSolution}');
    expect(exerciseView.toLocaleLowerCase('es')).not.toContain(['solución', 'canónica'].join(' '));
  });

  it('renderiza formato y jerarquía mediante nodos seguros, no HTML de usuario', () => {
    expect(preview).toContain("inline.kind === 'strong'");
    expect(preview).toContain('<strong key={index}>{children}</strong>');
    expect(preview).toContain('preview-document-heading--section');
    expect(preview).toContain('preview-document-heading--subsection');
    expect(preview).toContain('preview-document-heading--subsubsection');
    expect(preview).not.toContain('dangerouslySetInnerHTML={{ __html: inline.text');
  });

  it('ofrece sangría y marcadores diferenciados para listas anidadas', () => {
    expect(preview).toContain('preview-list--unordered .preview-list--unordered');
    expect(preview).toContain('preview-list--ordered .preview-list--ordered');
    expect(lessonPage).toContain('.page-theory ul ul ul');
    expect(lessonPage).toContain('.page-theory ol ol ol');
    expect(lessonPage).toContain('padding-left: clamp(');
  });

  it('mantiene bloques pedagógicos legibles con etiqueta, contenido y continuaciones', () => {
    expect(lessonPage).toContain('.page-theory p:has(> strong:first-child) > strong:first-child');
    expect(lessonPage).toContain('width: fit-content');
    expect(lessonPage).toContain('> strong:not(:first-child)');
    expect(lessonPage).toContain('.page-theory p:has(> strong:first-child) + ul');
    expect(lessonPage).toContain('.page-theory p:has(> strong:first-child) + pre');
    expect(lessonPage).toContain('overflow-wrap: anywhere');
  });
});
