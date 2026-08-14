import { describe, expect, it } from 'vitest';
import { libraryTemplates } from '../lib/library/templates';

describe('library templates', () => {
  it('contains the two approved copy-only templates', () => {
    expect(libraryTemplates.map((template) => template.id)).toEqual([
      'tarea-academica',
      'apuntes-clase',
    ]);
    for (const template of libraryTemplates) {
      expect(template.code).toContain('\\documentclass');
      expect(template.code).toContain('\\begin{document}');
      expect(template.code).toContain('\\end{document}');
      expect(template.preview.length).toBeGreaterThan(0);
      expect(template.purpose.length).toBeGreaterThan(0);
      expect(template.parts.length).toBeGreaterThan(0);
    }
  });
});
