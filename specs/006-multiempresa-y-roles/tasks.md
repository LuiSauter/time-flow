# Tareas · 006 Multiempresa y roles

## Front
- [ ] Selector de empresa activa en la cabecera.
- [ ] Metas diarias distintas por empresa.
- [ ] Estado del cronómetro ligado a la empresa activa.
- [ ] Alta de empresa desde "Agregar".
- [ ] Aceptar invitación por enlace.
- [ ] Aviso al cambiar de empresa con jornada abierta.
- [ ] Panel de responsable: equipo y cumplimiento.
- [ ] Bandeja de aprobación de ajustes manuales.

## Backend
- [ ] Tablas `user`, `company`, `membership`, `work_session`, `break_session`, `invitation`.
- [ ] Índice único de jornada abierta por usuario y empresa.
- [ ] Middleware de validación de membresía y rol.
- [ ] Endpoints de crear empresa, invitar y cambiar rol.
- [ ] Endpoints de aprobación de ajustes.

## Pruebas
- [ ] Acceso cruzado entre empresas (debe fallar).
- [ ] Miembro intentando entrar al panel de responsable.
- [ ] Invitación caducada y reutilizada.
- [ ] Persona con jornadas simultáneas en dos empresas.
