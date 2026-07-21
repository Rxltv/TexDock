export interface MathExample {
  id: string;
  label: string;
  description: string;
  latex: string;
}

export const mathExamples: MathExample[] = [
  {
    id: 'fraction',
    label: 'Fracción',
    description: 'Fracción simple con numerador y denominador',
    latex: '\\frac{a}{b}',
  },
  {
    id: 'limit',
    label: 'Límite',
    description: 'Límite de una función cuando la variable tiende a un valor',
    latex: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1',
  },
  {
    id: 'integral',
    label: 'Integral',
    description: 'Integral definida con límites de integración',
    latex: '\\int_0^1 x^2\\,dx = \\frac{1}{3}',
  },
  {
    id: 'summation',
    label: 'Sumatoria',
    description: 'Sumatoria con índice y fórmula cerrada',
    latex: '\\sum_{k=1}^{n} k = \\frac{n(n+1)}{2}',
  },
  {
    id: 'matrix',
    label: 'Matriz',
    description: 'Matriz 2×2 con entorno pmatrix',
    latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
  },
  {
    id: 'determinant',
    label: 'Determinante',
    description: 'Determinante de una matriz 2×2',
    latex: '\\det \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc',
  },
  {
    id: 'cases',
    label: 'Sistema con cases',
    description: 'Función definida a trozos con el entorno cases',
    latex: 'f(x) = \\begin{cases} x^2 & \\text{si } x \\geq 0 \\\\ 0 & \\text{si } x < 0 \\end{cases}',
  },
  {
    id: 'derivative',
    label: 'Derivada',
    description: 'Derivada de una función potencia',
    latex: '\\frac{d}{dx}(x^3)=3x^2',
  },
  {
    id: 'root',
    label: 'Raíz',
    description: 'Raíz cuadrada de una suma de cuadrados',
    latex: '\\sqrt{x^2+y^2}',
  },
  {
    id: 'vector',
    label: 'Vector',
    description: 'Vector con componentes',
    latex: '\\vec{v}=(v_1,v_2)',
  },
  {
    id: 'product',
    label: 'Producto',
    description: 'Productorio con índice y factorial',
    latex: '\\prod_{k=1}^{n} k=n!',
  },
];
