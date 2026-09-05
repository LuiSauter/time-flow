# 002 · Tracker de jornada en tiempo real

## Objetivo
Registrar la jornada con precisión mediante un cronómetro con tres estados y descansos explícitos, para que las horas activas sean reales y auditables.

## Alcance
- Fecha larga en español del día en curso.
- Filtro de alcance: días hábiles (L-V) o semana completa (L-D).
- Cuatro métricas del día: horas activas, tiempo en descanso, bloques registrados y cumplimiento de la meta.
- Cronómetro central `HH:MM:SS` con tiempo del segmento en curso y acumulado del día.
- Estados: DETENIDO · TRABAJANDO · EN DESCANSO, con color semántico propio.
- Botones dinámicos: Iniciar jornada / Tomar descanso / Reanudar / Finalizar jornada.
- Lista cronológica de segmentos del día con inicio, fin y duración.
- Registro manual de un bloque de trabajo (inicio y fin).

## Máquina de estados
```text
IDLE ──iniciar jornada──> WORKING ──tomar descanso──> PAUSED
                            ▲                            │
                            └────────reanudar────────────┘
WORKING / PAUSED ──finalizar jornada──> IDLE
```

## Reglas
- Cada segmento guarda marcas absolutas (`start`, `end`); la duración se deriva, nunca se incrementa un contador.
- Horas activas = suma de bloques de trabajo; el descanso no suma.
- Solo puede existir un segmento abierto a la vez.
- Una jornada activa por usuario y empresa.
- El estado está ligado a la empresa activa; al cambiar de empresa se carga su propio estado.

## Criterios de aceptación
- [ ] Tras recargar la página el cronómetro continúa exacto.
- [ ] Con la pestaña en segundo plano o el equipo suspendido, al volver el tiempo es correcto.
- [ ] Iniciar descanso cierra el bloque de trabajo en el mismo instante (sin huecos ni solapes).
- [ ] Finalizar jornada cierra cualquier segmento abierto y vuelve a DETENIDO.
- [ ] Un bloque manual con fin anterior al inicio es rechazado.
- [ ] Un bloque manual que solapa otro existente es rechazado.
- [ ] Las cifras usan numerales tabulares y no "saltan" al cambiar de dígito.
