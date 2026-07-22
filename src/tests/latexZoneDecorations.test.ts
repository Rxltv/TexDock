import { describe, it, expect } from 'vitest';
import { classifyLineZones } from '../lib/zone/latexZoneLogic';

describe('classifyLineZones', () => {
  it('identifica líneas del preámbulo', () => {
    const code = '\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\begin{document}\nTexto\n\\end{document}';
    const zones = classifyLineZones(code);
    expect(zones[0].kind).toBe('preamble');
    expect(zones[1].kind).toBe('preamble');
  });

  it('identifica \\begin{document} como begin-boundary', () => {
    const code = '\\documentclass{article}\n\\begin{document}\n\\end{document}';
    const zones = classifyLineZones(code);
    expect(zones[1].kind).toBe('begin-boundary');
  });

  it('identifica líneas del cuerpo', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nHola\nMundo\n\\end{document}';
    const zones = classifyLineZones(code);
    expect(zones[2].kind).toBe('body');
    expect(zones[3].kind).toBe('body');
  });

  it('identifica \\end{document} como end-boundary', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nTexto\n\\end{document}';
    const zones = classifyLineZones(code);
    expect(zones[3].kind).toBe('end-boundary');
  });

  it('si falta begin, no clasifica todo como cuerpo', () => {
    const code = '\\documentclass{article}\nTexto\n\\end{document}';
    const zones = classifyLineZones(code);
    expect(zones.some((z) => z.kind === 'body')).toBe(false);
  });

  it('si falta end, extiende el cuerpo hasta el final', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nTexto\nMas texto';
    const zones = classifyLineZones(code);
    expect(zones[2].kind).toBe('body');
    expect(zones[3].kind).toBe('body');
  });

  it('documento vacío no produce zonas', () => {
    const zones = classifyLineZones('');
    expect(zones.length).toBe(0);
  });

  it('documento de una sola línea sin salto final', () => {
    const zones = classifyLineZones('\\documentclass{article}');
    expect(zones.length).toBe(1);
    expect(zones[0].kind).toBe('unknown');
  });

  it('documento con salto de línea final no entra en bucle', () => {
    const zones = classifyLineZones('\\documentclass{article}\n\\begin{document}\n\\end{document}\n');
    expect(zones.length).toBe(3);
    expect(zones[0].kind).toBe('preamble');
    expect(zones[1].kind).toBe('begin-boundary');
    expect(zones[2].kind).toBe('end-boundary');
  });

  it('se recalcula al cambiar el documento', () => {
    const zones1 = classifyLineZones('\\documentclass{article}\n\\begin{document}\n\\end{document}');
    const zones2 = classifyLineZones('\\begin{document}\nTexto\n\\end{document}');
    expect(zones1).not.toEqual(zones2);
    expect(zones1[0].kind).toBe('preamble');
    expect(zones2[0].kind).toBe('begin-boundary');
  });
});