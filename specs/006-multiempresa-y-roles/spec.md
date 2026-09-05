# 006 · Multiempresa, membresías y roles

## Objetivo
Permitir que una persona pertenezca a varias empresas, alterne entre ellas y que cada empresa vea únicamente sus propios datos.

## Alcance
- Selector de empresa activa en la cabecera con las empresas de la persona.
- Acción "Agregar" para crear una empresa o aceptar una invitación.
- Meta de horas diarias y zona horaria por empresa.
- Roles: miembro, responsable y admin.
- Panel de responsable: equipo, cumplimiento y aprobación de ajustes manuales.

## Reglas
- Toda consulta filtra por la empresa activa (aislamiento multitenant).
- Los datos del cronómetro, historial, detalle y dashboard son por empresa.
- Un miembro solo ve sus propios registros; un responsable ve los de su empresa.
- Solo un admin puede invitar, cambiar roles o editar la meta diaria.
- Los ajustes manuales de un miembro requieren aprobación de un responsable.

## Criterios de aceptación
- [ ] Cambiar de empresa recarga métricas, historial y estado del cronómetro de esa empresa.
- [ ] Una petición con un id de empresa donde no hay membresía es rechazada.
- [ ] Un miembro no puede acceder al panel de responsable.
- [ ] Una invitación caducada no permite el acceso.
- [ ] La meta diaria de la empresa se refleja en el cumplimiento de todas las pantallas.

## Estado actual del prototipo
Selector con dos empresas de demostración y metas distintas; sin alta real, invitaciones ni roles.
