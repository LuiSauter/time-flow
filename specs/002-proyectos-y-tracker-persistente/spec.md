# Spec 002 — Proyectos y Tracker persistente

## Contexto y objetivo
TimeFlow debe sustituir los proyectos, registros y métricas de demostración por datos persistentes vinculados a la cuenta autenticada. Cada persona podrá crear proyectos, seleccionar uno para registrar su jornada en tiempo real, pausar, reanudar, finalizar y añadir trabajo manual, conservando un historial privado y auditable.

## Usuarios / actores
- Persona autenticada de TimeFlow.

## Historias de usuario
- H1: Como persona autenticada, quiero crear mi primer proyecto para comenzar a registrar trabajo.
- H2: Como persona usuaria, quiero alternar entre mis proyectos para registrar y consultar sus jornadas por separado.
- H3: Como persona usuaria, quiero controlar mi jornada en tiempo real para registrar trabajo y descansos con precisión.
- H4: Como persona usuaria, quiero añadir horas manualmente para incorporar trabajo no registrado en tiempo real.

## Requisitos funcionales
- RF-1: MIENTRAS una persona autenticada no tenga proyectos, EL SISTEMA mostrará un estado que solicitará crear el primer proyecto e impedirá iniciar el Tracker.
- RF-2: EL SISTEMA solicitará un nombre al crear un proyecto.
- RF-3: SI el nombre del proyecto está vacío o contiene únicamente espacios, ENTONCES EL SISTEMA no creará el proyecto e informará que el nombre es obligatorio.
- RF-4: CUANDO se cree correctamente un proyecto, EL SISTEMA lo asociará exclusivamente con la persona autenticada.
- RF-5: CUANDO se cree correctamente el primer proyecto, EL SISTEMA lo seleccionará como proyecto activo y mostrará el Tracker.
- RF-6: EL SISTEMA asignará una meta diaria inicial de 8 horas a cada proyecto creado.
- RF-7: EL SISTEMA determinará automáticamente la zona horaria inicial del proyecto a partir del dispositivo de la persona al crearlo.
- RF-8: CUANDO una persona seleccione un proyecto, EL SISTEMA mostrará únicamente sus jornadas, descansos, registros manuales y métricas.
- RF-9: SI una persona intenta consultar o modificar datos de un proyecto que no le pertenece, ENTONCES EL SISTEMA rechazará la operación sin revelar sus datos.
- RF-10: CUANDO una persona inicie trabajo sin una jornada activa en el proyecto seleccionado, EL SISTEMA abrirá una jornada y un bloque de trabajo con su marca de tiempo de inicio.
- RF-11: MIENTRAS exista un bloque de trabajo abierto en el proyecto seleccionado, EL SISTEMA mostrará el estado `TRABAJANDO`.
- RF-12: MIENTRAS exista un bloque de trabajo abierto, EL SISTEMA mostrará el tiempo activo acumulado del día en formato `HH:MM:SS` y lo actualizará al menos una vez por segundo.
- RF-13: CUANDO una persona inicie un descanso durante una jornada activa, EL SISTEMA cerrará el bloque de trabajo abierto y abrirá un descanso con su marca de tiempo de inicio.
- RF-14: MIENTRAS exista un descanso abierto en el proyecto seleccionado, EL SISTEMA mostrará el estado `EN DESCANSO`.
- RF-15: MIENTRAS exista un descanso abierto, EL SISTEMA mostrará su duración actualizada al menos una vez por segundo.
- RF-16: CUANDO una persona reanude el trabajo durante un descanso abierto, EL SISTEMA cerrará el descanso y abrirá un nuevo bloque de trabajo.
- RF-17: CUANDO una persona finalice la jornada desde trabajo o descanso, EL SISTEMA cerrará el segmento abierto y dejará el Tracker en estado `DETENIDO`.
- RF-18: MIENTRAS no exista una jornada activa en el proyecto seleccionado, EL SISTEMA mostrará el estado `DETENIDO` y la acción para comenzar a trabajar.
- RF-19: EL SISTEMA conservará en los registros el proyecto, origen del bloque (tiempo real o manual), tipo, etiqueta, inicio, fin y orden cronológico.
- RF-20: EL SISTEMA permitirá como máximo una jornada activa por persona y proyecto.
- RF-21: SI se intenta iniciar una jornada cuando ya existe una jornada activa para la misma persona y proyecto, ENTONCES EL SISTEMA no abrirá otra y mostrará el estado de la jornada existente.
- RF-22: CUANDO se cargue el Tracker o se recargue la página, EL SISTEMA recuperará la jornada activa y calculará las duraciones desde sus marcas de tiempo absolutas.
- RF-23: CUANDO la página vuelva a estar visible, EL SISTEMA recalculará el tiempo mostrado desde las marcas de tiempo absolutas.
- RF-24: EL SISTEMA calculará el tiempo activo como tiempo de trabajo menos tiempo de descansos.
- RF-25: CUANDO se muestre “Hoy · en curso”, EL SISTEMA mostrará el tiempo activo acumulado del día actual del proyecto seleccionado.
- RF-26: CUANDO se muestre “Descanso hoy”, EL SISTEMA mostrará el tiempo total de descansos del día actual del proyecto seleccionado.
- RF-27: CUANDO se muestre “Límite diario”, EL SISTEMA mostrará la meta de 8 horas del proyecto seleccionado, el tiempo activo del día y su avance proporcional.
- RF-28: CUANDO el filtro sea “Todos los días (L-D)”, EL SISTEMA calculará la tarjeta “Ayer” con el día calendario inmediatamente anterior.
- RF-29: CUANDO el filtro sea “Días hábiles (L-V)”, EL SISTEMA calculará la tarjeta “Ayer” con el día hábil inmediatamente anterior.
- RF-30: CUANDO el tiempo activo del día mostrado en la tarjeta “Ayer” alcance o supere la meta diaria, EL SISTEMA indicará que se cumplió la meta.
- RF-31: CUANDO existan segmentos en el día actual, EL SISTEMA mostrará la lista cronológica con rango horario, tipo, etiqueta y duración de cada segmento.
- RF-32: MIENTRAS un segmento permanezca abierto, EL SISTEMA lo identificará como “En curso” y mostrará su duración actualizada.
- RF-33: CUANDO una persona envíe un registro manual con fecha, inicio y fin válidos, EL SISTEMA creará un bloque de trabajo manual para el proyecto seleccionado.
- RF-34: SI falta la fecha, la hora de inicio o la hora de fin en un registro manual, ENTONCES EL SISTEMA no registrará el bloque e informará los campos obligatorios.
- RF-35: SI el fin de un registro manual no es posterior a su inicio, ENTONCES EL SISTEMA no registrará el bloque e informará el rango inválido.
- RF-36: SI un registro manual se solapa total o parcialmente con una jornada existente del mismo proyecto, ENTONCES EL SISTEMA no registrará el bloque e informará del conflicto.
- RF-37: SI la fecha u hora final de un registro manual es posterior al momento actual en la zona horaria del proyecto, ENTONCES EL SISTEMA no registrará el bloque e informará que no se permiten registros futuros.
- RF-38: SI una operación de creación, transición de jornada o registro manual no puede persistirse, ENTONCES EL SISTEMA informará del error y no mostrará la operación como completada.

## Requisitos no funcionales
- RNF-1: EL SISTEMA mostrará la interfaz, mensajes de validación y errores en español.
- RNF-2: EL SISTEMA conservará el diseño responsive y los controles accesibles por teclado.
- RNF-3: EL SISTEMA obtendrá los datos persistentes del proyecto seleccionado; no utilizará datos de demostración ni registros locales como fuente de verdad.
- RNF-4: EL SISTEMA mostrará fecha, horas y agrupaciones diarias según la zona horaria del proyecto.

## Casos límite
- Una persona con dos proyectos puede tener una jornada activa independiente en cada uno.
- Cambiar de proyecto no cierra ni combina la jornada activa del proyecto anterior.
- Dos intentos simultáneos de iniciar una jornada en el mismo proyecto conservan una única jornada activa.
- Finalizar desde un descanso cierra primero el descanso.
- Un registro manual puede añadirse durante una jornada activa si no se solapa con ella.
- Un día sin datos muestra cero en sus métricas y una lista de sesiones vacía.
- Si hoy es lunes y se seleccionan días hábiles, “Ayer” corresponde al viernes anterior.
- Si hoy es lunes y se seleccionan todos los días, “Ayer” corresponde al domingo anterior.
- Un registro manual cuya fecha u hora final sea futura se rechaza.

## Fuera de alcance
- Editar o eliminar proyectos.
- Configurar la meta diaria o zona horaria después de crear el proyecto.
- Editar o eliminar jornadas, descansos o registros manuales existentes.
- Historial, detalle diario, dashboard, insights de IA, exportaciones, notificaciones, aprobaciones y colaboración entre personas.
- Recuperación de datos locales de demostración anteriores.

## Criterios de finalización
- [ ] Una persona sin proyectos debe crear uno antes de usar el Tracker.
- [ ] Un proyecto creado persiste, aparece al volver a iniciar sesión y queda aislado de otras cuentas.
- [ ] Las métricas, segmentos y estados del Tracker proceden de datos persistentes del proyecto seleccionado.
- [ ] Se verifican las transiciones `IDLE -> WORKING -> PAUSED -> WORKING -> IDLE` y la finalización desde trabajo y descanso.
- [ ] Se verifica la recuperación de una jornada abierta tras recargar, volver a la pestaña y cambiar de proyecto.
- [ ] Se verifican las restricciones de una jornada activa por proyecto y de aislamiento entre personas.
- [ ] Se verifican la validación de registros manuales, el rechazo de solapamientos y el rechazo de fechas u horas finales futuras.
- [ ] Se verifica la lógica de “Ayer” para ambos filtros, incluido el lunes.
- [ ] Se verifican estados de carga, vacío y error en escritorio y móvil.

## Dudas abiertas
- No quedan dudas funcionales dentro del alcance acordado.
