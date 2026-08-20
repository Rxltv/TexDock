export interface BusyTeXCompileResult {
  success: boolean;
  pdf?: Uint8Array;
  log?: string;
  exitCode?: number;
  reportedSuccess?: boolean;
  pdfBytes: number;
  pdfValid: boolean;
  pdfSignature: string | null;
  fatal: boolean;
  diagnostics: string[];
}

const FATAL_LOG_PATTERNS = [
  /!\s+Undefined control sequence\./i,
  /!\s+Emergency stop\./i,
  /!\s+LaTeX Error:/i,
  /!\s+Package .* Error:/i,
  /!\s+File ended while scanning/i,
  /!\s+.*Fatal error occurred/i,
];

function getPdfSignature(pdf: Uint8Array | undefined): string | null {
  if (!pdf || pdf.byteLength < 5) return null;
  return new TextDecoder().decode(pdf.slice(0, 5));
}

function getDiagnostics(log: string): string[] {
  return log
    .split(/\r?\n/)
    .filter((line) => FATAL_LOG_PATTERNS.some((pattern) => pattern.test(line)));
}

export function classifyBusyTeXResult(
  result: {
    success?: boolean;
    pdf?: Uint8Array;
    log?: string;
    exitCode?: number;
  },
): BusyTeXCompileResult {
  const pdf = result.pdf instanceof Uint8Array ? result.pdf : undefined;
  const pdfBytes = pdf?.byteLength ?? 0;
  const pdfSignature = getPdfSignature(pdf);
  const log = result.log ?? '';
  const diagnostics = getDiagnostics(log);
  const pdfValid = pdfSignature === '%PDF-' && pdfBytes > 0;
  const fatal = diagnostics.length > 0;

  return {
    success: Boolean(result.success && result.exitCode === 0 && pdfValid && !fatal),
    pdf,
    log,
    exitCode: result.exitCode,
    reportedSuccess: result.success,
    pdfBytes,
    pdfValid,
    pdfSignature,
    fatal,
    diagnostics,
  };
}
