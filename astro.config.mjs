// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

const isDevelopmentServer = process.argv.includes('dev');
const mathJaxSvgBrowserImports = [
  '@mathjax/src/js/mathjax.js',
  '@mathjax/src/js/adaptors/browserAdaptor.js',
  '@mathjax/src/js/handlers/html.js',
  '@mathjax/src/js/input/tex.js',
  '@mathjax/src/js/output/svg.js',
  '@mathjax/src/js/input/tex/base/BaseConfiguration.js',
  '@mathjax/src/js/input/tex/ams/AmsConfiguration.js',
  '@mathjax/mathjax-newcm-font/js/svg.js',
];

// https://astro.build/config
export default defineConfig({
  site: 'https://rxltv.github.io',
  base: isDevelopmentServer ? '/' : '/TexDock',
  integrations: [react()],
  vite: {
    optimizeDeps: {
      include: mathJaxSvgBrowserImports,
    },
  },
  devToolbar: {
    enabled: false,
  },
});
