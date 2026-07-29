import { describe, expect, it } from 'vitest';
import { parseSafeFigurePreview } from './safeFigurePreview';
import { parseSafeLatexPreview } from './safeLatexPreview';

describe('vista previa segura de imágenes y figuras', () => {
  it('representa una imagen local con ancho relativo y rotación', () => {
    const result = parseSafeFigurePreview(
      String.raw`\includegraphics[width=0.5\textwidth,angle=180]{imagenes/curso/seccion-11/imagen.png}`,
      ['graphicx'],
    );

    expect(result.errors).toEqual([]);
    expect(result.figures).toHaveLength(1);
    expect(result.figures[0]).toMatchObject({
      caption: null,
      floating: false,
      centered: false,
    });
    expect(result.figures[0].items[0].image).toEqual({
      src: '/imagenes/curso/seccion-11/imagen.png',
      fileName: 'imagen.png',
      alt: 'Planta de referencia del curso',
      widthPercent: 50,
      widthCm: null,
      angle: 180,
    });
  });

  it('acepta el nombre breve del recurso y un ancho fijo', () => {
    const result = parseSafeFigurePreview(
      String.raw`\includegraphics[width=8cm]{imagen.png}`,
      ['graphicx'],
    );

    expect(result.errors).toEqual([]);
    expect(result.figures[0].items[0].image).toMatchObject({
      src: '/imagenes/curso/seccion-11/imagen.png',
      widthPercent: null,
      widthCm: 8,
    });
  });

  it('representa una figura centrada con leyenda y colocación', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \usepackage{graphicx}
      \begin{document}
      \begin{figure}[htbp]
      \centering
      \includegraphics[width=0.7\textwidth]{imagenes/curso/seccion-11/imagen.png}
      \caption{Planta del experimento}
      \end{figure}
      \end{document}
    `);

    expect(result.errors).toEqual([]);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.figures).toHaveLength(1);
    expect(result.figures[0]).toMatchObject({
      caption: 'Planta del experimento',
      centered: true,
      placement: 'htbp',
      floating: true,
    });
  });

  it('representa dos subfiguras con leyendas individuales y general', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \usepackage{graphicx}
      \usepackage{subcaption}
      \begin{document}
      \begin{figure}
      \centering
      \begin{subfigure}{0.45\textwidth}
      \includegraphics[width=\textwidth]{imagenes/curso/seccion-11/antes.png}
      \caption{Antes}
      \end{subfigure}
      \hfill
      \begin{subfigure}{0.45\textwidth}
      \includegraphics[width=\textwidth]{imagenes/curso/seccion-11/despues.png}
      \caption{Después}
      \end{subfigure}
      \caption{Comparación del crecimiento}
      \end{figure}
      \end{document}
    `);

    expect(result.errors).toEqual([]);
    expect(result.unsupportedCommands).toEqual([]);
    expect(result.figures[0].items).toHaveLength(2);
    expect(result.figures[0].items.map((item) => item.caption)).toEqual(['Antes', 'Después']);
    expect(result.figures[0].items.map((item) => item.containerWidthPercent)).toEqual([45, 45]);
    expect(result.figures[0].caption).toBe('Comparación del crecimiento');
  });

  it('rechaza paquetes ausentes, rutas externas y opciones fuera del curso', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \begin{document}
      \begin{subfigure}{0.5\textwidth}
      \includegraphics[height=4cm]{https://example.com/image.png}
      \end{subfigure}
      \end{document}
    `);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      '\\includegraphics requiere \\usepackage{graphicx} en el preámbulo.',
    );
    expect(result.errors).toContain(
      'El entorno subfigure requiere \\usepackage{subcaption} en el preámbulo.',
    );
    expect(result.errors.join(' ')).toContain('Recurso gráfico no disponible');
    expect(result.errors).toContain(
      'Opción gráfica no soportada: height. Usa width, scale o angle.',
    );
  });

  it('no conserva comandos gráficos como contenido no soportado', () => {
    const result = parseSafeLatexPreview(String.raw`
      \documentclass{article}
      \usepackage{graphicx}
      \begin{document}
      Introducción.
      \includegraphics[scale=0.8]{imagenes/curso/seccion-11/imagen.png}
      \end{document}
    `);

    expect(result.valid).toBe(true);
    expect(result.paragraphs).toEqual(['Introducción.']);
    expect(result.figures).toHaveLength(1);
    expect(result.unsupportedCommands).toEqual([]);
  });
});
