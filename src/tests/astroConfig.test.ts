import { describe, it, expect } from 'vitest';

const CONFIG_CONTENT = `
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({
  site: 'https://rxltv.github.io',
  base: '/TexDock',
  integrations: [react()],
  devToolbar: {
    enabled: false,
  },
});
`;

describe('Astro config', () => {
  it('site es https://rxltv.github.io', () => {
    expect(CONFIG_CONTENT).toContain("site: 'https://rxltv.github.io'");
  });

  it('base es /TexDock', () => {
    expect(CONFIG_CONTENT).toContain("base: '/TexDock'");
  });

  it('contiene devToolbar.enabled: false', () => {
    expect(CONFIG_CONTENT).toContain('devToolbar');
    expect(CONFIG_CONTENT).toContain('enabled: false');
  });
});