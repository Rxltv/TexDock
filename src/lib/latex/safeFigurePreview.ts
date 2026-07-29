export interface SafeFigureImage {
  src: string;
  fileName: string;
  alt: string;
  widthPercent: number | null;
  widthCm: number | null;
  angle: number;
}

export interface SafeFigureItem {
  image: SafeFigureImage;
  caption: string | null;
  containerWidthPercent: number | null;
}

export interface SafeFigurePreview {
  items: SafeFigureItem[];
  caption: string | null;
  centered: boolean;
  placement: string | null;
  floating: boolean;
}

export interface SafeFigurePreviewResult {
  figures: SafeFigurePreview[];
  remainingBody: string;
  errors: string[];
}

const FIGURE_PATTERN = /\\begin\{figure\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{figure\}/g;
const SUBFIGURE_PATTERN = /\\begin\{subfigure\}\{([^{}]*)\}([\s\S]*?)\\end\{subfigure\}/g;
const INCLUDE_GRAPHICS_PATTERN = /\\includegraphics(?:\[([^\]]*)\])?\{([^{}]*)\}/g;
const ALLOWED_RESOURCE = /^(?:\/?imagenes\/curso\/seccion-11\/)?(imagen|antes|despues)\.png$/;
const RESOURCE_ALTERNATIVES: Record<string, string> = {
  'imagen.png': 'Planta de referencia del curso',
  'antes.png': 'Planta antes del crecimiento',
  'despues.png': 'Planta después del crecimiento',
};

function countMatches(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0;
}

function parsePositiveNumber(
  source: string,
  label: string,
  errors: string[],
): number | null {
  const value = Number(source);
  if (!Number.isFinite(value) || value <= 0) {
    errors.push(`${label} debe ser un número mayor que cero.`);
    return null;
  }
  return value;
}

function parseRelativeWidth(
  source: string,
  label: string,
  errors: string[],
): number | null {
  const compact = source.replace(/\s/g, '');
  if (compact === '\\textwidth') return 100;
  const match = compact.match(/^(\d+(?:\.\d+)?)\\textwidth$/);
  if (!match) {
    errors.push(`${label} no soportado: ${source}. Usa una fracción de \\textwidth.`);
    return null;
  }
  const factor = parsePositiveNumber(match[1], label, errors);
  return factor === null ? null : factor * 100;
}

function parseResourcePath(source: string, errors: string[]): {
  src: string;
  fileName: string;
  alt: string;
} | null {
  const path = source.trim();
  const match = path.match(ALLOWED_RESOURCE);
  if (!match) {
    errors.push(
      `Recurso gráfico no disponible: ${path || '(ruta vacía)'}. `
      + 'Usa imagen.png, antes.png o despues.png de la Sección 11.',
    );
    return null;
  }
  const fileName = `${match[1]}.png`;
  return {
    src: `/imagenes/curso/seccion-11/${fileName}`,
    fileName,
    alt: RESOURCE_ALTERNATIVES[fileName],
  };
}

function parseGraphicOptions(
  source: string | undefined,
  errors: string[],
): Pick<SafeFigureImage, 'widthPercent' | 'widthCm' | 'angle'> {
  let widthPercent: number | null = null;
  let widthCm: number | null = null;
  let scale: number | null = null;
  let angle = 0;
  const seen = new Set<string>();

  if (source?.trim()) {
    for (const rawOption of source.split(',')) {
      const option = rawOption.trim();
      const match = option.match(/^([A-Za-z]+)\s*=\s*(.+)$/);
      if (!match) {
        errors.push(`Opción gráfica mal formada: ${option}.`);
        continue;
      }
      const [, key, rawValue] = match;
      if (seen.has(key)) {
        errors.push(`La opción gráfica ${key} está repetida.`);
        continue;
      }
      seen.add(key);

      if (key === 'width') {
        const compactValue = rawValue.replace(/\s/g, '');
        const fixedWidth = compactValue.match(/^(\d+(?:\.\d+)?)cm$/);
        if (fixedWidth) {
          widthCm = parsePositiveNumber(fixedWidth[1], 'width', errors);
        } else {
          widthPercent = parseRelativeWidth(rawValue, 'width', errors);
        }
      } else if (key === 'scale') {
        scale = parsePositiveNumber(rawValue.trim(), 'scale', errors);
      } else if (key === 'angle') {
        const parsedAngle = Number(rawValue.trim());
        if (!Number.isFinite(parsedAngle)) {
          errors.push('angle debe ser un número válido.');
        } else {
          angle = parsedAngle;
        }
      } else {
        errors.push(`Opción gráfica no soportada: ${key}. Usa width, scale o angle.`);
      }
    }
  }

  if (scale !== null) {
    if (widthPercent !== null || widthCm !== null) {
      errors.push('Usa width o scale para el tamaño, no ambas opciones a la vez.');
    } else {
      widthPercent = scale * 100;
    }
  }

  return { widthPercent, widthCm, angle };
}

function parseImages(source: string, errors: string[]): SafeFigureImage[] {
  const images: SafeFigureImage[] = [];
  const pattern = new RegExp(INCLUDE_GRAPHICS_PATTERN.source, 'g');
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source)) !== null) {
    const resource = parseResourcePath(match[2], errors);
    const options = parseGraphicOptions(match[1], errors);
    if (resource) {
      images.push({ ...resource, ...options });
    }
  }
  return images;
}

function parseSubfigureWidth(source: string, errors: string[]): number | null {
  return parseRelativeWidth(source, 'Ancho de subfigure', errors);
}

function parseFigure(
  source: string,
  placement: string | null,
  errors: string[],
): SafeFigurePreview {
  const items: SafeFigureItem[] = [];
  const subfigurePattern = new RegExp(SUBFIGURE_PATTERN.source, 'g');
  let subfigureMatch: RegExpExecArray | null;

  while ((subfigureMatch = subfigurePattern.exec(source)) !== null) {
    const subfigureBody = subfigureMatch[2];
    const images = parseImages(subfigureBody, errors);
    if (images.length !== 1) {
      errors.push('Cada subfigure debe contener exactamente una imagen.');
    }
    if (images[0]) {
      items.push({
        image: images[0],
        caption: subfigureBody.match(/\\caption\{([^{}]*)\}/)?.[1].trim() ?? null,
        containerWidthPercent: parseSubfigureWidth(subfigureMatch[1], errors),
      });
    }
  }

  const withoutSubfigures = source.replace(new RegExp(SUBFIGURE_PATTERN.source, 'g'), '\n');
  if (items.length === 0) {
    for (const image of parseImages(withoutSubfigures, errors)) {
      items.push({ image, caption: null, containerWidthPercent: null });
    }
  }
  if (items.length === 0) {
    errors.push('El entorno figure necesita al menos una imagen.');
  }

  return {
    items,
    caption: withoutSubfigures.match(/\\caption\{([^{}]*)\}/)?.[1].trim() ?? null,
    centered: /\\centering(?![A-Za-z])/.test(source),
    placement,
    floating: true,
  };
}

export function parseSafeFigurePreview(
  body: string,
  packages: string[],
): SafeFigurePreviewResult {
  const errors: string[] = [];
  const figures: SafeFigurePreview[] = [];

  const figureBeginCount = countMatches(body, /\\begin\{figure\}/g);
  const figureEndCount = countMatches(body, /\\end\{figure\}/g);
  if (figureBeginCount !== figureEndCount) {
    errors.push('El entorno figure debe abrirse y cerrarse correctamente.');
  }
  const subfigureBeginCount = countMatches(body, /\\begin\{subfigure\}/g);
  const subfigureEndCount = countMatches(body, /\\end\{subfigure\}/g);
  if (subfigureBeginCount !== subfigureEndCount) {
    errors.push('El entorno subfigure debe abrirse y cerrarse correctamente.');
  }

  const includeUseCount = countMatches(body, /\\includegraphics(?![A-Za-z])/g);
  const completeIncludeCount = countMatches(body, new RegExp(INCLUDE_GRAPHICS_PATTERN.source, 'g'));
  if (includeUseCount !== completeIncludeCount) {
    errors.push('\\includegraphics está incompleto o mal formado.');
  }
  if (includeUseCount > 0 && !packages.includes('graphicx')) {
    errors.push('\\includegraphics requiere \\usepackage{graphicx} en el preámbulo.');
  }
  if (subfigureBeginCount > 0 && !packages.includes('subcaption')) {
    errors.push('El entorno subfigure requiere \\usepackage{subcaption} en el preámbulo.');
  }

  const figurePattern = new RegExp(FIGURE_PATTERN.source, 'g');
  let figureMatch: RegExpExecArray | null;
  while ((figureMatch = figurePattern.exec(body)) !== null) {
    const placement = figureMatch[1]?.trim() || null;
    if (placement && /[^htbp]/.test(placement)) {
      errors.push(`Preferencia de colocación no soportada: [${placement}]. Usa h, t, b o p.`);
    }
    figures.push(parseFigure(figureMatch[2], placement, errors));
  }

  const withoutFigures = body.replace(new RegExp(FIGURE_PATTERN.source, 'g'), '\n');
  for (const image of parseImages(withoutFigures, errors)) {
    figures.push({
      items: [{ image, caption: null, containerWidthPercent: null }],
      caption: null,
      centered: false,
      placement: null,
      floating: false,
    });
  }
  const remainingBody = withoutFigures.replace(
    new RegExp(INCLUDE_GRAPHICS_PATTERN.source, 'g'),
    '\n',
  );

  return { figures, remainingBody, errors };
}
