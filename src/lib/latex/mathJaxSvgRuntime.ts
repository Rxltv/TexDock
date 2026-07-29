import { mathjax } from '@mathjax/src/js/mathjax.js';
import { browserAdaptor } from '@mathjax/src/js/adaptors/browserAdaptor.js';
import { RegisterHTMLHandler } from '@mathjax/src/js/handlers/html.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { SVG } from '@mathjax/src/js/output/svg.js';
import '@mathjax/src/js/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import { MathJaxNewcmFont } from '@mathjax/mathjax-newcm-font/js/svg.js';

const adaptor = browserAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX({
  packages: ['base', 'ams'],
  formatError: (_jax: unknown, error: unknown) => {
    throw error;
  },
});

const svgOutput = new SVG({
  fontCache: 'local',
  fontData: MathJaxNewcmFont,
});

const mathDocument = mathjax.document('', {
  InputJax: tex,
  OutputJax: svgOutput,
});

export async function convertLatexToSvg(latex: string): Promise<SVGSVGElement> {
  tex.reset();
  const container = await mathDocument.convertPromise(latex, {
    display: true,
    em: 16,
    ex: 8,
    containerWidth: 1_280,
  }) as HTMLElement;
  const svg = container.querySelector('svg');

  if (!(svg instanceof SVGSVGElement)) {
    throw new Error('MathJax no generó una raíz SVG.');
  }
  return svg;
}
