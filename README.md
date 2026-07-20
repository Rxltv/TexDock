# TexDock

Plataforma web educativa, minimalista, rápida y de código abierto para enseñar LaTeX mediante teoría breve, ejercicios prácticos y visualización inmediata.

## Misión

 Democratizar el aprendizaje de LaTeX eliminando la fricción técnica: el estudiante solo necesita un navegador para escribir, visualizar y practicar LaTeX desde el primer minuto.

## Estado actual

**Fase 0 — Base técnica y prototipo matemático**

La fase actual sienta la fundación del proyecto: configuraciones iniciales, portada provisional, documentación para agentes de código y un prototipo temprano del laboratorio matemático.

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
| `npm run astro ...` | CLI de Astro                                |

## Alcance actual

- Portada provisional informativa
- Layout base con tema oscuro
- CSS propio, sin frameworks externos
- Documentación de arquitectura para agentes de código
- Sin backend, sin base de datos, sin cuentas de usuario

## Funciones no implementadas (próximas fases)

- Laboratorio matemático interactivo
- Editor de código LaTeX
- Vista previa en tiempo real
- Sistema de ejercicios y validación
- Biblioteca de ejemplos
- Panel de teoría
- Perfiles de usuario
- Despliegue en producción
