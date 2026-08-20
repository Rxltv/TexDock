import { describe, expect, it } from 'vitest';
import { classifyBusyTeXResult } from './compilationResult';

const validPdf = new Uint8Array([37, 80, 68, 70, 45, 1]);

describe('classifyBusyTeXResult', () => {
  it('accepts a non-empty PDF with the PDF signature', () => {
    const result = classifyBusyTeXResult({
      success: true,
      exitCode: 0,
      pdf: validPdf,
      log: 'Compilation complete.',
    });

    expect(result.success).toBe(true);
    expect(result.pdfValid).toBe(true);
    expect(result.pdfSignature).toBe('%PDF-');
    expect(result.fatal).toBe(false);
  });

  it('rejects an empty PDF even when the wrapper reports success', () => {
    const result = classifyBusyTeXResult({
      success: true,
      exitCode: 0,
      pdf: new Uint8Array(),
      log: 'Compilation complete.',
    });

    expect(result.success).toBe(false);
    expect(result.pdfValid).toBe(false);
    expect(result.pdfBytes).toBe(0);
  });

  it('rejects bytes without the PDF signature', () => {
    const result = classifyBusyTeXResult({
      success: true,
      exitCode: 0,
      pdf: new Uint8Array([1, 2, 3, 4, 5]),
      log: '',
    });

    expect(result.success).toBe(false);
    expect(result.pdfSignature).toBe('\u0001\u0002\u0003\u0004\u0005');
  });

  it('rejects fatal log diagnostics despite success and exit code zero', () => {
    const result = classifyBusyTeXResult({
      success: true,
      exitCode: 0,
      pdf: new Uint8Array(),
      log: '! Undefined control sequence.\n!  ==> Fatal error occurred, no output PDF file produced!',
    });

    expect(result.success).toBe(false);
    expect(result.fatal).toBe(true);
    expect(result.diagnostics).toHaveLength(2);
  });

  it('rejects a non-zero wrapper exit code with an otherwise valid PDF', () => {
    const result = classifyBusyTeXResult({
      success: true,
      exitCode: 1,
      pdf: validPdf,
      log: '',
    });

    expect(result.success).toBe(false);
    expect(result.pdfValid).toBe(true);
  });
});
