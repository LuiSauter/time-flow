# 004 · Detalle diario

## Objetivo
Ver cómo se compuso un día concreto: qué tramos fueron trabajo, cuáles descanso y dónde quedaron las horas muertas.

## Alcance
- Resumen del día: total activo, total en descanso y cumplimiento.
- Timeline de 24 horas que dibuja proporcionalmente trabajo, descanso e inactividad.
- Desglose cronológico de cada bloque con etiqueta, rango horario y duración.
- Acción de ajuste manual del registro.

## Reglas
- El timeline cubre siempre de 00:00 a 24:00, aunque la jornada ocupe pocas horas.
- Cada tramo usa el color semántico de su tipo; la inactividad es neutra.
- Un bloque que cruza la medianoche se corta y se atribuye al día que corresponde.
- El ajuste manual crea una corrección auditada, no reescribe el registro original.

## Criterios de aceptación
- [ ] La suma de los tramos del timeline equivale a 24 horas.
- [ ] Los totales del resumen coinciden con la suma del desglose.
- [ ] Un día sin registro muestra timeline vacío y un mensaje.
- [ ] En móvil el timeline se lee en vertical sin perder proporción.
- [ ] Un ajuste manual queda visiblemente marcado como tal.

## Estado actual del prototipo
Timeline y desglose funcionando con datos de demostración; el ajuste manual aún no persiste.
