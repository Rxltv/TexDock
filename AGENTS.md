# Instrucciones para agentes de código

Este documento define las reglas que debe seguir cualquier agente de código que trabaje en TexDock.

## Respetar la fase actual

- Trabajar exclusivamente dentro del alcance definido para la fase activa.
- No anticipar funcionalidades de fases futuras.
- Cada fase tiene un objetivo concreto; cualquier cambio debe alinearse con ese objetivo.

## No ampliar el alcance

- No añadir funcionalidades no solicitadas.
- No instalar dependencias sin autorización explícita.
- No crear componentes, páginas o archivos fuera de lo requerido.

## Prioridades técnicas

1. **Rendimiento** — tiempo de carga, tamaño de bundle, eficiencia en renderizado.
2. **Accesibilidad** — HTML semántico, ARIA cuando corresponda, navegación por teclado, contraste suficiente.
3. **Mantenibilidad** — código simple, sin abstracciones prematuras, CSS propio y minimalista.

## Control de versiones

- No hacer `commit` ni `push` de cambios.
- No modificar la rama `main` directamente.
- Trabajar siempre en la rama feature correspondiente a la fase activa.

## Transparencia

- Informar todos los archivos creados o modificados durante la sesión.
- Documentar decisiones técnicas relevantes.

## Comprobaciones al terminar

- Ejecutar `npm run build` y verificar que compile sin errores.
- Ejecutar `git status --short` para mostrar cambios.
- Ejecutar `git diff --stat` para ver el tamaño de los cambios.
- Ejecutar `git diff --check` para detectar conflictos de Whitespace.
