# Spec 003 — Historial, filtros y tarifas por proyecto

## Contexto y objetivo
El historial actual muestra datos de demostración y no permite consultar con precisión un período, un proyecto o el importe asociado al trabajo realizado. Esta funcionalidad permitirá revisar las horas activas y los descansos por día, aplicar los filtros acordados y calcular importes en USD usando la tarifa horaria vigente de cada proyecto, sin mostrar importes cuando el proyecto no tenga una tarifa configurada.

## Usuarios / actores
- Persona autenticada propietaria de uno o más proyectos.

## Historias de usuario
- H1: Como persona usuaria, quiero consultar mi historial por período, días de la semana y proyecto para revisar mi trabajo registrado.
- H2: Como persona usuaria, quiero definir una tarifa por hora para cada proyecto para conocer el importe acumulado de mis horas.
- H3: Como persona usuaria, quiero conservar las tarifas anteriores cuando cambie la tarifa de un proyecto para que los importes históricos no se recalculen incorrectamente.
- H4: Como persona usuaria, quiero corregir la tarifa aplicada a un día concreto para reflejar excepciones sin modificar el resto del historial.

## Requisitos funcionales
- RF-1: CUANDO una persona autenticada abra el historial, EL SISTEMA mostrará sus registros diarios agrupados por fecha y proyecto dentro del período seleccionado.
- RF-2: CUANDO se seleccione el período «Semana», EL SISTEMA incluirá para cada proyecto los registros comprendidos entre el lunes y el domingo de la semana calendario actual de su zona horaria, ambos inclusive.
- RF-3: CUANDO se seleccione el período «Mes», EL SISTEMA incluirá para cada proyecto los registros comprendidos entre el primer y el último día del mes calendario actual de su zona horaria, ambos inclusive.
- RF-4: CUANDO se seleccione «Fecha personalizada» con una fecha de inicio y una fecha de fin válidas, EL SISTEMA incluirá ambos días y todos los registros comprendidos entre ellos.
- RF-5: SI el rango personalizado no tiene ambas fechas, contiene una fecha inválida o la fecha de inicio es posterior a la fecha de fin, ENTONCES EL SISTEMA no aplicará el rango e informará cómo corregirlo.
- RF-6: MIENTRAS esté activo el filtro «Solo días hábiles», EL SISTEMA excluirá del resultado los sábados y domingos.
- RF-7: CUANDO se desactive el filtro «Solo días hábiles», EL SISTEMA incluirá los registros de lunes a domingo que pertenezcan al período seleccionado.
- RF-8: CUANDO se seleccione «Todos» en el filtro de proyecto, EL SISTEMA mostrará los registros de todos los proyectos pertenecientes a la persona autenticada.
- RF-9: CUANDO se seleccione un proyecto concreto, EL SISTEMA mostrará únicamente los registros de ese proyecto.
- RF-10: EL SISTEMA mostrará para cada día la fecha, el día de la semana, el proyecto, el tiempo activo, el tiempo de descansos, el cumplimiento respecto de la meta y las acciones disponibles.
- RF-11: CUANDO cambien los filtros de período, días hábiles o proyecto, EL SISTEMA recalculará las filas y los totales del período usando únicamente los registros visibles.
- RF-12: CUANDO una persona consulte el detalle de un día desde el historial, EL SISTEMA abrirá el detalle correspondiente a la fecha y proyecto seleccionados.
- RF-13: CUANDO una persona configure una tarifa horaria válida en un proyecto, EL SISTEMA guardará la tarifa en USD asociada a ese proyecto y la usará para los nuevos cálculos que correspondan.
- RF-14: SI una persona intenta guardar una tarifa no numérica o negativa, ENTONCES EL SISTEMA no la guardará e informará que la tarifa debe ser un importe válido no negativo.
- RF-15: CUANDO se modifique la tarifa base de un proyecto, EL SISTEMA aplicará la nueva tarifa desde la fecha en que se guarde la modificación y conservará la tarifa anterior para las fechas previas.
- RF-16: CUANDO un registro diario pertenezca a un proyecto con una tarifa aplicable, EL SISTEMA calculará su importe multiplicando el tiempo activo del día por la tarifa aplicable y lo mostrará en USD.
- RF-17: SI un proyecto no tiene una tarifa configurada para un registro diario, ENTONCES EL SISTEMA no mostrará el importe ni lo presentará como cero para ese registro.
- RF-18: CUANDO el período incluya registros con tarifa aplicable, EL SISTEMA mostrará el total acumulado en USD correspondiente únicamente a esos registros.
- RF-19: SI ningún registro visible tiene una tarifa aplicable, ENTONCES EL SISTEMA no mostrará el resumen monetario acumulado.
- RF-20: CUANDO una persona modifique la tarifa desde un registro diario, EL SISTEMA aplicará esa tarifa únicamente a ese proyecto y fecha, sin cambiar la tarifa base ni los importes de otros días.
- RF-21: CUANDO exista una tarifa específica para un proyecto y fecha, EL SISTEMA la usará con prioridad sobre la tarifa base del proyecto para calcular el importe de ese día.
- RF-22: CUANDO una persona recargue la aplicación o vuelva a iniciar sesión, EL SISTEMA conservará las tarifas de proyecto y las excepciones diarias guardadas.
- RF-23: SI el período seleccionado no contiene registros, ENTONCES EL SISTEMA mostrará un estado vacío, cero horas y cero descansos, y no mostrará un total monetario.
- RF-24: SI una persona intenta consultar registros o tarifas de un proyecto que no le pertenece, ENTONCES EL SISTEMA rechazará la operación sin revelar sus datos.

## Requisitos no funcionales
- RNF-1: EL SISTEMA mostrará la interfaz, los importes, las validaciones y los errores en español, usando USD como moneda.
- RNF-6: EL SISTEMA aceptará y mostrará las tarifas por hora y los importes monetarios con dos decimales.
- RNF-2: EL SISTEMA calculará los tiempos a partir de las marcas de tiempo persistidas y respetará la zona horaria del proyecto al agrupar por fecha.
- RNF-3: EL SISTEMA conservará el diseño responsive: la tabla podrá desplazarse horizontalmente en pantallas pequeñas sin ocultar columnas ni acciones.
- RNF-4: EL SISTEMA hará accesibles por teclado los filtros, la configuración de tarifas y las acciones del historial, con foco visible y etiquetas comprensibles.
- RNF-5: EL SISTEMA mantendrá aislados por persona autenticada los registros, las tarifas base y las excepciones diarias.

## Casos límite
- Una semana calendario puede comenzar o terminar con días sin registros.
- Un mes calendario puede no tener registros del proyecto seleccionado.
- Un rango personalizado de un solo día es válido cuando la fecha de inicio y la de fin coinciden.
- Un rango personalizado que incluya fines de semana debe mostrar esos días cuando el filtro de días hábiles esté desactivado.
- Un período puede incluir varios proyectos con tarifas configuradas distintas.
- Un período puede mezclar proyectos con tarifa configurada y proyectos sin tarifa; solo los primeros muestran importe y participan en el total monetario.
- Un cambio de tarifa debe separar las fechas anteriores y posteriores a su fecha efectiva.
- Cuando se consulten todos los proyectos con zonas horarias distintas, cada proyecto debe determinar sus límites de semana y mes según su propia zona horaria.
- Una excepción diaria debe prevalecer sobre la tarifa base y no modificar otros días.
- Una tarifa igual a cero se considera válida, pero su importe mostrado debe distinguirse de un proyecto sin tarifa configurada.
- Un día sin tiempo activo genera un importe de cero únicamente si existe una tarifa aplicable para ese día.

## Fuera de alcance
- Monedas distintas de USD.
- Impuestos, facturación, cobros, redondeos fiscales o emisión de facturas.
- Tarifas por usuario, cliente, tarea o tipo de segmento.
- Tarifas diferentes dentro del mismo día salvo una única excepción diaria aplicable al proyecto.
- Exportación del historial a CSV o PDF.
- Informes, notificaciones, aprobaciones de tarifas o colaboración entre personas.
- Edición o eliminación de segmentos de trabajo y descansos, salvo la edición de la tarifa aplicable al día.
- Selección de semanas o meses históricos mediante controles adicionales; los períodos predefinidos se limitan a la semana y el mes calendario actuales.

## Criterios de finalización
- [ ] Se verifica el filtro de semana calendario actual de lunes a domingo.
- [ ] Se verifica el filtro de mes calendario actual.
- [ ] Se verifica el rango personalizado inclusivo, incluido el caso de un solo día y los rangos inválidos.
- [ ] Se verifica el cambio entre solo días hábiles y todos los días.
- [ ] Se verifica el filtro por todos los proyectos y por un proyecto concreto.
- [ ] Se verifica que las filas y los totales se recalculan después de cada cambio de filtro.
- [ ] Se verifica la configuración, persistencia y validación de la tarifa horaria de un proyecto.
- [ ] Se verifica que un cambio de tarifa conserva el importe histórico anterior y aplica la nueva tarifa desde su fecha efectiva.
- [ ] Se verifica que una excepción de tarifa desde un registro diario afecta solo a ese proyecto y fecha.
- [ ] Se verifica que los registros sin tarifa no muestran importe y no se suman al total monetario.
- [ ] Se verifica el estado vacío y la ausencia del resumen monetario cuando no existen registros o tarifas aplicables.
- [ ] Se verifican aislamiento por persona, responsive, navegación por teclado y foco visible.

## Dudas abiertas
- No quedan dudas funcionales dentro del alcance acordado.
