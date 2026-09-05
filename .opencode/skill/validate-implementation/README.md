# validate-implementation

## Propósito

Verifica una implementación contra su spec en modo `task` o `full`. Es una
skill read-only y no modifica archivos.

## Uso

Se activa al solicitar una validación y requiere indicar el modo: `/validate-implementation task` para una tarea `T[n]`, o `/validate-implementation full` para la funcionalidad completa.

## Instalación global

```bash
mkdir -p ~/.config/opencode/skill
cp -R .opencode/skill/validate-implementation ~/.config/opencode/skill/
```

El comportamiento está definido exclusivamente en `SKILL.md`.
