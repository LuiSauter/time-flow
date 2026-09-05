# 005 · Dashboard de productividad e insights de IA

## Objetivo
Dar visibilidad del ritmo real de trabajo del período y traducirlo a observaciones accionables sobre horas muertas y constancia.

## Alcance
- KPIs del período: eficiencia, horas acumuladas, promedio diario y descansos.
- Gráfico de barras de horas por día.
- Gráfico de torta con la distribución de horas por empresa.
- Insights de IA: observaciones en lenguaje natural sobre ritmo, constancia y horas muertas detectadas.

## Reglas
- Eficiencia = horas activas / horas objetivo del período.
- El promedio diario solo considera días con registro.
- La distribución por empresa solo incluye empresas donde la persona es miembro.
- Los insights se generan sobre datos agregados, nunca sobre datos de otros usuarios.

## Criterios de aceptación
- [ ] Los KPIs coinciden con los totales del Historial para el mismo período.
- [ ] Los gráficos se apilan correctamente en tablet y móvil.
- [ ] Un período sin datos muestra estado vacío en KPIs, gráficos e insights.
- [ ] Cada insight cita el dato que lo sustenta (día, cifra o tendencia).
- [ ] Los insights se recalculan al cambiar de período o de empresa.

## Estado actual del prototipo
KPIs y gráficos con datos de demostración; los insights son textos de ejemplo.
