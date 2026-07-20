# TexDock — Cierre de la Fase 0

## 1. Objetivo de la Fase 0

Establecer la base técnica y un prototipo matemático mínimo que valide el concepto de TexDock: una plataforma web educativa para aprender LaTeX mediante escritura y visualización inmediata, sin depender de un servidor ni de un compilador LaTeX tradicional.

## 2. Alcance implementado

- Configuración inicial del proyecto con Astro 7.
- Portada provisional con identidad visual mínima (tema oscuro, responsive, accesible).
- Layout base reutilizable con HTML semántico.
- Documentación para agentes de código (AGENTS.md).
- Laboratorio matemático interactivo con React 19 y KaTeX 0.18.
- Render automático (debounce 300 ms), manual (botón) y por atajo (Ctrl + Enter).
- Manejo básico de errores de KaTeX con mensajes pedagógicos.
- 7 ejemplos matemáticos seleccionables.
- Panel informativo del preámbulo LaTeX.
- 16 pruebas unitarias con Vitest.
- Scripts de validación (`test`, `check`, `validate`).

## 3. Stack utilizado

| Capa         | Tecnología                     |
| :----------- | :----------------------------- |
| Framework    | Astro 7.1.2                    |
| UI           | React 19.2.7 (isla)            |
| Matemáticas  | KaTeX 0.18.1                   |
| Estilos      | CSS propio (tema oscuro)       |
| Pruebas      | Vitest 4.1.10                  |
| Lenguaje     | TypeScript (strict)            |
| Entorno      | Node.js >= 22.12.0             |

## 4. Arquitectura actual

```
src/
├── components/
│   └── playground/
│       ├── MathPlayground.tsx     # Isla React (laboratorio)
│       └── PreamblePanel.astro    # Panel informativo del preámbulo
├── layouts/
│   └── BaseLayout.astro           # Layout base con tema oscuro
├── lib/
│   └── latex/
│       ├── getFriendlyKatexError.ts      # Errores pedagógicos
│       ├── getFriendlyKatexError.test.ts
│       ├── mathExamples.ts               # Ejemplos matemáticos
│       └── mathExamples.test.ts
├── pages/
│   ├── index.astro                # Portada
│   └── laboratorio.astro          # Página del laboratorio
└── styles/
    └── global.css                 # Estilos base y variables
```

## 5. Archivos principales

| Archivo                          | Propósito                                  |
| :------------------------------- | :----------------------------------------- |
| `package.json`                   | Dependencias y scripts                     |
| `astro.config.mjs`               | Configuración de Astro + integración React |
| `tsconfig.json`                  | TypeScript strict + jsx react-jsx          |
| `AGENTS.md`                      | Instrucciones para agentes de código       |
| `README.md`                      | Documentación del proyecto                 |
| `TexDock_Progress_Log.md`        | Registro de progreso por sesión            |

## 6. Funciones terminadas

- Renderizado de expresiones LaTeX con KaTeX en el navegador.
- Entrada de texto con actualización en tiempo real (debounce).
- Botón "Renderizar" y atajo Ctrl + Enter.
- Selección de 7 ejemplos matemáticos predefinidos.
- Mensajes de error pedagógicos para errores frecuentes de KaTeX.
- Panel informativo sobre el preámbulo utilizado.
- Diseño responsive (dos columnas en escritorio, una en móvil).
- Tema oscuro con contraste suficiente y foco visible.
- Región `aria-live` para anunciar cambios de estado.

## 7. Pruebas existentes

| Archivo                          | Casos |
| :------------------------------- | ----: |
| `getFriendlyKatexError.test.ts`  | 11    |
| `mathExamples.test.ts`           | 5     |
| **Total**                        | **16** |

Todos los tests pasan actualmente.

## 8. Comandos de comprobación

```sh
npm run test       # 16 pruebas unitarias
npm run build      # Compilación de producción (2 páginas)
npm run check      # Comprobación de tipos (0 errores, 0 advertencias)
npm run validate   # check + test + build
```

## 9. Limitaciones conocidas

- No hay resaltado de sintaxis en el textarea.
- No hay autocompletado ni sugerencias contextuales.
- No hay ejercicios estructurados ni validación programática.
- No hay persistencia de la expresión entre sesiones.
- El panel de preámbulo es informativo y no editable.
- El tratamiento de errores cubre casos frecuentes pero no es un tutor completo.
- No hay soporte para TikZ, PGFPlots ni generación de PDF.
- `npm run validate` ejecuta check (0 errores), test (16/16) y build (2 páginas).

## 10. Funciones excluidas deliberadamente

- Editor de documentos completos (Overleaf).
- Colaboración en tiempo real.
- Backend, base de datos o cuentas de usuario.
- Compilación LaTeX real (el laboratorio usa KaTeX en el navegador).
- CodeMirror o editores avanzados.
- Tailwind, Bootstrap u otros frameworks CSS.
- Testing Library o Playwright.
- AST parser o validación semántica de LaTeX.

## 11. Criterios de cierre

- [x] Proyecto Astro configurado y funcional.
- [x] Isla React integrada y cargada correctamente.
- [x] KaTeX renderiza expresiones sin errores.
- [x] Entrada, botón y atajo funcionan.
- [x] Los errores de KaTeX se muestran como mensajes pedagógicos.
- [x] 7 ejemplos matemáticos seleccionables.
- [x] Panel informativo del preámbulo presente.
- [x] Diseño responsive y tema oscuro.
- [x] 16 pruebas unitarias pasan.
- [x] `npm run build` produce 2 páginas sin errores.
- [x] `npm run check` reporta 0 errores y 0 advertencias.
- [x] `npm run validate` completa sin errores (check + test + build).
- [x] Árbol git limpio al cierre.

## 12. Estado final

La Fase 0 ha validado el concepto de render matemático inmediato mediante KaTeX en una arquitectura Astro + React. El prototipo es funcional, navegable y comprobable, pero todavía no constituye el sistema educativo completo previsto para TexDock.

## 13. Próxima fase recomendada

**Fase 1 — Sistema de ejercicios y experiencia educativa.**

Incorporar ejercicios prácticos estructurados con validación automática, permitiendo al estudiante practicar LaTeX con retroalimentación inmediata más allá de la sintaxis básica.
