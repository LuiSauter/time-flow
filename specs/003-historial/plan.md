# Plan Spec 003 — Historial, filtros y tarifas por proyecto

## Alcance y superficies afectadas

La implementación sustituirá la fuente demo de `frontend/src/routes/historial.tsx` por datos autenticados del backend, añadirá la consulta agregada del historial y permitirá administrar la tarifa base y las excepciones diarias de los proyectos.

Superficies afectadas:

- `frontend/src/routes/historial.tsx`: filtros, estados de carga/vacío/error, tabla, totales, configuración de tarifa y edición de excepción diaria. RF-1 a RF-23.
- `frontend/src/lib/tracker.ts`: tipos de proyecto, contrato de historial, contratos de tarifas y funciones de acceso a la API. RF-1 a RF-24.
- `frontend/src/hooks/`: nuevo estado de consulta del historial y mutaciones de tarifa, siguiendo el patrón de `ProjectsProvider` y `useTimeTracker`. RF-1 a RF-23.
- `frontend/src/routes/detalle-diario.tsx`: recepción del día y proyecto seleccionados desde el historial. RF-12.
- Pruebas frontend de ruta, hooks y contratos API. RF-1 a RF-24.
- `backend/src/projects/`: tarifa base del proyecto, histórico de cambios, excepciones diarias, DTOs, servicio, controlador, módulo y pruebas. RF-13 a RF-15, RF-20 a RF-22, RF-24.
- `backend/src/tracker/`: consulta agregada de historial, cálculo diario, controlador, servicio, módulo y pruebas. RF-1 a RF-12, RF-16 a RF-19, RF-23 a RF-24.
- `backend/src/migrations/` y `backend/src/config/data.source.ts`: persistencia de tarifas e integración de las nuevas entidades y migraciones. RF-13 a RF-15, RF-20 a RF-22.
- Pruebas e2e de autenticación, aislamiento, filtros, rangos, tarifas y agregación. RF-1 a RF-24.

Fuera del plan:

- Dashboard, exportaciones, facturación, impuestos, notificaciones y colaboración.
- Monedas distintas de USD.
- Edición o eliminación de segmentos de trabajo y descansos.
- Selección de semanas o meses históricos mediante controles predefinidos adicionales.
- Rediseño general del sistema visual o cambios en la máquina de estados del tracker.

## Estructura y responsabilidades

### Backend

- `ProjectsService` conservará la administración de proyectos y añadirá las operaciones autenticadas para leer la tarifa vigente, guardar una tarifa base y guardar una excepción diaria.
- `ProjectsController` expondrá las operaciones de tarifa bajo rutas anidadas al proyecto existente y mantendrá `AuthGuard` en todas ellas.
- `ProjectRate` representará cada cambio de tarifa base con su fecha efectiva. El registro más reciente aplicable a una fecha será la tarifa base de esa fecha.
- `ProjectDailyRateOverride` representará como máximo una excepción por proyecto y fecha. La excepción tendrá prioridad sobre la tarifa base.
- `HistoryService` consultará sesiones y segmentos existentes, limitará todos los datos al usuario autenticado y a los proyectos solicitados, y devolverá filas agrupadas por fecha y proyecto.
- `HistoryController` validará el período, las fechas y el filtro de proyecto antes de delegar la consulta al servicio.
- `TrackerModule` incorporará la consulta de historial y sus entidades de lectura; `ProjectsModule` conservará la responsabilidad de mutar las tarifas. Las entidades de tarifas se registrarán en los módulos que las consulten.

### Frontend

- `useHistory` administrará los filtros seleccionados, el estado de la consulta y las mutaciones de tarifa. La clave de consulta incluirá la sesión y todos los filtros para evitar mezclar resultados.
- `historial.tsx` derivará únicamente la presentación de filas y totales desde la respuesta del backend; no conservará `HISTORY` ni `PROJECTS` como fuente de datos.
- El panel de tarifa permitirá seleccionar cualquier proyecto propio para definir su tarifa base, independientemente de que la tabla esté mostrando todos los proyectos.
- La acción de tarifa de cada fila abrirá una edición de excepción para el proyecto y fecha de esa fila. La acción de detalle navegará con el contexto de fecha y proyecto seleccionado.
- `detalle-diario.tsx` consumirá el contexto recibido para no mostrar siempre la fecha y el proyecto demo. La implementación completa de su timeline seguirá las superficies de detalle existentes y no ampliará esta spec más allá de la navegación correcta.

## Contratos, datos y estados

### Consulta del historial

Se añadirá un contrato autenticado equivalente a:

`GET /api/history?period=week|month|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&onlyWeekdays=true|false&projectId=<id opcional>`

Reglas del contrato:

- `week` calcula lunes-domingo de la semana calendario actual por zona horaria de cada proyecto.
- `month` calcula primer-último día del mes calendario actual por zona horaria de cada proyecto.
- `custom` exige `startDate` y `endDate`, incluye ambos límites y usa cada zona horaria de proyecto para agrupar sus registros.
- La ausencia de `projectId` significa todos los proyectos propios; su presencia limita el resultado al proyecto propio indicado.
- `onlyWeekdays=true` excluye sábado y domingo después de determinar la fecha local del proyecto.
- Fechas inválidas, rangos incompletos o inicio posterior al fin devuelven un error validado y no una consulta parcial.

La respuesta contendrá filas con, al menos, `date`, `projectId`, `projectName`, `workSeconds`, `breakSeconds`, `activeSeconds`, `goalMinutes`, `goalMet`, `hourlyRate`, `rateSource` y `amountUsd`, además de totales de `days`, `workSeconds`, `breakSeconds`, `activeSeconds` y `amountUsd`. Los valores monetarios sin tarifa serán nulos, no cero; el resumen monetario será nulo cuando ninguna fila tenga tarifa aplicable.

### Tarifas

- `PATCH /api/projects/:projectId/rate` recibirá `hourlyRate` y actualizará o insertará la tarifa base efectiva en la fecha local del proyecto.
- `PUT /api/projects/:projectId/rate-overrides/:date` recibirá `hourlyRate` y actualizará o insertará la excepción de ese proyecto y fecha.
- Ambos contratos estarán autenticados y verificarán que el proyecto pertenece a la persona solicitante.
- La tarifa será USD, no negativa y con dos decimales. El valor cero será válido y se distinguirá de `null` sin tarifa.
- Una segunda modificación de tarifa base en la misma fecha reemplazará el valor efectivo de esa fecha, sin crear dos tarifas base aplicables al mismo día.
- La fecha efectiva de una tarifa base será la fecha local del proyecto en el momento de guardar la modificación.
- Las respuestas de proyectos incluirán la tarifa base vigente o `null` para que el frontend pueda mostrar el estado de configuración.

### Agregación temporal y monetaria

- El backend usará las marcas `startedAt` y `endedAt` de `TrackerSegment`; los segmentos abiertos se calcularán hasta el instante de consulta.
- Cada segmento se recortará contra los límites de cada día local antes de agregarlo. Esto conservará la exactitud para sesiones que atraviesen medianoche o cambios de horario.
- `workSeconds` será la suma de segmentos de trabajo y `breakSeconds` la suma de descansos; `activeSeconds` será `max(0, workSeconds - breakSeconds)`.
- La tarifa aplicable será la excepción diaria si existe; en caso contrario será el último cambio de tarifa base cuya fecha efectiva no sea posterior al día consultado.
- El importe se calculará como horas activas multiplicadas por la tarifa aplicable y se redondeará al centavo más cercano. El frontend mostrará siempre dos decimales.

### Estados frontend

- `loading`: conserva los filtros y comunica que el historial está cargando.
- `success`: muestra filas, totales y el resumen monetario solo cuando corresponda.
- `empty`: muestra cero horas y descansos, y oculta el resumen monetario.
- `error`: muestra el mensaje en español, conserva la selección de filtros y permite reintentar.
- `saving rate`: deshabilita el control afectado, conserva el valor anterior hasta recibir confirmación y muestra el error sin cerrar el formulario si falla.

## Flujos y comportamiento técnico

### Carga y filtros

1. La ruta autenticada obtiene los proyectos propios mediante el contexto existente.
2. El hook inicializa `period=month`, `onlyWeekdays=true` y proyecto `todos`, y solicita el historial.
3. Al cambiar período, fechas personalizadas, días hábiles o proyecto, invalida la consulta anterior y solicita el nuevo resultado.
4. El backend determina las fechas por proyecto, aplica aislamiento, agrupa los segmentos y devuelve filas ordenadas por fecha descendente y proyecto.
5. La vista renderiza la tabla y usa los totales devueltos, sin aplicar `slice` ni recalcular horas desde datos demo.

### Rango personalizado

- La interfaz mostrará fecha inicial y final cuando se seleccione `Personalizado`.
- No se enviará una consulta válida hasta tener ambas fechas con formato válido.
- Si inicio es posterior a fin, la vista mostrará el error local y el backend mantendrá la misma validación como límite de seguridad.
- Un rango con la misma fecha se enviará y devolverá como un día incluido.

### Tarifas y cambios históricos

1. El panel selecciona un proyecto propio y carga su tarifa base vigente.
2. Al guardar una tarifa, el backend crea o actualiza el cambio efectivo del día local actual del proyecto.
3. Las consultas para fechas anteriores resuelven el cambio anterior; las consultas desde la fecha del cambio resuelven el nuevo valor.
4. Una edición de fila guarda una excepción para esa fecha concreta.
5. Al recalcular la fila, la excepción gana a la tarifa base; los demás días siguen usando su tarifa histórica.
6. Después de una mutación correcta, se invalidan proyectos e historial para reflejar tanto la tarifa vigente como los importes.

### Detalle y seguridad

- El enlace de detalle llevará fecha y proyecto como contexto de navegación validado por la ruta.
- El detalle solicitará solo datos del proyecto indicado y rechazará un proyecto que no pertenezca a la persona autenticada.
- Ninguna consulta de historial, tarifa base o excepción se ejecutará sin `AuthGuard` y filtro por `userId`.
- Los identificadores de proyecto y las fechas se validarán antes de consultar o mutar.

## Integraciones y compatibilidad

- La nueva migración debe ejecutarse después de las tres migraciones actuales y quedar registrada en `DataSourceConfig`.
- Las tablas de tarifas usarán relaciones con `projects` y borrado en cascada para no dejar registros huérfanos al eliminar un proyecto en el futuro.
- La consulta debe utilizar índices por proyecto y fecha efectiva, y limitar el rango temporal antes de agregar segmentos para evitar cargar todo el historial en memoria.
- La respuesta API debe mantener tipos explícitos en `frontend/src/lib/tracker.ts`; los valores `null` no se convertirán a cero.
- No se añadirá dependencia externa de facturación o moneda; USD y dos decimales son parte de este alcance.
- Las migraciones no se aplicarán automáticamente desde la aplicación; se verificarán con los comandos TypeORM existentes.

## Decisiones técnicas

| Decisión | Motivo | Alternativas consideradas | RF |
|---|---|---|---|
| Centralizar la consulta en `HistoryService` dentro del módulo de tracker | Las sesiones y segmentos ya pertenecen a `TrackerModule`; evita duplicar la lógica temporal | Calcular el historial solo en el frontend; crear un módulo paralelo sin necesidad | RF-1 a RF-12, RF-16 a RF-19, RF-23 |
| Resolver semana y mes por zona horaria de cada proyecto | La spec lo exige y evita mezclar días locales de proyectos distintos | Usar zona del navegador; impedir «Todos» | RF-2, RF-3, RF-8, RNF-2 |
| Mantener histórico de tarifas base separado del proyecto actual | Permite conservar enero/febrero a 5 USD y aplicar marzo a 7 USD | Sobrescribir un único campo del proyecto; recalcular todo con la tarifa actual | RF-13, RF-15, RF-22 |
| Guardar una excepción única por proyecto y fecha | Hace determinista la prioridad diaria y evita múltiples tarifas dentro del día | Mutar la tarifa base; permitir varios valores por día | RF-20, RF-21 |
| Usar `numeric` con escala de dos decimales y cálculo monetario en centavos | Evita errores de punto flotante y cumple la precisión acordada | `float`; aceptar precisión arbitraria | RF-14, RF-16, RF-18, RNF-6 |
| Tratar ausencia de tarifa como `null` | Distingue «sin configurar» de una tarifa válida igual a cero | Usar cero para ambos casos | RF-17 a RF-19, RF-23 |
| Calcular días desde segmentos recortados a límites locales | Mantiene exactitud de sesiones abiertas, medianoche y cambios de zona | Agrupar por `startedAt` sin recorte; usar minutos almacenados | RF-1, RF-10, RF-11, RF-16, RNF-2 |
| Mantener filtros y consulta en un hook específico | Aísla estado de servidor de la presentación y sigue el patrón React Query existente | Estado global; lógica completa dentro de la ruta | RF-1 a RF-11, RF-23 |
| Reutilizar el shell y el sistema visual actuales | Conserva navegación, responsive, tokens y accesibilidad ya establecidos | Crear un shell o una tabla visual nueva | RNF-1, RNF-3, RNF-4 |

## Estrategia de verificación

### Backend

- Unit tests de DTOs para fechas, tarifas negativas, valores no numéricos y precisión de dos decimales.
- Unit tests de `ProjectsService` para guardar tarifas, reemplazar el cambio del mismo día, validar propiedad y distinguir tarifa cero de ausencia.
- Unit tests de `HistoryService` con varios proyectos y zonas horarias, semana, mes, rango personalizado, fines de semana, segmentos abiertos, sesiones que cruzan medianoche, tarifas históricas, excepciones y períodos vacíos.
- Tests de controladores para autenticación, paso de filtros, validación y llamadas a servicios.
- Migration test para las tablas, relaciones, índices y escala monetaria.
- E2E autenticada para todos los filtros, agregación, tarifas, persistencia tras una nueva consulta, aislamiento entre usuarios y rechazo de proyecto ajeno.

### Frontend

- Tests de funciones de fechas, formato USD, selección de tarifa aplicable y totales con filas con y sin tarifa.
- Tests de `useHistory` para claves de consulta, estados, invalidación posterior a mutaciones y errores.
- Tests de `HistorialPage` para los tres períodos, fechas inválidas, días hábiles/todos, todos/proyecto concreto, filas, totales, ausencia de importe y estado vacío.
- Tests de configuración de tarifa base y excepción diaria, incluyendo dos decimales, cero válido y error remoto.
- Tests del enlace al detalle con fecha y proyecto correctos.
- Verificación manual en escritorio, tablet y móvil: desplazamiento horizontal de tabla, controles por teclado, foco visible, mensajes en español y estados de carga/vacío/error.

### Comandos de integración

Desde `backend/`:

- `npm run test`
- `npm run test:e2e`
- `npm run lint`
- `npm run build`
- `npm run migration:show`

Desde `frontend/`:

- `npm run test`
- `npm run lint`
- `npm run build`

## Trazabilidad RF → implementación → verificación

| RF | Superficie de implementación | Verificación | Evidencia esperada |
|---|---|---|---|
| RF-1 | `HistoryController`, `HistoryService`, `useHistory`, `historial.tsx` | E2E de carga autenticada y test de ruta | Filas propias agrupadas por fecha/proyecto |
| RF-2 | Resolución de período en `HistoryService` por zona del proyecto | Unit y e2e con semana actual | Solo lunes-domingo local de cada proyecto |
| RF-3 | Resolución de mes en `HistoryService` por zona del proyecto | Unit y e2e con mes actual | Solo primer-último día local |
| RF-4 | DTO de consulta y controles de fecha en `historial.tsx` | Test de rango inclusivo y e2e | Inicio y fin incluidos |
| RF-5 | Validación de query DTO y validación local del formulario | Tests de valores incompletos, inválidos e invertidos | Error en español y sin consulta parcial |
| RF-6 | Filtro `onlyWeekdays` en servicio y hook | Unit y test de ruta | Sábado/domingo excluidos |
| RF-7 | Filtro desactivado en servicio y vista | Test de alternancia y e2e | Lunes-domingo incluidos |
| RF-8 | Query opcional sin `projectId`, lista autenticada | E2E con varios proyectos | Todos los proyectos propios visibles |
| RF-9 | Query con `projectId` y validación de pertenencia | E2E de selección y proyecto ajeno | Solo proyecto elegido; ajeno rechazado |
| RF-10 | DTO de fila y tabla de historial | Test de render de columnas y acciones | Fecha, día, proyecto, tiempos, cumplimiento y acciones |
| RF-11 | Clave de React Query y totales de respuesta | Tests de cada filtro | Filas/totales cambian solo con registros visibles |
| RF-12 | Link de historial y contexto de `detalle-diario.tsx` | Test de navegación | Detalle recibe fecha y proyecto de la fila |
| RF-13 | `ProjectsService`, `PATCH /projects/:id/rate`, panel de tarifa | Unit, controller y e2e | Tarifa USD guardada y disponible para cálculo |
| RF-14 | DTO de tarifa y validación de servicio | Tests con texto, negativo y más de dos decimales | No guarda y muestra validación |
| RF-15 | `ProjectRate` con fecha efectiva local | Unit/e2e con tarifas 5 y 7 | Fechas previas conservan 5; posteriores usan 7 |
| RF-16 | Agregador de horas y calculador de importe | Unit con minutos y tarifa configurada | Importe activo × tarifa, mostrado en USD con 2 decimales |
| RF-17 | Resolución `null` y render condicional | Test mixto con proyecto sin tarifa | No aparece importe ni cero en esa fila |
| RF-18 | Totales monetarios del agregador y footer | Unit/e2e con varias filas tarifadas | Total solo de filas con tarifa aplicable |
| RF-19 | Estado monetario nulo en respuesta y vista | Test sin tarifas aplicables | Resumen monetario oculto |
| RF-20 | `PUT /rate-overrides/:date`, tabla y modal de fila | Unit, controller y e2e | Solo cambia proyecto y fecha elegidos |
| RF-21 | Prioridad en `HistoryService` | Unit con base y excepción | La excepción es la tarifa usada |
| RF-22 | Migraciones, repositorios e invalidación de consultas | E2E tras recarga/reconsulta y migration show | Tarifas permanecen guardadas |
| RF-23 | Respuesta vacía y estados de `historial.tsx` | Test de ruta y e2e sin registros | Cero horas/descansos, sin total monetario |
| RF-24 | `AuthGuard`, filtros `userId` y ownership en servicios | E2E entre dos usuarios | Operación ajena rechazada sin datos |
