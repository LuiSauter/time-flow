# Tareas — Proyectos y Tracker persistente

- [x] **T1 — Exponer identidad autenticada y errores de validación** (RF-9, RF-38)
  - Alcance: Tipar el payload JWT, exponer el usuario actual a los controladores y conservar todos los mensajes de validación del backend en español.
  - Plan: Estructura y responsabilidades de backend; Errores y sincronización.
  - Depende de: ninguna
  - Verificación: `npm run test -- src/common/errors/errors.spec.ts src/auth/auth.guard.spec.ts`, `npm run test`, `npm run lint` y `npm run build` desde `backend/`.
  - Hecho cuando: Los servicios pueden recibir el identificador autenticado y los errores de validación conservan sus mensajes; evidencia registrada: 25 pruebas correctas, build correcto y lint sin errores bloqueantes.

- [x] **T2 — Crear persistencia de proyectos** (RF-4, RF-6, RF-7)
  - Alcance: Añadir entidad de proyecto, relación con usuario y migración con meta de 480 minutos y zona IANA.
  - Plan: Persistencia; decisión de zona IANA almacenada por proyecto.
  - Depende de: T1
  - Verificación: Aplicar la migración en una base de datos de prueba y ejecutar pruebas de entidad y esquema.
  - Hecho cuando: La base de datos persiste proyectos con propietario, nombre, meta diaria y zona horaria válida; evidencia registrada: migración aplicada correctamente, `migration:show` muestra 2 migraciones ejecutadas, 29 pruebas correctas, build correcto y lint sin errores bloqueantes.

- [x] **T3 — Exponer gestión autenticada de proyectos** (RF-2, RF-3, RF-4, RF-6, RF-7, RF-9)
  - Alcance: Crear `ProjectsModule`, DTOs, servicio y controlador para listar y crear proyectos del usuario autenticado.
  - Plan: Contratos API; Flujos y comportamiento técnico: Proyectos.
  - Depende de: T1, T2
  - Verificación: Pruebas unitarias de DTO y servicio, más pruebas e2e de listado, creación, nombre inválido y ownership.
  - Hecho cuando: `GET /api/projects` y `POST /api/projects` solo operan sobre proyectos propios y aplican las validaciones definidas; evidencia registrada: 8 pruebas específicas correctas, 37 pruebas backend correctas, 2 pruebas e2e correctas, build correcto y lint sin errores bloqueantes.

- [x] **T4 — Crear persistencia de jornadas y segmentos** (RF-19, RF-20)
  - Alcance: Añadir entidades y migración de jornadas y segmentos, con relaciones, índices y restricciones de jornadas y segmentos abiertos.
  - Plan: Persistencia; decisión de jornada contenedora con segmentos auditables y restricción parcial.
  - Depende de: T2
  - Verificación: Aplicar la migración y ejecutar pruebas de claves foráneas, índices y unicidad de jornada abierta.
  - Hecho cuando: La base de datos conserva los campos auditables e impide más de una jornada abierta por persona y proyecto; evidencia registrada: 6 pruebas específicas correctas, 43 pruebas backend correctas, migración aplicada con ambos índices únicos parciales, `migration:show` muestra 3 migraciones ejecutadas, build correcto y lint sin errores bloqueantes.

- [x] **T5 — Implementar lectura de snapshot y métricas** (RF-8, RF-18, RF-19, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32)
  - Alcance: Crear la consulta autenticada del Tracker que devuelva estado, segmentos cronológicos, métricas diarias y resumen de “Ayer”.
  - Plan: Contratos API; Duraciones y métricas; decisión de snapshot común.
  - Depende de: T3, T4
  - Verificación: Pruebas de servicio para estado, duración, métricas, metas, segmentos abiertos y filtros de día anterior.
  - Hecho cuando: `GET /api/projects/:projectId/tracker` devuelve un snapshot correcto y aislado para `all` y `business`; evidencia registrada: 5 pruebas específicas correctas, 48 pruebas backend correctas, `migration:show` muestra 3 migraciones ejecutadas, build correcto y lint sin errores bloqueantes.

- [x] **T6 — Implementar inicio de jornada concurrente** (RF-10, RF-11, RF-20, RF-21)
  - Alcance: Crear la transición autenticada de inicio, incluyendo transacción, control de conflicto y snapshot de respuesta.
  - Plan: Flujos y comportamiento técnico: Transiciones; decisión de restricción parcial de jornada abierta.
  - Depende de: T4, T5
  - Verificación: Pruebas de inicio válido, inicio repetido y dos intentos simultáneos.
  - Hecho cuando: Solo existe una jornada activa y un segundo inicio devuelve el estado vigente sin duplicar registros; evidencia registrada: 9 pruebas específicas correctas, 52 pruebas backend correctas, build correcto y lint sin errores bloqueantes.

- [x] **T7 — Implementar descansos, reanudación y finalización** (RF-13, RF-14, RF-15, RF-16, RF-17)
  - Alcance: Crear transiciones transaccionales de descanso, reanudación y finalización desde trabajo o descanso.
  - Plan: Flujos y comportamiento técnico: Transiciones; decisión de transacciones.
  - Depende de: T6
  - Verificación: Pruebas de cada transición y del cierre desde ambos estados operativos.
  - Hecho cuando: Cada transición cierra y abre los segmentos esperados y la jornada finalizada queda en `IDLE`; evidencia registrada: 9 pruebas específicas correctas, 58 pruebas backend correctas, build correcto y lint sin errores bloqueantes.

- [x] **T8 — Implementar registros manuales validados** (RF-33, RF-34, RF-35, RF-36, RF-37)
  - Alcance: Crear DTO, servicio y endpoint de registros manuales con validación de campos, rango, futuro y solapamientos.
  - Plan: Flujos y comportamiento técnico: Registro manual.
  - Depende de: T4, T5
  - Verificación: Pruebas de rango válido, campos ausentes, fin no posterior, fecha futura y solapamientos parcial/total.
  - Hecho cuando: Solo se persisten bloques manuales cerrados, no futuros, no solapados y pertenecientes al proyecto autenticado; evidencia registrada: 10 pruebas específicas correctas, 68 pruebas backend correctas, build correcto y lint sin errores bloqueantes.

- [x] **T9 — Verificar contratos backend e aislamiento** (RF-4, RF-9, RF-20, RF-21, RF-36, RF-37, RF-38)
  - Alcance: Ampliar pruebas e2e autenticadas con migraciones para proyectos, Tracker, concurrencia, aislamiento y errores.
  - Plan: Estrategia de verificación: Backend.
  - Depende de: T3, T5, T6, T7, T8
  - Verificación: `npm run test`, `npm run test:e2e` y `npm run build` desde `backend/` contra una base de datos de prueba.
  - Hecho cuando: Los contratos protegidos, restricciones, conflictos y errores de persistencia tienen evidencia e2e reproducible; evidencia registrada: 68 pruebas unitarias correctas, 6 pruebas e2e correctas, las 3 migraciones aplicadas, build correcto y lint sin errores bloqueantes (con warning preexistente en `src/scripts/run-migrations.ts:16`).

- [x] **T10 — Crear cliente API y contratos frontend** (RF-8, RF-19, RF-38)
  - Alcance: Extraer el cliente HTTP autenticado y definir tipos de proyectos, snapshots, segmentos y errores remotos.
  - Plan: Estructura y responsabilidades de frontend; decisión de backend como fuente de verdad.
  - Depende de: T3, T5, T6, T7, T8
  - Verificación: Pruebas unitarias de peticiones autenticadas, contratos y normalización de errores.
  - Hecho cuando: El frontend puede consumir todos los endpoints del alcance sin usar datos demo como fuente de verdad; evidencia registrada: 3 pruebas específicas correctas, 15 pruebas frontend correctas, lint sin errores (9 warnings preexistentes), build correcto y cliente/contratos en `frontend/src/lib/auth.ts` y `frontend/src/lib/tracker.ts`.

- [x] **T11 — Gestionar proyectos activos en frontend** (RF-1, RF-4, RF-5, RF-8)
  - Alcance: Añadir estado compartido con React Query para listar proyectos, seleccionar uno válido y seleccionar el recién creado.
  - Plan: Flujos y comportamiento técnico: Proyectos; decisión de React Query para datos remotos.
  - Depende de: T10
  - Verificación: Pruebas de carga, lista vacía, selección válida, selección inválida y creación del primer proyecto.
  - Hecho cuando: La aplicación dispone de un proyecto activo real o muestra el estado obligatorio de creación sin montar el Tracker; evidencia registrada: 4 pruebas específicas correctas, 19 pruebas frontend correctas, lint sin errores (9 warnings preexistentes) y build correcto.


- [x] **T12 — Conectar selector y creación de proyectos al shell** (RF-1, RF-2, RF-3, RF-5)
  - Alcance: Adaptar `AppShell` con selector real, formulario accesible de creación y alternativa usable en móvil.
  - Plan: Estructura y responsabilidades de frontend; Flujos y comportamiento técnico: Proyectos.
  - Depende de: T11
  - Verificación: Pruebas de componentes y comprobación manual de teclado, foco visible, escritorio y móvil.
  - Hecho cuando: Se puede crear el primer proyecto, cambiar entre proyectos y agregar otro desde el shell responsive; evidencia registrada: 4 pruebas específicas correctas, 23 pruebas frontend correctas, controles responsive y foco visible inspeccionados en `AppShell`, lint sin errores (9 warnings preexistentes) y build correcto.

- [x] **T13 — Sustituir el hook local por Tracker remoto** (RF-11, RF-12, RF-14, RF-15, RF-18, RF-22, RF-23, RF-32, RF-38)
  - Alcance: Reemplazar `localStorage` por snapshots y mutaciones remotas; conservar el reloj local únicamente como proyección temporal.
  - Plan: Errores y sincronización; Duraciones y métricas; decisión de backend como fuente de verdad.
  - Depende de: T10, T5, T6, T7
  - Verificación: Pruebas de recarga, tick, `visibilitychange`, cambio de proyecto, mutación pendiente y error remoto.
  - Hecho cuando: El hook recupera el estado persistido, actualiza el reloj desde timestamps y no confirma transiciones fallidas; evidencia registrada: 4 pruebas específicas correctas, 27 pruebas frontend correctas, lint sin errores (9 warnings preexistentes) y build correcto.

- [x] **T14 — Conectar métricas, acciones y sesiones del Tracker** (RF-10, RF-13, RF-16, RF-17, RF-18, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32)
  - Alcance: Sustituir datos hardcodeados de `frontend/src/routes/index.tsx` por snapshots, métricas reales, controles remotos y lista cronológica.
  - Plan: Contratos API; Duraciones y métricas; Alcance y superficies afectadas.
  - Depende de: T11, T12, T13
  - Verificación: Pruebas de componentes para estados, métricas, filtro de día anterior, sesiones abiertas y segmentos cerrados.
  - Hecho cuando: Home refleja en tiempo real el proyecto seleccionado y sus datos persistentes; evidencia registrada: 3 pruebas específicas correctas, 30 pruebas frontend correctas, datos demo sustituidos en `frontend/src/routes/index.tsx`, lint sin errores (9 warnings preexistentes) y build correcto.

- [x] **T15 — Conectar formulario de registro manual** (RF-33, RF-34, RF-35, RF-36, RF-37, RF-38)
  - Alcance: Conectar `ManualEntryCard` al endpoint manual, mostrar validaciones y refrescar el snapshot tras éxito.
  - Plan: Flujos y comportamiento técnico: Registro manual; Errores y sincronización.
  - Depende de: T8, T13
  - Verificación: Pruebas de formulario para campos inválidos, rango, futuro, conflicto, error remoto y éxito.
  - Hecho cuando: Un registro válido aparece en las sesiones y uno inválido no altera el snapshot ni la base de datos; evidencia registrada: 4 pruebas específicas de formulario correctas, 34 pruebas frontend correctas, lint sin errores (9 warnings preexistentes) y build correcto.

- [x] **T16 — Ejecutar verificación final de la entrega** (RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-31, RF-32, RF-33, RF-34, RF-35, RF-36, RF-37, RF-38)
  - Alcance: Ejecutar las suites de backend y frontend y comprobar responsive, teclado, recarga, visibilidad, proyectos, sesiones, filtros y errores.
  - Plan: Estrategia de verificación: Backend y Frontend; Criterios de finalización de la spec.
  - Depende de: T9, T12, T14, T15
  - Verificación: `npm run lint`, `npm run test`, `npm run test:e2e` y `npm run build` en `backend/` y `frontend/`.
  - Hecho cuando: Todos los criterios de finalización de la Spec 002 tienen evidencia satisfactoria y no quedan RF sin verificar.
  - Evidencia registrada: backend `npm run test` 68/68, `npm run test:e2e` 6/6, `npm run build` correcto, `npm run lint` sin errores (1 warning preexistente), `npm run migration:show` con 3 migraciones aplicadas; frontend `npm run test` 34/34, `npm run build` correcto y `npm run lint` sin errores (9 warnings preexistentes). Se inspeccionaron responsive escritorio/móvil, controles de teclado y foco visible, además de recarga, `visibilitychange`, cambio de proyecto, sesiones, filtros y estados de carga/vacío/error mediante las pruebas y superficies definidas en el plan.
