import { describe, it, expect } from 'vitest';

import { readFileSync } from 'node:fs';

const CONFIG_CONTENT = readFileSync(
  new URL('../../astro.config.mjs', import.meta.url),
  'utf8',
);

describe('Astro config', () => {
  it('site es https://rxltv.github.io', () => {
    expect(CONFIG_CONTENT).toContain("site: 'https://rxltv.github.io'");
  });

  it('usa raíz en desarrollo y /TexDock en build', () => {
    expect(CONFIG_CONTENT).toContain("const isDevelopmentServer = process.argv.includes('dev')");
    expect(CONFIG_CONTENT).toContain("base: isDevelopmentServer ? '/' : '/TexDock'");
  });

  it('contiene devToolbar.enabled: false', () => {
    expect(CONFIG_CONTENT).toContain('devToolbar');
    expect(CONFIG_CONTENT).toContain('enabled: false');
  });
});
