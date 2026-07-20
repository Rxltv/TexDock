# TexDock

Plataforma web educativa, minimalista, rápida y de código abierto para enseñar LaTeX mediante teoría breve, ejercicios prácticos y visualización inmediata.

## Misión

 Democratizar el aprendizaje de LaTeX eliminando la fricción técnica: el estudiante solo necesita un navegador para escribir, visualizar y practicar LaTeX desde el primer minuto.

## Estado actual

**Fase 0 — Base técnica y prototipo matemático** ✅ Cerrada

La Fase 0 validó el render matemático inmediato mediante KaTeX en una isla React dentro de Astro, estableciendo la fundación técnica del proyecto.

### Implementado en Fase 0

- Astro como meta-framework
- React como isla en la página del laboratorio
- KaTeX para renderizado matemático
- Render automático con debounce de 300 ms
- Render manual mediante botón y atajo Ctrl + Enter
- Manejo básico de errores con mensajes pedagógicos
- 7 ejemplos matemáticos seleccionables
- Panel informativo del preámbulo LaTeX
- Diseño responsive con tema oscuro
- CSS propio, sin frameworks externos
- 16 pruebas unitarias con Vitest
- Comprobación de tipos con `astro check` (0 errores, 0 advertencias)
- `npm run validate` ejecuta check + test + build
- Documentación para agentes de código (AGENTS.md)

### No implementado (próximas fases)

- CodeMirror o editor con resaltado de sintaxis
- Sistema de ejercicios estructurados y validación
- Progreso de aprendizaje
- Backend y base de datos
- Compilación LaTeX real (el laboratorio usa KaTeX)
- TikZ y PGFPlots
- Generación de PDF

## Requisitos

- Node.js >= 22.12.0
- npm

## Instalación

```sh
npm install
```

## Comandos disponibles

| Comando             | Acción                                      |
| :------------------ | :------------------------------------------ |
| `npm run dev`       | Inicia servidor local en `localhost:4321`   |
| `npm run build`     | Compila el sitio para producción en `dist/` |
| `npm run preview`   | Previsualiza la compilación local           |
| `npm run check`     | Comprobación de tipos con Astro             |
| `npm run test`      | Ejecuta pruebas unitarias                   |
| `npm run test:watch`| Ejecuta pruebas en modo watch               |
| `npm run validate`  | Comprobación completa (check + test + build)|
| `npm run astro ...` | CLI de Astro                                |
