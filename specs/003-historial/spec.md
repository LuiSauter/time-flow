# 003 · Historial de jornadas

## Objetivo
Consultar los días trabajados de un período con sus horas activas, descansos y cumplimiento, y saltar al detalle de cualquier día.

## Alcance
- Filtros: período (semana / mes / trimestre), solo días hábiles y empresa (todas o una).
- Tabla por día: fecha, día de la semana, horas activas, tiempo de descanso, cumplimiento y acciones.
- Fila de totales del período.
- Acción "Ver detalle" que abre el Detalle Diario del día.

## Reglas
- Cumplimiento = horas activas / meta diaria de la empresa del día.
- Los días sin registro no aparecen en la tabla.
- Con "solo días hábiles" activo se excluyen sábados y domingos, también de los totales.
- El filtro de empresa respeta el aislamiento multiempresa: solo empresas donde la persona es miembro.

## Criterios de aceptación
- [ ] Cambiar cualquier filtro actualiza tabla y totales de forma consistente.
- [ ] Los totales coinciden con la suma de las filas visibles.
- [ ] Un período sin datos muestra un estado vacío claro.
- [ ] En móvil la tabla se desplaza horizontalmente sin romper el layout.
- [ ] El cumplimiento se muestra en porcentaje redondeado y con color semántico.

## Estado actual del prototipo
Tabla y filtros funcionando sobre 30 días de datos de demostración.
