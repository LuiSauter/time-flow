# task-implementer

## Propósito

Implementa una única tarea `T[n]` de un `tasks.md`, con TDD cuando el cambio
sea testeable y con la verificación de `Hecho cuando:` en los demás casos.

## Uso

Se activa al solicitar la implementación de una tarea concreta o manualmente
con `/task-implementer`. Se detiene al cerrar esa tarea y no invoca el
validador automáticamente.

## Instalación global

```bash
mkdir -p ~/.config/opencode/skill
cp -R .opencode/skill/task-implementer ~/.config/opencode/skill/
```

El comportamiento está definido exclusivamente en `SKILL.md`.
