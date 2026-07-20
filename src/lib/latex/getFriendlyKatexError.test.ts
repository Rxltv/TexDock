import { describe, it, expect } from 'vitest';
import { getFriendlyKatexError } from './getFriendlyKatexError';

describe('getFriendlyKatexError', () => {
  it('detects unclosed braces (missing })', () => {
    const result = getFriendlyKatexError("KaTeX parse error: Expected '}', got 'x' at position 5");
    expect(result.friendly).toContain('llave');
    expect(result.friendly).toContain('cierre');
    expect(result.technical).toContain('Llave');
  });

  it('detects missing opening brace ({)', () => {
    const result = getFriendlyKatexError("KaTeX parse error: Expected '{', got 'x'");
    expect(result.friendly).toContain('llave');
    expect(result.friendly).toContain('apertura');
    expect(result.technical).toContain('Llave');
  });

  it('detects unknown commands', () => {
    const result = getFriendlyKatexError("Undefined control sequence: \\foobar");
    expect(result.friendly).toContain('\\foobar');
    expect(result.friendly).toContain('definido');
    expect(result.technical).toContain('foobar');
  });

  it('detects undefined environments', () => {
    const result = getFriendlyKatexError("KaTeX parse error: Environment matrixx not defined");
    expect(result.friendly).toContain('matrixx');
    expect(result.friendly).toContain('definido');
    expect(result.technical).toContain('matrixx');
  });

  it('detects incorrectly closed environments', () => {
    const result = getFriendlyKatexError(
      "KaTeX parse error: \\begin{array} on line 1 ended by \\end{matrix}"
    );
    expect(result.friendly).toContain('array');
    expect(result.friendly).toContain('\\end{matrix}');
    expect(result.technical).toContain('array');
    expect(result.technical).toContain('matrix');
  });

  it('detects incomplete arguments', () => {
    const result = getFriendlyKatexError("KaTeX parse error: Expected argument for \\sqrt");
    expect(result.friendly).toContain('\\sqrt');
    expect(result.friendly).toContain('argumento');
    expect(result.technical).toContain('\\sqrt');
  });

  it('detects mismatched braces', () => {
    const result = getFriendlyKatexError("KaTeX parse error: mismatched braces at position 5");
    expect(result.friendly).toContain('llaves');
    expect(result.friendly).toContain('desbalanceadas');
    expect(result.technical).toContain('desbalanceadas');
  });

  it('uses fallback for unrecognized errors', () => {
    const errorMsg = "KaTeX parse error: Something completely unexpected";
    const result = getFriendlyKatexError(errorMsg);
    expect(result.friendly).toContain('error');
    expect(result.technical).toBe(errorMsg);
  });

  it('always preserves the technical detail', () => {
    const result = getFriendlyKatexError("Undefined control sequence: \\testcmd");
    expect(result.technical).toBeTruthy();
    expect(typeof result.technical).toBe('string');
  });

  it('never returns HTML in friendly or technical messages', () => {
    const cases = [
      "KaTeX parse error: Expected '}', got 'x'",
      "Undefined control sequence: \\foo",
      "Environment bar not defined",
      "\\begin{array} ended by \\end{matrix}",
      "Expected argument for \\frac",
      "Some random raw error with <script>alert('x')</script>",
    ];
    for (const err of cases) {
      const result = getFriendlyKatexError(err);
      expect(result.friendly).not.toContain('<');
      expect(result.friendly).not.toContain('>');
      expect(result.technical).not.toContain('<');
      expect(result.technical).not.toContain('>');
    }
  });

  it('returns an object with friendly and technical keys', () => {
    const result = getFriendlyKatexError("any error");
    expect(result).toHaveProperty('friendly');
    expect(result).toHaveProperty('technical');
    expect(typeof result.friendly).toBe('string');
    expect(typeof result.technical).toBe('string');
  });
});
