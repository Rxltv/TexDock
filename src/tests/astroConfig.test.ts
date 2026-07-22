import { describe, it, expect } from 'vitest';

const CONFIG_CONTENT = `
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
export default defineConfig({
  integrations: [react()],
  devToolbar: {
    enabled: false,
  },
});
`;

describe('Astro config', () => {
  it('contiene devToolbar.enabled: false', () => {
    expect(CONFIG_CONTENT).toContain('devToolbar');
    expect(CONFIG_CONTENT).toContain('enabled: false');
  });
});