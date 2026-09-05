---
name: validate-implementation
description: Usa esta skill cuando el usuario pida validar una implementación contra una spec. Requiere indicar modo task para una T[n] concreta o full para la funcionalidad completa. Es read-only y no modifica archivos ni invoca otras skills.
---

# Validador de implementación

Comprueba si una implementación satisface la spec, sus RF y los criterios de
finalización. Es read-only: solo inspecciona, ejecuta verificaciones y emite un
veredicto. No corrige código, tests, specs, planes ni tareas.

## Modos

- **`task`**: valida exclusivamente una tarea `T[n]`, sus RF, sus dependencias
  relevantes, el código afectado, los tests relacionados y su `Hecho cuando:`.
- **`full`**: valida la funcionalidad completa RF por RF, su plan, sus tareas,
  implementación, verificaciones y criterios de finalización.

Si el usuario no indica el modo o la funcionalidad objetivo, pide esa
información antes de leer o ejecutar verificaciones.

## Contexto común

1. Resuelve las rutas a la spec, plan y tasks usando la información del usuario
   o la convención existente del repositorio. No presupongas una ubicación.
2. Consulta `AGENTS.md` y `docs/constitution.md` únicamente si existen y solo
   para obtener reglas aplicables.
3. Usa el plan como índice de superficies y verificaciones. No inventes stack,
   arquitectura, comandos ni criterios.
4. Distingue evidencia automatizada, evidencia manual, estado de tareas y
   observaciones de código.

## Modo `task`

1. Lee la entrada de T[n], los RF que declara cubrir, sus dependencias directas,
   las decisiones relevantes del plan y su `Hecho cuando:`.
2. Inspecciona solo el código, configuración y tests relacionados con T[n]. No
   audites RF, archivos o tareas que no estén relacionados.
3. Comprueba el estado de T[n] y de sus dependencias. Informa si la tarea no
   está marcada como completada, sin convertir el checkbox por sí solo en
   evidencia de comportamiento.
4. Ejecuta los tests específicos y del módulo, paquete o superficie afectada.
   Reutiliza evidencia reciente del implementador si no hubo cambios después;
   si no existe evidencia suficiente, ejecuta la verificación necesaria.
5. Ejecuta la suite completa únicamente si una regla del proyecto la exige o
   si el alcance de T[n] implica un riesgo claro de regresión transversal.
6. Recorre cada RF de T[n]. Para cada uno indica la evidencia, su resultado y
   uno de estos estados: cubierto y verde, cubierto y rojo, sin evidencia o
   verificado manualmente.
7. Comprueba `Hecho cuando:` y emite un veredicto de T[n]: `cumplida`, `no
   cumplida` o `parcial`, con los bloqueos exactos.

## Modo `full`

1. Lee la spec completa, el plan y tasks. Usa la trazabilidad del plan para
   localizar la implementación y las verificaciones de cada RF.
2. Inspecciona todas las superficies afectadas por la funcionalidad, sin
   extender la auditoría a trabajo no incluido en la spec.
3. Ejecuta los comandos de verificación definidos por el proyecto para la
   funcionalidad completa. Incluye la suite completa cuando corresponda y
   registra cada comando y resultado.
4. Recorre la spec RF por RF. Para cada RF indica la superficie de
   implementación, la evidencia y si está verde, rojo, sin evidencia o solo
   verificado manualmente.
5. Comprueba los criterios de finalización, el estado de las tareas, las
   verificaciones manuales y cualquier condición de compatibilidad, seguridad,
   rendimiento o despliegue que la spec haya declarado.
6. Emite un veredicto global: `cumplida`, `no cumplida` o `parcial`, seguido de
   la lista exacta de requisitos, evidencias o criterios pendientes.

## Reglas

- Solo verifica. No modifiques ningún archivo ni propongas aplicar cambios.
- En modo `task`, no vuelvas a auditar la funcionalidad completa.
- En modo `full`, no omitas RF por el hecho de que una tarea esté marcada como
  completada.
- Cada evidencia debe mapearse a un RF o a un criterio de finalización. Un test
  sin relación explícita no demuestra cobertura.
- No inventes comandos: usa los definidos por el proyecto o reporta que no hay
  una verificación automatizada disponible.
- Si falta contexto necesario, reporta el bloqueo en vez de asumir una regla.
- Usa el idioma de la documentación del proyecto; si no existe una
  convención, usa el idioma del usuario.
- No invoques `task-implementer` ni ninguna otra skill.
