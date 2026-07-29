// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

const isDevelopmentServer = process.argv.includes('dev');

// https://astro.build/config
export default defineConfig({
  site: 'https://rxltv.github.io',
  base: isDevelopmentServer ? '/' : '/TexDock',
  integrations: [react()],
  devToolbar: {
    enabled: false,
  },
});
