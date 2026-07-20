import { describe, it, expect } from 'vitest';
import katex from 'katex';
import { mathExamples, type MathExample } from './mathExamples';

const katexConfig = {
  displayMode: true,
  throwOnError: true,
  trust: false,
  strict: 'warn' as const,
};

describe('mathExamples', () => {
  it('the list is not empty', () => {
    expect(mathExamples.length).toBeGreaterThan(0);
  });

  it('all IDs are unique', () => {
    const ids = mathExamples.map((ex) => ex.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('every example has label, description and latex', () => {
    for (const ex of mathExamples) {
      expect(ex).toHaveProperty('label');
      expect(ex).toHaveProperty('description');
      expect(ex).toHaveProperty('latex');
    }
  });

  it('no example has empty values', () => {
    const keys: (keyof MathExample)[] = ['id', 'label', 'description', 'latex'];
    for (const ex of mathExamples) {
      for (const key of keys) {
        expect(ex[key]).toBeTruthy();
        expect(typeof ex[key]).toBe('string');
        expect(ex[key].trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('each expression renders with KaTeX without throwing', () => {
    for (const ex of mathExamples) {
      expect(() => {
        katex.renderToString(ex.latex, katexConfig);
      }).not.toThrow();
    }
  });
});
