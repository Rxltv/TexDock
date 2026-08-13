import { describe, it, expect } from 'vitest';
import { validateExercise, type ValidationRule } from './validateExercise';

const MINIMAL_RULES: ValidationRule[] = [
  {
    id: 'req-documentclass',
    type: 'REQUIRE_COMMAND',
    required: true,
    scope: 'FULL_DOCUMENT',
    target: '\\documentclass',
    feedback: 'Falta \\documentclass{article}.',
  },
  {
    id: 'req-begin-document',
    type: 'REQUIRE_COMMAND',
    required: true,
    scope: 'FULL_DOCUMENT',
    target: '\\begin{document}',
    feedback: 'Falta \\begin{document}.',
  },
  {
    id: 'req-end-document',
    type: 'REQUIRE_COMMAND',
    required: true,
    scope: 'FULL_DOCUMENT',
    target: '\\end{document}',
    feedback: 'Falta \\end{document}.',
  },
  {
    id: 'req-article-arg',
    type: 'REQUIRE_ARGUMENT',
    required: true,
    scope: 'FULL_DOCUMENT',
    target: '\\documentclass',
    expected: 'article',
    feedback: 'El argumento de \\documentclass debe ser «article».',
  },
  {
    id: 'req-text',
    type: 'REQUIRE_TEXT',
    required: true,
    scope: 'BODY',
    target: '',
    feedback: 'El cuerpo debe contener texto.',
  },
];

const CANONICAL_SOLUTION =
  '\\documentclass{article}\n\\begin{document}\nHola, LaTeX\n\\end{document}';

describe('validateExercise', () => {
  it('1. accepts a minimal correct solution', () => {
    const result = validateExercise(CANONICAL_SOLUTION, MINIMAL_RULES);
    expect(result.valid).toBe(true);
    expect(result.matchedRules).toHaveLength(5);
    expect(result.failedRules).toHaveLength(0);
    expect(result.unsupportedRules).toHaveLength(0);
    expect(result.feedback).toHaveLength(0);
  });

  it('2. handles different spacing and indentation', () => {
    const code =
      '  \\documentclass{article}\n\n\\begin{document}\n  Hola, LaTeX  \n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(true);
  });

  it('3. handles CRLF line endings', () => {
    const code =
      '\\documentclass{article}\r\n\\begin{document}\r\nHola, LaTeX\r\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(true);
  });

  it('4. ignores irrelevant comments', () => {
    const code =
      '\\documentclass{article} % esto es un comentario\n\\begin{document}\nHola, LaTeX\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(true);
  });

  it('5. rejects missing \\documentclass', () => {
    const code = '\\begin{document}\nHola, LaTeX\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const cmd = result.failedRules.find(
      (f) => f.code === 'MISSING_COMMAND' && f.command === '\\documentclass',
    );
    expect(cmd).toBeDefined();
  });

  it('6. rejects a class different from article', () => {
    const code =
      '\\documentclass{report}\n\\begin{document}\nHola, LaTeX\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const arg = result.failedRules.find((f) => f.code === 'WRONG_ARGUMENT');
    expect(arg).toBeDefined();
    expect(arg?.argument).toBe('article');
  });

  it('7. rejects missing \\begin{document}', () => {
    const code = '\\documentclass{article}\nHola, LaTeX\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const cmd = result.failedRules.find(
      (f) => f.code === 'MISSING_COMMAND' && f.command === '\\begin{document}',
    );
    expect(cmd).toBeDefined();
  });

  it('8. rejects missing \\end{document}', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nHola, LaTeX';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const cmd = result.failedRules.find(
      (f) => f.code === 'MISSING_COMMAND' && f.command === '\\end{document}',
    );
    expect(cmd).toBeDefined();
  });

  it('9. rejects end before begin', () => {
    const code =
      '\\documentclass{article}\n\\end{document}\n\\begin{document}\nHola, LaTeX\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const text = result.failedRules.find((f) => f.code === 'MISSING_TEXT');
    expect(text).toBeDefined();
  });

  it('10. rejects missing required command', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-frac',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\frac',
        feedback: 'Usa \\frac.',
      },
    ];
    const result = validateExercise('$0.5$', rules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0].code).toBe('MISSING_COMMAND');
  });

  it('11. rejects wrong required argument', () => {
    const code = '\\documentclass{book}\n\\begin{document}\nHola\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const arg = result.failedRules.find((f) => f.code === 'WRONG_ARGUMENT');
    expect(arg).toBeDefined();
  });

  it('12. accepts when required text is present', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-hola',
        type: 'REQUIRE_TEXT',
        required: true,
        scope: 'BODY',
        target: 'Hola, LaTeX',
        feedback: 'Escribe «Hola, LaTeX» en el cuerpo.',
      },
    ];
    const code =
      '\\documentclass{article}\n\\begin{document}\nHola, LaTeX\n\\end{document}';
    const result = validateExercise(code, rules);
    expect(result.valid).toBe(true);
  });

  it('13. rejects missing required text', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-hola',
        type: 'REQUIRE_TEXT',
        required: true,
        scope: 'BODY',
        target: 'Hola, LaTeX',
        feedback: 'Escribe «Hola, LaTeX» en el cuerpo.',
      },
    ];
    const code =
      '\\documentclass{article}\n\\begin{document}\n\\end{document}';
    const result = validateExercise(code, rules);
    expect(result.valid).toBe(false);
    const text = result.failedRules.find((f) => f.code === 'MISSING_TEXT');
    expect(text).toBeDefined();
  });

  it('14. does not modify the input code', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const copy = String(code);
    validateExercise(code, MINIMAL_RULES);
    expect(code).toBe(copy);
  });

  it('15. passes with multiple rules all correct', () => {
    const result = validateExercise(CANONICAL_SOLUTION, MINIMAL_RULES);
    expect(result.valid).toBe(true);
    expect(result.matchedRules).toEqual(
      expect.arrayContaining([
        'req-documentclass',
        'req-begin-document',
        'req-end-document',
        'req-article-arg',
        'req-text',
      ]),
    );
  });

  it('16. reports multiple failures', () => {
    const code = '\\begin{document}\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    expect(result.failedRules.length).toBeGreaterThanOrEqual(2);
    expect(result.feedback.length).toBeGreaterThanOrEqual(2);
  });

  it('17. is deterministic when validating the same input twice', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const a = validateExercise(code, MINIMAL_RULES);
    const b = validateExercise(code, MINIMAL_RULES);
    expect(a).toEqual(b);
  });

  it('18. accepts an equivalent solution not identical to canonicalSolution', () => {
    const eqCode =
      '  \\documentclass{article}\n\\begin{document}\nMi texto.\n\\end{document}  ';
    const result = validateExercise(eqCode, MINIMAL_RULES);
    expect(result.valid).toBe(true);
  });

  it('19. does not count \\documentclass inside a comment', () => {
    const code =
      '% \\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const result = validateExercise(code, MINIMAL_RULES);
    expect(result.valid).toBe(false);
    const cmd = result.failedRules.find(
      (f) => f.code === 'MISSING_COMMAND' && f.command === '\\documentclass',
    );
    expect(cmd).toBeDefined();
  });

  it('20. preserves escaped percent \\% as literal text', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-text-percent',
        type: 'REQUIRE_TEXT',
        required: true,
        scope: 'BODY',
        target: '',
        feedback: 'El cuerpo debe tener texto.',
      },
      {
        id: 'req-begin',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\begin{document}',
        feedback: 'Falta begin.',
      },
      {
        id: 'req-end',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\end{document}',
        feedback: 'Falta end.',
      },
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
      {
        id: 'req-arg',
        type: 'REQUIRE_ARGUMENT',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        expected: 'article',
        feedback: 'Clase debe ser article.',
      },
    ];
    const code =
      '\\documentclass{article}\n\\begin{document}\n50\\%\n\\end{document}';
    const result = validateExercise(code, rules);
    expect(result.valid).toBe(true);
  });
});

describe('REQUIRE_ORDER', () => {
  const orderRules: ValidationRule[] = [
    {
      id: 'order-test',
      type: 'REQUIRE_ORDER',
      required: true,
      scope: 'FULL_DOCUMENT',
      target: '\\documentclass\u2192\\begin{document}\u2192\\end{document}',
      feedback: 'Orden incorrecto.',
    },
  ];

  it('passes when elements are in correct order', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const result = validateExercise(code, orderRules);
    expect(result.valid).toBe(true);
  });

  it('fails when end appears before begin', () => {
    const code =
      '\\documentclass{article}\n\\end{document}\n\\begin{document}\nHola';
    const result = validateExercise(code, orderRules);
    expect(result.valid).toBe(false);
  });

  it('accepts arguments and finds a later repeated target', () => {
    const rules: ValidationRule[] = [{
      id: 'arguments-order',
      type: 'REQUIRE_ORDER',
      required: true,
      scope: 'BODY',
      arguments: ['A', 'B'],
      feedback: 'Orden incorrecto.',
    }];
    const code = '\\documentclass{article}\nB\\begin{document}\nB A B\n\\end{document}';
    expect(validateExercise(code, rules).valid).toBe(true);
  });

  it('respects BODY scope and rejects reversed body content', () => {
    const rules: ValidationRule[] = [{
      id: 'body-order',
      type: 'REQUIRE_ORDER',
      required: true,
      scope: 'BODY',
      arguments: ['A', 'B'],
      feedback: 'Orden incorrecto.',
    }];
    const code = '\\documentclass{article}\nA B\\begin{document}\nB A\n\\end{document}';
    expect(validateExercise(code, rules).valid).toBe(false);
  });

  it('rejects incomplete configurations', () => {
    const rules: ValidationRule[] = [{
      id: 'incomplete-order',
      type: 'REQUIRE_ORDER',
      required: true,
      scope: 'BODY',
      arguments: ['A'],
      feedback: 'Orden incompleto.',
    }];
    expect(validateExercise('A', rules).valid).toBe(false);
    expect(validateExercise('A', rules).failedRules[0].code).toBe('INVALID_STRUCTURE');
  });
});

describe('visible body text and math scope', () => {
  it('rejects an empty body or commands only and accepts alternative visible text', () => {
    const rules: ValidationRule[] = [{
      id: 'visible-text',
      type: 'REQUIRE_TEXT',
      required: true,
      scope: 'BODY',
      target: '',
      feedback: 'Añade texto visible.',
    }];
    const wrap = (body: string) => `\\documentclass{article}\n\\begin{document}\n${body}\n\\end{document}`;
    expect(validateExercise(wrap(''), rules).valid).toBe(false);
    expect(validateExercise(wrap('\\maketitle\\tableofcontents'), rules).valid).toBe(true);
    expect(validateExercise(wrap('Un texto alternativo.'), rules).valid).toBe(true);
  });

  it('supports strict visible prose without changing generic REQUIRE_TEXT', () => {
    const rules: ValidationRule[] = [{
      id: 'visible-prose',
      type: 'REQUIRE_TEXT',
      required: true,
      scope: 'BODY',
      target: '',
      normalization: ['VISIBLE_PROSE'],
      feedback: 'Añade prosa visible.',
    }];
    const wrap = (body: string) => `\\documentclass{article}\n\\begin{document}\n${body}\n\\end{document}`;
    for (const body of ['\\label{x}', '\\section{Hola}', '\\caption{Hola}', '\\foo{Hola}', '$x$', '\\[x\\]']) {
      expect(validateExercise(wrap(body), rules).valid, body).toBe(false);
    }
    for (const body of ['Hola.', '\\textbf{Hola}', '\\emph{Hola}']) {
      expect(validateExercise(wrap(body), rules).valid, body).toBe(true);
    }
  });

  it('extracts equivalent math forms completely and in source order', () => {
    const rule = (target: string): ValidationRule[] => [{
      id: `math-${target}`,
      type: 'REQUIRE_TEXT',
      required: true,
      scope: 'MATH',
      target,
      feedback: 'Falta la expresión.',
    }];
    for (const code of ['$x$', '$$x$$', '\\(x\\)', '\\[x\\]']) {
      expect(validateExercise(code, rule('x')).valid, code).toBe(true);
    }
    for (const code of ['$f(x)$', '$$f(x)$$', '\\(f(x)\\)']) {
      expect(validateExercise(code, rule('f(x)')).valid, code).toBe(true);
    }
    expect(validateExercise('\\(A\\) $B$', rule('A B')).valid).toBe(true);
  });
});

describe('REQUIRE_ENVIRONMENT', () => {
  const envRules: ValidationRule[] = [
    {
      id: 'env-document',
      type: 'REQUIRE_ENVIRONMENT',
      required: true,
      scope: 'FULL_DOCUMENT',
      target: 'document',
      feedback: 'Falta el entorno document.',
    },
  ];

  it('passes when both begin and end exist in correct order', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const result = validateExercise(code, envRules);
    expect(result.valid).toBe(true);
  });

  it('fails when \\begin{document} is missing', () => {
    const code =
      '\\documentclass{article}\nHola\n\\end{document}';
    const result = validateExercise(code, envRules);
    expect(result.valid).toBe(false);
  });

  it('fails when \\end{document} is missing', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\nHola';
    const result = validateExercise(code, envRules);
    expect(result.valid).toBe(false);
  });

  it('fails when end appears before begin', () => {
    const code =
      '\\documentclass{article}\n\\end{document}\n\\begin{document}\nHola\n\\end{document}';
    const result = validateExercise(code, envRules);
    expect(result.valid).toBe(false);
  });
});

describe('FORBID_ALTERNATIVE', () => {
  const forbidRules: ValidationRule[] = [
    {
      id: 'req-frac',
      type: 'REQUIRE_COMMAND',
      required: true,
      scope: 'FULL_DOCUMENT',
      target: '\\frac',
      feedback: 'Usa \\frac.',
    },
    {
      id: 'forbid-05',
      type: 'FORBID_ALTERNATIVE',
      required: true,
      scope: 'BODY',
      target: '0.5',
      feedback: 'No uses 0.5, usa \\frac{1}{2}.',
    },
  ];

  it('passes when using \\frac and not the forbidden alternative', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\n$\\frac{1}{2}$\n\\end{document}';
    const result = validateExercise(code, forbidRules);
    expect(result.valid).toBe(true);
  });

  it('fails when forbidden alternative is present even with \\frac', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\n$\\frac{1}{2}$ y $0.5$\n\\end{document}';
    const result = validateExercise(code, forbidRules);
    expect(result.valid).toBe(false);
    const forb = result.failedRules.find((f) => f.code === 'FORBIDDEN_ALTERNATIVE');
    expect(forb).toBeDefined();
  });
});

describe('reglas de notas al pie', () => {
  const validFootnotesRule: ValidationRule[] = [{
    id: 'valid-footnotes',
    type: 'REQUIRE_VALID_FOOTNOTES',
    required: true,
    scope: 'BODY',
    feedback: 'Escribe notas válidas y unidas a su término.',
  }];
  const footnotePairRule: ValidationRule[] = [{
    id: 'footnote-pair',
    type: 'REQUIRE_FOOTNOTE_PAIR',
    required: true,
    scope: 'BODY',
    feedback: 'Separa la marca y el texto de la nota tabular.',
  }];

  it('acepta notas directas no vacías y unidas al término', () => {
    const code = String.raw`\documentclass{article}
\begin{document}
La media\footnote{Promedio aritmético.} resume los datos.
\end{document}`;
    expect(validateExercise(code, validFootnotesRule).valid).toBe(true);
  });

  it('rechaza una nota vacía, separada o atrapada en tabular', () => {
    const cases = [
      String.raw`\documentclass{article}
\begin{document}
La media\footnote{} resume los datos.
\end{document}`,
      String.raw`\documentclass{article}
\begin{document}
La media \footnote{Promedio aritmético.} resume los datos.
\end{document}`,
      String.raw`\documentclass{article}
\begin{document}
\begin{tabular}{lr}
Media & 14.2\footnote{Promedio observado.}
\end{tabular}
\end{document}`,
    ];

    for (const code of cases) {
      const result = validateExercise(code, validFootnotesRule);
      expect(result.valid).toBe(false);
      expect(result.failedRules[0].code).toBe('INVALID_FOOTNOTE');
    }
  });

  it('acepta únicamente una pareja completa alrededor de tabular', () => {
    const valid = String.raw`\documentclass{article}
\begin{document}
\begin{tabular}{lr}
Media & 14.2\footnotemark
\end{tabular}
\footnotetext{Promedio observado.}
\end{document}`;
    const incomplete = valid.replace(
      String.raw`\footnotetext{Promedio observado.}`,
      '',
    );

    expect(validateExercise(valid, footnotePairRule).valid).toBe(true);
    expect(validateExercise(incomplete, footnotePairRule).valid).toBe(false);
  });
});

describe('reglas de referencias internas', () => {
  it('valida etiquetas únicas, bien situadas y referencias resueltas', () => {
    const rules: ValidationRule[] = [
      {
        id: 'unique',
        type: 'REQUIRE_UNIQUE_LABELS',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Usa etiquetas únicas.',
      },
      {
        id: 'valid-labels',
        type: 'REQUIRE_VALID_LABELS',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Sitúa las etiquetas junto a objetos numerados.',
      },
      {
        id: 'resolved',
        type: 'REQUIRE_RESOLVED_REFERENCES',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Resuelve las referencias.',
      },
    ];
    const canonical = String.raw`\documentclass{article}
\begin{document}
\section{Método}\label{sec:metodo}
Véase la Sección \ref{sec:metodo}.
\end{document}`;
    const broken = canonical.replace(
      String.raw`\ref{sec:metodo}`,
      String.raw`\ref{sec:metodos}`,
    );

    expect(validateExercise(canonical, rules).valid).toBe(true);
    expect(validateExercise(broken, rules).valid).toBe(false);
  });

  it('valida el orden de hyperref y cleveref', () => {
    const rule: ValidationRule[] = [{
      id: 'package-order',
      type: 'REQUIRE_REFERENCE_PACKAGE_ORDER',
      required: true,
      scope: 'FULL_DOCUMENT',
      target: 'cleveref',
      feedback: 'Carga cleveref después de hyperref.',
    }];
    const canonical = String.raw`\documentclass{article}
\usepackage{hyperref}
\usepackage{cleveref}
\begin{document}Texto.\end{document}`;
    const broken = String.raw`\documentclass{article}
\usepackage{cleveref}
\usepackage{hyperref}
\begin{document}Texto.\end{document}`;

    expect(validateExercise(canonical, rule).valid).toBe(true);
    expect(validateExercise(broken, rule).valid).toBe(false);
  });

  it('cuenta reutilizaciones específicas de una referencia', () => {
    const rule: ValidationRule[] = [{
      id: 'reuse-count',
      type: 'REQUIRE_REFERENCE_COUNT',
      required: true,
      scope: 'BODY',
      target: 'nota:criterio',
      expected: 2,
      arguments: { command: 'textsuperscript' },
      feedback: 'Reutiliza dos veces la marca.',
    }];
    const canonical = String.raw`\documentclass{article}
\begin{document}
A\footnote{Criterio.\label{nota:criterio}},
B\textsuperscript{\ref{nota:criterio}} y
C\textsuperscript{\ref{nota:criterio}}.
\end{document}`;
    const incomplete = canonical.replace(
      String.raw`C\textsuperscript{\ref{nota:criterio}}`,
      'C',
    );

    expect(validateExercise(canonical, rule).valid).toBe(true);
    expect(validateExercise(incomplete, rule).valid).toBe(false);
  });
});

describe('optional rules', () => {
  const mixedRules: ValidationRule[] = [
    {
      id: 'req-mandatory',
      type: 'REQUIRE_COMMAND',
      required: true,
      scope: 'FULL_DOCUMENT',
      target: '\\documentclass',
      feedback: 'Falta documentclass.',
    },
    {
      id: 'req-optional',
      type: 'REQUIRE_COMMAND',
      required: false,
      scope: 'FULL_DOCUMENT',
      target: '\\usepackage',
      feedback: 'Podrías añadir un paquete.',
    },
  ];

  it('is valid when only optional rules fail', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const result = validateExercise(code, mixedRules);
    expect(result.valid).toBe(true);
    expect(result.failedRules).toHaveLength(1);
    expect(result.matchedRules).toHaveLength(1);
  });
});

describe('scope extraction', () => {
  const preambleRules: ValidationRule[] = [
    {
      id: 'pkg',
      type: 'REQUIRE_ARGUMENT',
      required: true,
      scope: 'PREAMBLE',
      target: '\\usepackage',
      expected: 'graphicx',
      feedback: 'Carga graphicx en el preámbulo.',
    },
  ];

  it('checks command only in PREAMBLE scope', () => {
    const code =
      '\\documentclass{article}\n\\usepackage{graphicx}\n\\begin{document}\n\\usepackage{fontenc}\n\\end{document}';
    const result = validateExercise(code, preambleRules);
    expect(result.valid).toBe(true);
  });

  it('rejects when argument is only present in BODY and rule targets PREAMBLE', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\n\\usepackage{graphicx}\n\\end{document}';
    const result = validateExercise(code, preambleRules);
    expect(result.valid).toBe(false);
  });
});

describe('edge cases', () => {
  it('handles empty string input', () => {
    const result = validateExercise('', MINIMAL_RULES);
    expect(result.valid).toBe(false);
    expect(result.failedRules.length).toBeGreaterThan(0);
  });

  it('handles empty rules array', () => {
    const result = validateExercise('\\documentclass{article}', []);
    expect(result.valid).toBe(true);
    expect(result.matchedRules).toHaveLength(0);
  });
});

describe('unsupported rules', () => {
  it('required unsupported rule makes valid false', () => {
    const rules: ValidationRule[] = [
      {
        id: 'unsupported-req',
        type: 'REQUIRE_MATH_STRUCTURE',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Esta estructura matemática no está implementada.',
      },
    ];
    const result = validateExercise('\\documentclass{article}', rules);
    expect(result.valid).toBe(false);
  });

  it('optional unsupported rule does not invalidate', () => {
    const rules: ValidationRule[] = [
      {
        id: 'unsupported-opt',
        type: 'REQUIRE_MATH_STRUCTURE',
        required: false,
        scope: 'FULL_DOCUMENT',
        feedback: 'Podrías usar una estructura matemática.',
      },
    ];
    const result = validateExercise('\\documentclass{article}', rules);
    expect(result.valid).toBe(true);
  });

  it('unsupported rule does not appear in matchedRules', () => {
    const rules: ValidationRule[] = [
      {
        id: 'unsupported-req',
        type: 'REQUIRE_MATH_STRUCTURE',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'No soportado.',
      },
    ];
    const result = validateExercise('\\documentclass{article}', rules);
    expect(result.matchedRules).not.toContain('unsupported-req');
  });

  it('unsupportedRules contains id, type, required, code and message', () => {
    const rules: ValidationRule[] = [
      {
        id: 'unsupported-math',
        type: 'REQUIRE_MATH_STRUCTURE',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Matemáticas no soportadas.',
      },
    ];
    const result = validateExercise('x', rules);
    expect(result.unsupportedRules).toHaveLength(1);
    const entry = result.unsupportedRules[0];
    expect(entry.id).toBe('unsupported-math');
    expect(entry.type).toBe('REQUIRE_MATH_STRUCTURE');
    expect(entry.required).toBe(true);
    expect(entry.code).toBe('UNSUPPORTED_RULE');
    expect(entry.message).toBe('Matemáticas no soportadas.');
  });

  it('REQUIRE_MATCHING_ARGUMENTS is unsupported', () => {
    const rules: ValidationRule[] = [
      {
        id: 'unsupported-match',
        type: 'REQUIRE_MATCHING_ARGUMENTS',
        required: true,
        scope: 'BODY',
        target: '\\label',
        feedback: 'Etiquetas no soportadas.',
      },
    ];
    const result = validateExercise('\\label{x}\\ref{x}', rules);
    expect(result.valid).toBe(false);
    expect(result.unsupportedRules).toHaveLength(1);
  });

  it('supported rules do not appear in unsupportedRules', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-cmd',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('\\documentclass{article}', rules);
    expect(result.unsupportedRules).toHaveLength(0);
  });
});

describe('exact command detection', () => {
  it('matches the exact command', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('\\documentclass{article}', rules);
    expect(result.valid).toBe(true);
  });

  it('rejects a command that has the target as prefix', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('\\mydocumentclass{article}', rules);
    expect(result.valid).toBe(false);
  });

  it('rejects a command that has the target as suffix', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('\\documentclasses{article}', rules);
    expect(result.valid).toBe(false);
  });

  it('does not count command inside a comment', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('% \\documentclass{article}', rules);
    expect(result.valid).toBe(false);
  });

  it('accepts command followed by spaces before argument', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('\\documentclass  {article}', rules);
    expect(result.valid).toBe(true);
  });

  it('accepts command with optional argument before mandatory', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const result = validateExercise('\\documentclass[12pt]{article}', rules);
    expect(result.valid).toBe(true);
  });

  it('matches \\begin{document} exactly', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-begin',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\begin{document}',
        feedback: 'Falta begin.',
      },
    ];
    const result = validateExercise('\\begin{document}', rules);
    expect(result.valid).toBe(true);
  });

  it('rejects \\begin{documentation as false positive', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-begin',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\begin{document}',
        feedback: 'Falta begin.',
      },
    ];
    const result = validateExercise('\\begin{documentation}', rules);
    expect(result.valid).toBe(false);
  });
});

describe('REQUIRE_PACKAGE', () => {
  const fontencRules: ValidationRule[] = [
    {
      id: 'req-fontenc',
      type: 'REQUIRE_PACKAGE',
      required: true,
      scope: 'PREAMBLE',
      target: 'fontenc',
      expected: 'T1',
      feedback: 'Falta \\usepackage[T1]{fontenc} en el preámbulo.',
    },
  ];

  it('passes when package with correct name and option exists in scope', () => {
    const code =
      '\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(true);
    expect(result.matchedRules).toContain('req-fontenc');
  });

  it('fails when package is missing entirely', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0].code).toBe('MISSING_COMMAND');
  });

  it('fails when package exists in body but not in preamble', () => {
    const code =
      '\\documentclass{article}\n\\begin{document}\n\\usepackage[T1]{fontenc}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(false);
  });

  it('fails when package has wrong name', () => {
    const code =
      '\\documentclass{article}\n\\usepackage[T1]{other}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0].code).toBe('MISSING_COMMAND');
  });

  it('fails when package has wrong option', () => {
    const code =
      '\\documentclass{article}\n\\usepackage[utf8]{fontenc}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0].code).toBe('WRONG_ARGUMENT');
  });

  it('fails when package has no option but option is required', () => {
    const code =
      '\\documentclass{article}\n\\usepackage{fontenc}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0].code).toBe('WRONG_ARGUMENT');
  });

  it('package without expected option requirement passes without checking option', () => {
    const rules: ValidationRule[] = [{
      id: 'req-any-fontenc',
      type: 'REQUIRE_PACKAGE',
      required: true,
      scope: 'PREAMBLE',
      target: 'fontenc',
      feedback: 'Falta fontenc.',
    }];
    const code =
      '\\documentclass{article}\n\\usepackage{fontenc}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, rules);
    expect(result.valid).toBe(true);
  });

  it('passes with multiple packages when target is present', () => {
    const code =
      '\\documentclass{article}\n\\usepackage[T1]{fontenc}\n\\usepackage[utf8]{inputenc}\n\\begin{document}\nTexto\n\\end{document}';
    const result = validateExercise(code, fontencRules);
    expect(result.valid).toBe(true);
  });
});

describe('bibliography validation rules', () => {
  const complete = String.raw`\documentclass{article}
\begin{document}
Texto \cite{torres-calculo,lopez-metodos}.
\begin{thebibliography}{99}
\bibitem{torres-calculo} Ana Torres. \emph{Introducción al cálculo}. Editorial Aula, 2025.
\bibitem{lopez-metodos} Luis López. Métodos numéricos. \emph{Revista Ejemplo}, 2(1), 10--20, 2024.
\end{thebibliography}
\end{document}`;

  it('validates thebibliography and an exact bibitem count', () => {
    const rules: ValidationRule[] = [
      {
        id: 'bibliography',
        type: 'REQUIRE_VALID_BIBLIOGRAPHY',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Corrige la bibliografía.',
      },
      {
        id: 'items',
        type: 'REQUIRE_BIBITEM_COUNT',
        required: true,
        scope: 'FULL_DOCUMENT',
        expected: 2,
        feedback: 'Se necesitan dos entradas.',
      },
    ];

    expect(validateExercise(complete, rules).valid).toBe(true);
    expect(validateExercise(complete.replace('\\bibitem{lopez-metodos}', ''), rules).valid)
      .toBe(false);
  });

  it('validates resolved simple and multiple citations', () => {
    const rules: ValidationRule[] = [
      {
        id: 'resolved',
        type: 'REQUIRE_RESOLVED_CITATIONS',
        required: true,
        scope: 'FULL_DOCUMENT',
        feedback: 'Resuelve las citas.',
      },
      {
        id: 'count',
        type: 'REQUIRE_CITATION_COUNT',
        required: true,
        scope: 'FULL_DOCUMENT',
        expected: 1,
        feedback: 'Usa una cita múltiple.',
      },
      {
        id: 'torres',
        type: 'REQUIRE_CITATION_COUNT',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: 'torres-calculo',
        expected: 1,
        feedback: 'Cita el libro una vez.',
      },
    ];

    expect(validateExercise(complete, rules).valid).toBe(true);
    expect(validateExercise(
      complete.replace('lopez-metodos}.', 'clave-inexistente}.'),
      rules,
    ).valid).toBe(false);
  });

  it('rejects duplicate keys and a bibliography after end document', () => {
    const rules: ValidationRule[] = [{
      id: 'bibliography',
      type: 'REQUIRE_VALID_BIBLIOGRAPHY',
      required: true,
      scope: 'FULL_DOCUMENT',
      feedback: 'Corrige la bibliografía.',
    }];
    const duplicate = complete.replace(
      '\\bibitem{lopez-metodos}',
      '\\bibitem{torres-calculo}',
    );
    const afterEnd = String.raw`\documentclass{article}
\begin{document}
Texto.
\end{document}
\begin{thebibliography}{9}
\bibitem{tarde} Fuente ficticia.
\end{thebibliography}`;

    expect(validateExercise(duplicate, rules).valid).toBe(false);
    expect(validateExercise(afterEnd, rules).valid).toBe(false);
  });
});

describe('Proyecto Final validation rules', () => {
  const validDocumentRule: ValidationRule[] = [{
    id: 'valid-document',
    type: 'REQUIRE_VALID_DOCUMENT',
    required: true,
    scope: 'FULL_DOCUMENT',
    feedback: 'Corrige el documento.',
  }];

  it('accepts a safe document and rejects missing structure, braces and environments', () => {
    const valid = String.raw`\documentclass{article}
\begin{document}
Texto.
\end{document}`;
    const invalid = [
      String.raw`\begin{document}Texto.\end{document}`,
      String.raw`\documentclass{article}\begin{document}\textbf{Texto\end{document}`,
      String.raw`\documentclass{article}\begin{document}\begin{itemize}\item Uno.\end{document}`,
    ];

    expect(validateExercise(valid, validDocumentRule).valid).toBe(true);
    for (const code of invalid) {
      expect(validateExercise(code, validDocumentRule).valid, code).toBe(false);
    }
  });

  it('rejects missing images, figures without resources and inconsistent table columns', () => {
    const invalid = [
      String.raw`\documentclass{article}
\usepackage{graphicx}
\begin{document}
\begin{figure}\caption{Sin recurso}\end{figure}
\end{document}`,
      String.raw`\documentclass{article}
\usepackage{graphicx}
\begin{document}
\includegraphics{imagenes/curso/seccion-11/no-existe.png}
\end{document}`,
      String.raw`\documentclass{article}
\begin{document}
\begin{tabular}{lc}A & B & C\end{tabular}
\end{document}`,
      String.raw`\documentclass{article}
\begin{document}
\caption{Fuera de un flotante}
\end{document}`,
    ];

    for (const code of invalid) {
      expect(validateExercise(code, validDocumentRule).valid, code).toBe(false);
    }
  });

  it('requires every selected package to be loaded and used', () => {
    const rules: ValidationRule[] = [{
      id: 'used-packages',
      type: 'REQUIRE_USED_PACKAGES',
      required: true,
      scope: 'FULL_DOCUMENT',
      feedback: 'Revisa los paquetes.',
    }];
    const used = String.raw`\documentclass{article}
\usepackage{booktabs}
\begin{document}
\begin{tabular}{lc}\toprule A & B \\ \bottomrule\end{tabular}
\end{document}`;
    const unused = used.replace(
      '\\usepackage{booktabs}',
      '\\usepackage{booktabs}\n\\usepackage{amsthm}',
    );

    expect(validateExercise(used, rules).valid).toBe(true);
    const result = validateExercise(unused, rules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0]).toMatchObject({
      code: 'UNUSED_PACKAGE',
      command: '\\usepackage{amsthm}',
    });
  });

  it('rejects a plausible shell while the accumulated project is incomplete', () => {
    const rules: ValidationRule[] = [{
      id: 'project',
      type: 'REQUIRE_PROJECT_REQUIREMENTS',
      required: true,
      scope: 'FULL_DOCUMENT',
      feedback: 'Completa el proyecto.',
    }];
    const incomplete = String.raw`\documentclass{article}
\usepackage[spanish]{babel}
\title{Informe}
\author{Estudiante}
\date{2026}
\begin{document}
\maketitle
\section{Introducción}
Texto.
\end{document}`;

    const result = validateExercise(incomplete, rules);
    expect(result.valid).toBe(false);
    expect(result.failedRules[0].code).toBe('INCOMPLETE_PROJECT');
  });

  it('requires real blank lines when an exercise asks for separate paragraphs', () => {
    const rules: ValidationRule[] = [{
      id: 'two-paragraphs',
      type: 'REQUIRE_PARAGRAPH_COUNT',
      required: true,
      scope: 'BODY',
      expected: 2,
      feedback: 'Separa el contenido en dos párrafos.',
    }];
    const wrap = (body: string) => String.raw`\documentclass{article}
\begin{document}
${body}
\end{document}`;

    expect(validateExercise(wrap('Primera. Segunda.'), rules).valid).toBe(false);
    expect(validateExercise(wrap('Primera.\nSegunda.'), rules).valid).toBe(false);
    expect(validateExercise(wrap('Primera.\n\nSegunda.'), rules).valid).toBe(true);
    expect(validateExercise(wrap('Primera.\n   \nSegunda.'), rules).valid).toBe(true);
  });

  it('distinguishes commands placed on separate ordered lines', () => {
    const rules: ValidationRule[] = [{
      id: 'different-lines',
      type: 'REQUIRE_DISTINCT_LINES',
      required: true,
      scope: 'BODY',
      arguments: ['\\section{Datos}', '\\subsection{Muestra}'],
      orderSensitive: true,
      feedback: 'Usa líneas distintas y conserva el orden.',
    }];
    const wrap = (body: string) => `\\documentclass{article}\n\\begin{document}\n${body}\n\\end{document}`;

    expect(validateExercise(wrap('\\section{Datos}\\subsection{Muestra}'), rules).valid).toBe(false);
    expect(validateExercise(wrap('\\subsection{Muestra}\n\\section{Datos}'), rules).valid).toBe(false);
    expect(validateExercise(wrap('\\section{Datos}\n\\subsection{Muestra}'), rules).valid).toBe(true);
  });

  it('requires the child environment to be structurally nested', () => {
    const rules: ValidationRule[] = [{
      id: 'nested-list',
      type: 'REQUIRE_NESTED_ENVIRONMENT',
      required: true,
      scope: 'BODY',
      arguments: { parent: 'itemize', child: 'enumerate' },
      feedback: 'Anida enumerate dentro de itemize.',
    }];
    const wrap = (body: string) => `\\documentclass{article}\n\\begin{document}\n${body}\n\\end{document}`;
    const adjacent = '\\begin{itemize}\\item A\\end{itemize}\n\\begin{enumerate}\\item B\\end{enumerate}';
    const nested = '\\begin{itemize}\\item A\\begin{enumerate}\\item B\\end{enumerate}\\end{itemize}';

    expect(validateExercise(wrap(adjacent), rules).valid).toBe(false);
    expect(validateExercise(wrap(nested), rules).valid).toBe(true);
  });
});

describe('immutability', () => {
  it('does not modify userCode', () => {
    const code = '  \\documentclass{article}\n\\begin{document}\nHola\n\\end{document}  ';
    const copy = String(code);
    validateExercise(code, MINIMAL_RULES);
    expect(code).toBe(copy);
  });

  it('does not modify rules array', () => {
    const rules: ValidationRule[] = [
      {
        id: 'req-dc',
        type: 'REQUIRE_COMMAND',
        required: true,
        scope: 'FULL_DOCUMENT',
        target: '\\documentclass',
        feedback: 'Falta documentclass.',
      },
    ];
    const copy = JSON.stringify(rules);
    validateExercise('\\documentclass{article}', rules);
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('req-dc');
    expect(JSON.stringify(rules)).toBe(copy);
  });

  it('is deterministic: same input produces same result', () => {
    const code = '\\documentclass{article}\n\\begin{document}\nHola\n\\end{document}';
    const a = validateExercise(code, MINIMAL_RULES);
    const b = validateExercise(code, MINIMAL_RULES);
    expect(a).toEqual(b);
    expect(Object.is(a, b)).toBe(false);
  });
});
