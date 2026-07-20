# TexDock — Registro de progreso

## Sesión: 2026-07-20

| Campo                 | Valor                                        |
| :-------------------- | :------------------------------------------- |
| Fase actual           | Fase 0.1 — Primer render matemático          |
| Rama                  | `feature/phase-0-math-preview`               |
| Objetivo de sesión    | Crear el primer laboratorio matemático interactivo con React y KaTeX |
| Estado inicial        | Portada provisional, React y KaTeX instalados, Astro configurado |
| Stack actual          | Node.js 22+, Astro 7, React 19, KaTeX 0.18, HTML, CSS |

### Dependencias añadidas

- `react`, `react-dom` — biblioteca de interfaz de usuario
- `@astrojs/react` — integración de React con Astro
- `katex` — renderizador matemático
- `@types/react`, `@types/react-dom` — tipos TypeScript

### Archivos creados

- `src/lib/latex/getFriendlyKatexError.ts` — transformador de errores de KaTeX a mensajes pedagógicos
- `src/components/playground/MathPlayground.tsx` — componente React del laboratorio matemático
- `src/pages/laboratorio.astro` — página del laboratorio que carga la isla React

### Archivos modificados

- `src/pages/index.astro` — reemplazado aviso de "en preparación" por enlace a `/laboratorio`
- `TexDock_Progress_Log.md` — registro de esta sesión

### Funcionamiento implementado

- Textarea controlado por React con expresión inicial `\int_0^1 x^2\,dx = \frac{1}{3}`
- Renderizado automático con retardo de 300 ms al escribir
- Botón "Renderizar" para procesar inmediatamente
- Atajo Ctrl + Enter para renderizar inmediatamente
- Vista previa mediante `katex.render()` sobre elemento ref (sin `dangerouslySetInnerHTML`)
- Limpieza del contenido anterior antes de cada render
- Captura de errores con try/catch, sin romper el componente
- Mensajes de error pedagógicos (llaves, comandos, entornos, argumentos)
- Detalle técnico oculto en elemento `<details>`
- Región `aria-live="polite"` para anunciar cambios de estado
- Diseño responsive: dos columnas en escritorio, una columna en móvil
- Tema oscuro mantenido, tipografía monoespaciada en textarea
- Desplazamiento horizontal en vista previa cuando la fórmula es ancha
- Foco visible en todos los elementos interactivos
- Sin animaciones innecesarias, respeta `prefers-reduced-motion`

### Configuración de KaTeX

```ts
{
  displayMode: true,
  throwOnError: true,
  output: 'htmlAndMathml',
  trust: false,
  strict: 'warn',
}
```

### Comprobaciones

- [ ] `npm run build` completado sin errores
- [ ] `git status --short` verificado
- [ ] `git diff --stat` verificado
- [ ] `git diff --check` sin conflictos de Whitespace

### Limitaciones actuales

- No hay resaltado de sintaxis en el textarea
- No hay asistencia contextual (autocompletado, sugerencias)
- No hay ejercicios estructurados ni validación programática
- El tratamiento de errores cubre casos frecuentes pero no es un tutor completo
- No hay persistencia de la expresión entre sesiones
- No hay soporte para TikZ, PGFPlots ni generación de PDF

### Siguiente paso

Avanzar a la incorporación de ejercicios prácticos o mejora del tratamiento de errores según la planificación de fases.
