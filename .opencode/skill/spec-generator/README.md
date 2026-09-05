# spec-generator

## Propósito

Crea una spec nueva a partir de una idea o unos requisitos iniciales.

## Uso

Se activa al solicitar una especificación nueva o manualmente con
`/spec-generator`. La skill usa `spec-template.md` y escribe el artefacto en la
ubicación definida por el proyecto o por el usuario.

## Instalación global

```bash
mkdir -p ~/.config/opencode/skill
cp -R .opencode/skill/spec-generator ~/.config/opencode/skill/
```

El comportamiento está definido exclusivamente en `SKILL.md`.
