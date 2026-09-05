# Plan · 006 Multiempresa y roles

## Modelo de datos
```text
User ──< Membership >── Company
             │
             └──< WorkSession ──< BreakSession
```

| Tabla | Campos clave |
|---|---|
| `user` | id, google_id, email, nombre, avatar_url, creado_en |
| `company` | id, nombre, slug, zona_horaria, meta_horas_diarias, creado_en |
| `membership` | id, user_id, company_id, rol (miembro / responsable / admin) |
| `work_session` | id, user_id, company_id, inicio, fin, origen (automático / manual), nota |
| `break_session` | id, work_session_id, inicio, fin, motivo |
| `invitation` | id, company_id, email, rol, token, expira_en, aceptada_en |

Reglas de integridad:
- Índice único de jornada abierta por `user_id + company_id` cuando `fin IS NULL`.
- Los descansos siempre cuelgan de una jornada y quedan dentro de su rango.
- Horas activas del día = suma de jornadas − suma de descansos.

## Autorización
1. La sesión resuelve `user_id` y sus membresías.
2. Cada petición lleva `company_id`; se valida la membresía antes de tocar datos.
3. El rol decide el alcance: propio (miembro) o de toda la empresa (responsable / admin).

## Front
- La empresa activa vive en el shell y se propaga a todas las pantallas.
- El estado del cronómetro se guarda por empresa.
- El panel de responsable es una ruta nueva visible solo con rol suficiente.

## Riesgos
- Fuga entre empresas: cubrir con pruebas de autorización en cada endpoint.
- Cambio de empresa con jornada abierta en otra: mostrar aviso, no cerrarla en silencio.
