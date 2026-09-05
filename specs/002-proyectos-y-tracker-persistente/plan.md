# Plan 002 — Proyectos y Tracker persistente

## Alcance y superficies afectadas

La implementación sustituirá los datos de demostración y la persistencia local del Tracker por datos persistentes asociados a la persona autenticada.

Superficies afectadas:

- `backend/src/app.module.ts`: registro de los módulos de proyectos y Tracker.
- `backend/src/auth/`: tipado de la identidad JWT y acceso consistente al usuario autenticado.
- `backend/src/projects/`: módulo, entidad, DTO, servicio y controlador de proyectos.
- `backend/src/tracker/`: módulo, entidades de jornadas y segmentos, DTOs, servicio y controlador del Tracker.
- `backend/src/migrations/`: tablas, relaciones, índices y restricciones de integridad.
- `backend/src/common/errors/`: errores de dominio y propagación de mensajes de validación en español.
- `frontend/src/lib/auth.ts`: cliente HTTP autenticado reutilizable.
- `frontend/src/lib/tracker.ts`: contratos y utilidades de presentación de datos reales.
- `frontend/src/hooks/useTimeTracker.ts`: proyección del estado remoto y reloj derivado de timestamps.
- `frontend/src/components/AppShell.tsx`: selector y creación de proyectos reales, incluyendo estados responsive.
- `frontend/src/routes/__root.tsx`: estado compartido de proyectos autenticados.
- `frontend/src/routes/index.tsx`: conexión del diseño actual con proyectos, métricas, sesiones, controles y registro manual.

Quedan fuera del plan Historial, Detalle Diario, Dashboard, insights de IA, exportaciones, notificaciones, aprobaciones, colaboración, edición/eliminación de proyectos y configuración posterior de meta o zona horaria.

## Estructura y responsabilidades

### Backend

- `ProjectsModule` expondrá la lista y creación de proyectos. El servicio aplicará siempre el propietario obtenido del JWT, asignará la meta inicial y validará la zona horaria enviada por el cliente.
- `TrackerModule` expondrá la consulta de snapshot, las transiciones de jornada y los registros manuales. Su servicio será la autoridad de estados, rangos, solapamientos y métricas.
- Las entidades TypeORM representarán proyectos, jornadas y segmentos. Las relaciones y restricciones de base de datos reforzarán el aislamiento y la unicidad de jornadas abiertas.
- Los controladores usarán el `AuthGuard` existente y pasarán únicamente el identificador autenticado a los servicios; ningún identificador de usuario será aceptado desde el cuerpo de la petición.
- El filtro de errores existente conservará respuestas consistentes. La configuración de validación deberá permitir que los mensajes de DTO en español lleguen al cliente.

### Frontend

- El cliente API reutilizable añadirá el token Bearer a las peticiones privadas, decodificará respuestas de error y expondrá tipos de proyecto y Tracker.
- Un estado compartido de proyectos consultará la lista autenticada, validará el proyecto seleccionado y coordinará la creación del primer proyecto.
- `AppShell` recibirá proyectos reales y acciones de selección/creación. El selector deberá existir también en la experiencia móvil o disponer de un control equivalente.
- `useTimeTracker` consultará el snapshot del proyecto seleccionado y ejecutará mutaciones remotas. El intervalo local solo recalculará el tiempo mostrado a partir de timestamps, sin ser fuente de persistencia.
- La ruta `/` conservará el diseño actual, pero reemplazará `PROJECTS`, `HISTORY` y valores hardcodeados por datos de consulta.

## Contratos, datos y estados

### API

- `GET /api/projects`: devuelve los proyectos propiedad de la persona autenticada.
- `POST /api/projects`: recibe `name` y `timeZone`; la meta diaria inicial se fija en el servidor.
- `GET /api/projects/:projectId/tracker?previousDayScope=all|business`: devuelve el snapshot del Tracker para el día actual del proyecto y el resumen de “Ayer” según el filtro.
- `POST /api/projects/:projectId/tracker/start`: abre una jornada y su primer bloque de trabajo.
- `POST /api/projects/:projectId/tracker/break`: cierra el trabajo abierto y abre un descanso.
- `POST /api/projects/:projectId/tracker/resume`: cierra el descanso abierto y abre trabajo.
- `POST /api/projects/:projectId/tracker/finish`: cierra el segmento abierto y la jornada.
- `POST /api/projects/:projectId/manual-entries`: recibe fecha, hora de inicio y hora de fin para crear un bloque manual cerrado.

Las mutaciones devolverán el mismo snapshot que la consulta. El snapshot incluirá proyecto, estado `IDLE|WORKING|PAUSED`, jornada o segmento abierto, segmentos ordenados, métricas de hoy y resumen del día anterior.

### Persistencia

- `projects`: propietario, nombre, zona horaria IANA, meta diaria de 480 minutos y timestamps.
- `work_sessions`: propietario, proyecto, origen (`realtime` o `manual`), etiqueta, inicio y fin.
- `tracker_segments`: jornada padre, tipo (`work` o `break`), etiqueta, inicio y fin.
- Las marcas de tiempo se persistirán como instantes absolutos; la agrupación por día y la validación de futuro se realizarán usando la zona horaria del proyecto.
- Se añadirá una migración explícita porque `synchronize` está desactivado.
- Se crearán claves foráneas, índices por propietario/proyecto/tiempo y una restricción parcial para permitir como máximo una jornada abierta por persona y proyecto.
- Se reforzará también que una jornada no tenga más de un segmento abierto.

## Flujos y comportamiento técnico

### Proyectos

1. El frontend consulta los proyectos después de validar la sesión.
2. Si la respuesta está vacía, muestra el estado obligatorio de creación y no monta acciones del Tracker.
3. El formulario aplica `trim()` y envía nombre y zona horaria del dispositivo.
4. El backend valida el nombre, la zona IANA y crea el proyecto con meta de 480 minutos.
5. El frontend invalida la lista, selecciona el nuevo proyecto y carga su snapshot.
6. Al cambiar de proyecto, se descarta el snapshot anterior y se carga exclusivamente el nuevo.

### Transiciones

- `IDLE -> WORKING`: crear jornada y segmento de trabajo con el instante actual.
- `WORKING -> PAUSED`: cerrar el trabajo abierto y crear descanso con el mismo instante de transición.
- `PAUSED -> WORKING`: cerrar el descanso abierto y crear un nuevo segmento de trabajo.
- `WORKING -> IDLE` o `PAUSED -> IDLE`: cerrar el segmento abierto y la jornada.
- Cualquier acción incompatible con el estado actual será rechazada o responderá con el snapshot vigente sin crear segmentos adicionales.
- Cada transición se ejecutará en una transacción y recuperará/bloqueará la jornada abierta antes de modificarla.
- La restricción de base de datos resolverá carreras entre dos inicios simultáneos; el servicio traducirá el conflicto a la respuesta definida para mostrar la jornada existente.

### Duraciones y métricas

- Las duraciones se derivarán de `inicio` y `fin`; para un segmento abierto se usará el instante actual únicamente para la proyección de lectura.
- El tiempo activo será la suma de trabajo menos la suma de descansos, limitado a los intervalos correspondientes al día en la zona horaria del proyecto.
- “Hoy” usará el límite de día del proyecto.
- Con `all`, “Ayer” será el día calendario anterior.
- Con `business`, “Ayer” retrocederá hasta el día hábil anterior, incluido el caso lunes/viernes.
- El frontend actualizará el reloj al menos una vez por segundo mientras haya un segmento abierto y recalculará al recibir `visibilitychange`.

### Registro manual

- El frontend validará campos requeridos y rango para feedback inmediato.
- El backend será la autoridad y rechazará fin no posterior al inicio, fecha/hora final futura, y cualquier solapamiento con una jornada del mismo proyecto.
- Los registros manuales se guardarán cerrados, con origen manual, y se ordenarán por inicio en el snapshot.
- El proyecto se tomará de la ruta autenticada; no se aceptará como dato confiable del cuerpo.

### Errores y sincronización

- Las acciones permanecerán deshabilitadas durante su mutación.
- El frontend no mostrará una transición como completada hasta recibir una respuesta persistida.
- Ante error de red o dominio, se conservará el snapshot anterior y se mostrará un mensaje en español.
- Después de una recarga, cambio de proyecto, mutación exitosa o vuelta a la pestaña se volverá a consultar el snapshot.

## Integraciones y compatibilidad

- Se conservará el prefijo global `/api` del backend.
- Se reutilizará JWT/Bearer y `AuthGuard`; la identidad autorizable será `request.user.sub`.
- TypeORM mantendrá `synchronize: false`; el esquema se aplicará mediante las migraciones existentes y la nueva migración.
- El frontend conservará React Query ya instalado y montado en `frontend/src/routes/__root.tsx`.
- Las rutas fuera del alcance pueden seguir mostrando diseño demo, pero `AppShell` deberá tolerar el nuevo origen de proyectos sin mezclar datos del Tracker.
- La base de datos deberá tener disponible la generación de UUID usada por la migración actual; la migración nueva deberá mantener compatibilidad con ese requisito.

## Decisiones técnicas

| Decisión | Motivo | Alternativas consideradas | RF |
|---|---|---|---|
| Jornada contenedora con segmentos auditables | Conserva identidad, tipo, etiqueta, origen, orden y descansos explícitos | Derivar trabajo desde huecos de una jornada, que pierde trazabilidad de bloques | RF-10 a RF-19, RF-31 |
| Restricción parcial de jornada abierta | La validación de servicio sola no evita dos inicios concurrentes | Confiar únicamente en el frontend o en una consulta previa | RF-20, RF-21 |
| Transiciones transaccionales | Evita cierres parciales y estados intermedios | Actualizaciones independientes, vulnerables a fallos | RF-13, RF-16, RF-17, RF-38 |
| Snapshot común para lecturas y mutaciones | Simplifica reconciliación y evita confirmar cambios locales no persistidos | Devolver solo el recurso mutado y encadenar varias consultas | RF-8, RF-22, RF-25 a RF-32 |
| Backend como fuente de verdad | Elimina demo/localStorage como persistencia de producción | Mantener sincronización optimista local | RF-22, RF-38, RNF-3 |
| Zona IANA almacenada por proyecto | Las fechas diarias y entradas futuras dependen del proyecto | Usar zona del servidor o del navegador en cada consulta | RF-7, RF-28, RF-29, RF-37, RNF-4 |
| React Query para datos remotos | Ya está disponible y montado en el frontend | Estado manual por ruta | RF-1, RF-8, RF-38 |

## Estrategia de verificación

### Backend

- Pruebas unitarias de DTOs: nombre vacío, campos manuales ausentes, rango inválido, zona horaria inválida y fecha futura.
- Pruebas unitarias del servicio: ownership, creación, selección de estado, transiciones, cierre desde trabajo/descanso, métricas y “Ayer”.
- Pruebas de concurrencia o integración contra PostgreSQL para la unicidad de jornada abierta.
- Pruebas e2e con autenticación, migraciones y base de datos de prueba para aislamiento entre cuentas, conflictos, persistencia y errores HTTP.

### Frontend

- Pruebas unitarias del cliente API, errores, cálculo de duraciones y agrupación por zona horaria.
- Pruebas de componentes para estado sin proyectos, creación, selector responsive, estados del Tracker, carga, error y registro manual.
- Verificación de recarga con segmento abierto, `visibilitychange`, cambio de proyecto y filtros del lunes.
- Verificación manual en escritorio y móvil de teclado, foco visible, mensajes en español y estados vacíos.

Comandos definidos por el proyecto:

```sh
# Ejecutar desde backend/
npm run lint
npm run test
npm run test:e2e
npm run build
npm run migration:show

# Ejecutar desde frontend/
npm run test
npm run lint
npm run build
```

## Trazabilidad RF → implementación → verificación

| RF | Superficie de implementación | Verificación | Evidencia esperada |
|---|---|---|---|
| RF-1 | Query/provider de proyectos y estado vacío | Componente sin proyectos | Tracker bloqueado y formulario visible |
| RF-2 | Formulario y `CreateProjectDto` | Prueba de render y envío | Campo nombre presente |
| RF-3 | Validación cliente/DTO | Nombre vacío y espacios | No se crea y aparece mensaje |
| RF-4 | FK y servicio con `sub` autenticado | Crear con cuenta autenticada | Proyecto ligado al usuario |
| RF-5 | Mutación y selección activa | Crear primer proyecto | Tracker aparece con proyecto seleccionado |
| RF-6 | Valor servidor de 480 minutos | Prueba de creación | Meta de 8 horas en respuesta |
| RF-7 | Zona del dispositivo y validación IANA | Crear proyecto | Zona persistida y devuelta |
| RF-8 | Query por `projectId` y estado compartido | Cambiar proyecto | Solo aparecen sus datos |
| RF-9 | Filtro de propietario en servicios | Acceso cruzado e2e | Rechazo sin datos |
| RF-10 | Transacción `start` | Iniciar trabajo | Jornada y trabajo abiertos |
| RF-11 | Estado derivado del segmento | Prueba de snapshot/UI | Estado `TRABAJANDO` |
| RF-12 | Reloj derivado de timestamps | Esperar ticks/recalcular | `HH:MM:SS` aumenta al menos por segundo |
| RF-13 | Transacción `break` | Iniciar descanso | Trabajo cerrado y descanso abierto |
| RF-14 | Estado derivado del descanso | Prueba de snapshot/UI | Estado `EN DESCANSO` |
| RF-15 | Proyección del descanso abierto | Esperar tick | Duración actualizada |
| RF-16 | Transacción `resume` | Reanudar | Descanso cerrado y trabajo nuevo |
| RF-17 | Transacción `finish` | Finalizar desde ambos estados | Segmento y jornada cerrados, `IDLE` |
| RF-18 | Snapshot `IDLE` y controles de ruta | Carga sin jornada | Botón de inicio visible |
| RF-19 | Entidades y serialización de segmentos | Inspección/prueba de persistencia | Proyecto, origen, tipo, etiqueta, rangos y orden |
| RF-20 | Índice parcial PostgreSQL | Dos inicios concurrentes | Una sola jornada abierta |
| RF-21 | Manejo de conflicto y snapshot vigente | Segundo inicio | No duplica y muestra estado existente |
| RF-22 | Query inicial y rehidratación remota | Recargar con jornada abierta | Estado y duración recuperados |
| RF-23 | Listener de visibilidad | Ocultar/mostrar pestaña | Tiempo corregido al volver |
| RF-24 | Servicio de métricas | Jornada con descanso | Trabajo menos descanso |
| RF-25 | Métrica de hoy en snapshot | Datos del día actual | Card “Hoy” correcta |
| RF-26 | Métrica de descansos | Datos con pausas | Card “Descanso hoy” correcta |
| RF-27 | Meta y ratio | Variar trabajo diario | Límite, valor y progreso correctos |
| RF-28 | Cálculo de día calendario anterior | Caso lunes con `all` | “Ayer” usa domingo |
| RF-29 | Cálculo de día hábil anterior | Caso lunes con `business` | “Ayer” usa viernes |
| RF-30 | Comparación contra meta | Día bajo y sobre meta | Indicador correcto |
| RF-31 | Consulta cronológica de segmentos | Snapshot con varios bloques | Rangos, tipo, etiqueta y duración |
| RF-32 | Serialización de segmento abierto | Jornada activa | “En curso” y duración actual |
| RF-33 | Endpoint manual y origen | Rango válido | Bloque manual persistido |
| RF-34 | DTO y formulario | Campos ausentes | Rechazo con campos indicados |
| RF-35 | Validación de rango | Fin igual/anterior | Rechazo de rango |
| RF-36 | Consulta de solapamiento | Solapamiento parcial/total | Conflicto y ningún registro nuevo |
| RF-37 | Validación futura en zona del proyecto | Fin futuro | Rechazo con mensaje específico |
| RF-38 | Transacciones, errores y estado de mutación | Fallo API/DB simulado | Error visible y snapshot sin confirmar |
