# Specs · TimeFlow

Desarrollo guiado por especificación. Cada funcionalidad vive en `specs/[NNN-nombre]/` con tres documentos:

- `spec.md` — qué se construye, reglas y criterios de aceptación.
- `plan.md` — cómo se construye: enfoque, piezas, modelo y riesgos.
- `tasks.md` — trabajo concreto, marcado como hecho o pendiente.

## Índice

| Spec | Funcionalidad | Estado |
|---|---|---|
| [001](./001-autenticacion-email-password/spec.md) | Autenticación con email y contraseña | Maquetado, sin backend |
| [002](./002-tracker-jornada/spec.md) | Tracker de jornada en tiempo real | Funcional en el navegador |
| [003](./003-historial/spec.md) | Historial, filtros y tarifas por proyecto | Tareas definidas |
| [004](./004-detalle-diario/spec.md) | Detalle diario | Funcional con datos demo |
| [005](./005-dashboard-ia/spec.md) | Dashboard e insights de IA | Gráficos demo, insights de ejemplo |
| [006](./006-multiproyecto-personal/spec.md) | Multiproyecto personal | Selector demo, sin persistencia |

## Convenciones

- Numeración de tres dígitos, correlativa y sin reutilizar.
- Nombres de carpeta en minúsculas y con guiones.
- Los criterios de aceptación se escriben como casillas verificables.
- El contexto general del producto está en [`BRIEF.md`](../BRIEF.md).
