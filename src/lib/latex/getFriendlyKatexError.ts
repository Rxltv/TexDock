interface FriendlyError {
  friendly: string;
  technical: string;
}

const patterns: [RegExp, (match: RegExpMatchArray) => FriendlyError][] = [
  [
    /Expected\s['"](\\[^'"]*)['"]\s/g,
    (_m) => ({
      friendly: 'Hay un comando que KaTeX no reconoce. Revisa que el nombre esté bien escrito.',
      technical: 'Comando desconocido',
    }),
  ],
  [
    /Undefined control sequence:\s*(\\\S+)/,
    (m) => ({
      friendly: `El comando ${m[1]} no está definido en KaTeX. ¿Quizás escribiste mal el nombre?`,
      technical: `Comando indefinido: ${m[1]}`,
    }),
  ],
  [
    /Expected\s['"][}]['"]/,
    (_m) => ({
      friendly: 'Falta una llave de cierre "}". Revisa que todas las llaves estén balanceadas.',
      technical: 'Llave de cierre esperada',
    }),
  ],
  [
    /Expected\s['"][{]['"]/,
    (_m) => ({
      friendly: 'Falta una llave de apertura "{". Revisa que todas las llaves estén balanceadas.',
      technical: 'Llave de apertura esperada',
    }),
  ],
  [
    /begin\{(\w+)\}.*ended\sby\s\\end\{(\w+)\}/,
    (m) => ({
      friendly: `El entorno "${m[1]}" se cerró con \\end{${m[2]}}. Usa \\end{${m[1]}} en su lugar.`,
      technical: `\\begin{${m[1]}} cerrado con \\end{${m[2]}}`,
    }),
  ],
  [
    /Expected\sargument\sfor\s\\(\w+)/,
    (m) => ({
      friendly: `El comando \\${m[1]} necesita un argumento. Por ejemplo: \\${m[1]}{valor}.`,
      technical: `Argumento esperado para \\${m[1]}`,
    }),
  ],
  [
    /Environment\s(\w+)\snot\sdefined/,
    (m) => ({
      friendly: `El entorno "${m[1]}" no está definido. Revisa que el nombre esté bien escrito.`,
      technical: `Entorno indefinido: ${m[1]}`,
    }),
  ],
  [
    /mismatched\sbraces/,
    (_m) => ({
      friendly: 'Hay llaves desbalanceadas. Cada "{" debe tener su "}" correspondiente.',
      technical: 'Llaves desbalanceadas',
    }),
  ],
];

export function getFriendlyKatexError(raw: string): FriendlyError {
  for (const [regex, handler] of patterns) {
    const match = raw.match(regex);
    if (match) {
      return handler(match);
    }
  }
  return {
    friendly: 'La expresión tiene un error que KaTeX no puede procesar. Revisa la sintaxis.',
    technical: raw,
  };
}
