# Tareas — Historial, filtros y tarifas por proyecto

- [x] **T1 — Persistir tarifas base y excepciones diarias** (RF-13, RF-15, RF-20, RF-21, RF-22, RF-24)
  - Alcance: Añadir las entidades y la migración para conservar cambios de tarifa base por fecha efectiva y una excepción diaria única por proyecto y fecha, con relaciones a proyectos, índices y borrado en cascada. Registrar las entidades en la configuración de datos y cubrir la estructura con pruebas de migración.
  - Plan: Contratos, datos y estados: Tarifas; Integraciones y compatibilidad; decisión de histórico separado y excepción única por proyecto y fecha.
  - Depende de: T16 de Spec 002
  - Verificación: Pruebas de entidad/migración y `npm run migration:show` desde `backend/`.
  - Hecho cuando: La base de datos conserva tarifas con dos decimales, permite distinguir `null` de cero, impide duplicar la misma fecha efectiva o excepción diaria por proyecto y mantiene sus relaciones con proyectos. Evidencia registrada: 9 pruebas específicas correctas, 21 pruebas del módulo/configuración correctas, 77 pruebas backend correctas, migración `CreateProjectRates1760000003000` aplicada y `migration:show` confirma 4 migraciones aplicadas, build correcto y lint sin errores (1 warning preexistente en `src/scripts/run-migrations.ts:16`).

- [x] **T2 — Exponer configuración autenticada de tarifas** (RF-13, RF-14, RF-20, RF-22, RF-24)
  - Alcance: Extender `ProjectsService` y `ProjectsController` con la lectura de tarifa vigente, la actualización de tarifa base y la actualización de excepción diaria; añadir DTOs y validaciones para valores no numéricos, negativos y con más de dos decimales; incluir la tarifa vigente en la respuesta de proyectos.
  - Plan: Estructura y responsabilidades: Backend; Contratos, datos y estados: Tarifas; Flujos y comportamiento técnico: Tarifas y cambios históricos.
  - Depende de: T1
  - Verificación: Tests de DTO, servicio y controlador para valores válidos, cero, inválidos, proyecto ajeno, persistencia y reemplazo del valor del mismo día.
  - Hecho cuando: Una persona autenticada puede guardar y consultar la tarifa de sus proyectos y la excepción de un día, mientras que las entradas inválidas o los proyectos ajenos son rechazados sin modificar datos. Evidencia registrada: 14 pruebas específicas correctas, 29 pruebas de `src/projects` correctas, 86 pruebas backend correctas, build correcto y lint sin errores (1 warning preexistente en `src/scripts/run-migrations.ts:16`).

- [x] **T3 — Implementar consulta histórica por período y proyecto** (RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-23, RF-24)
  - Alcance: Crear `HistoryController` y `HistoryService` para consultar filas diarias con período semanal, mensual o personalizado, filtro de días hábiles y filtro opcional de proyecto; validar rangos, aislar por usuario, resolver cada proyecto con su zona horaria y agrupar segmentos por fecha y proyecto.
  - Plan: Contratos, datos y estados: Consulta del historial y agregación temporal; Flujos y comportamiento técnico: Carga y filtros y Rango personalizado; decisión de calendario por zona horaria de cada proyecto.
  - Depende de: T1
  - Verificación: Tests de servicio y controlador con semanas/meses actuales, cada límite de rango, rango de un día, rangos inválidos, fines de semana, varios proyectos, zonas horarias distintas, períodos vacíos y proyecto no perteneciente.
  - Hecho cuando: `GET /api/history` devuelve únicamente filas propias, con límites y filtros correctos, tiempos activos/descansos/cumplimiento por día y un estado vacío verificable cuando no hay registros. Evidencia registrada: 11 pruebas específicas correctas, 42 pruebas de `src/tracker` correctas, 97 pruebas backend correctas, 6 pruebas e2e correctas, build correcto y lint sin errores (1 warning preexistente en `src/scripts/run-migrations.ts:16`).

- [x] **T4 — Resolver tarifas e importes en el historial** (RF-15, RF-16, RF-17, RF-18, RF-19, RF-21)
  - Alcance: Integrar en la consulta histórica la resolución de tarifa base por fecha efectiva, la prioridad de la excepción diaria, el cálculo de importe sobre tiempo activo y el resumen monetario condicional; recortar segmentos abiertos o que atraviesen medianoche antes de calcular.
  - Plan: Contratos, datos y estados: Agregación temporal y monetaria; Flujos y comportamiento técnico: Tarifas y cambios históricos; decisiones de cálculo en centavos y ausencia como `null`.
  - Depende de: T2, T3
  - Verificación: Tests de servicio con tarifa 5 USD en fechas anteriores, 7 USD desde el cambio, excepción diaria, tarifa cero, proyectos sin tarifa, mezcla de proyectos y redondeo a dos decimales.
  - Hecho cuando: Cada fila devuelve la tarifa y el importe aplicables o `null`, y el total monetario suma solo filas tarifadas sin recalcular fechas históricas con la tarifa actual. Evidencia registrada: 12 pruebas específicas correctas, 47 pruebas de `src/tracker` correctas, 102 pruebas backend correctas, 6 pruebas e2e correctas, build correcto y lint sin errores (1 warning preexistente en `src/scripts/run-migrations.ts:16`).

- [x] **T5 — Integrar contratos API y estado de historial en frontend** (RF-1, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-11, RF-13, RF-14, RF-20, RF-21, RF-22, RF-23, RF-24)
  - Alcance: Añadir los tipos de filas, totales, filtros, tarifas y errores al cliente de `frontend/src/lib/tracker.ts`, implementar `useHistory` con React Query para consultas y mutaciones, e invalidar proyectos e historial después de guardar una tarifa.
  - Plan: Estructura y responsabilidades: Frontend; Contratos, datos y estados: respuesta de historial, tarifas y estados frontend; decisión de hook específico y valores monetarios nulos.
  - Depende de: T2, T3, T4
  - Verificación: Tests de contratos API y del hook para query keys, filtros, estados loading/success/empty/error, mutaciones, invalidación y preservación del valor anterior ante error.
  - Hecho cuando: El frontend puede solicitar cada combinación válida de filtros, representar `null` sin convertirlo a cero y actualizar los datos después de una tarifa base o excepción diaria guardada. Evidencia registrada: 7 pruebas específicas de contratos/hook correctas, 22 pruebas de `src/hooks` y `src/lib` correctas, 40 pruebas frontend correctas, build correcto y lint sin errores (9 warnings preexistentes en cobertura y componentes UI).

- [x] **T6 — Implementar controles de período y filtros del historial** (RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-11)
  - Alcance: Sustituir los estados demo de `frontend/src/routes/historial.tsx` por los controles de Semana, Mes, Fecha personalizada, Solo días hábiles y proyecto Todos/concreto; mostrar y validar las fechas personalizadas antes de consultar.
  - Plan: Flujos y comportamiento técnico: Carga y filtros y Rango personalizado; decisión de calendario por zona horaria del proyecto.
  - Depende de: T5
  - Verificación: Tests de interacción de la ruta para cada período, rango inclusivo, rango de un día, rango incompleto/invertido, alternancia de días y selección de proyecto.
  - Hecho cuando: Cada control cambia los parámetros de consulta correctos, un rango inválido no dispara una consulta y la selección de filtros permanece visible mientras carga o falla. Evidencia registrada: 4 pruebas específicas de interacción correctas, 24 pruebas de `src/routes` y `src/hooks` correctas, 44 pruebas frontend correctas, build correcto y lint sin errores (9 warnings preexistentes en cobertura y componentes UI).

- [x] **T7 — Renderizar filas, totales y estados del historial** (RF-1, RF-10, RF-11, RF-16, RF-17, RF-18, RF-19, RF-23)
  - Alcance: Conectar la tabla de `historial.tsx` a la respuesta remota, mostrar fecha, día, proyecto, tiempos, cumplimiento, importe condicional y totales de horas/descansos/dinero; eliminar `HISTORY`, `PROJECTS`, `slice` y cálculos demo de la ruta; implementar loading, error y vacío.
  - Plan: Estructura y responsabilidades: Frontend; Estados frontend; Flujo de carga y filtros; decisiones de ausencia como `null` y tabla responsive.
  - Depende de: T5, T6
  - Verificación: Tests de render para filas con y sin tarifa, tarifa cero, total monetario parcial/oculto, cero horas, error, loading y datos de varios proyectos.
  - Hecho cuando: La tabla muestra únicamente la respuesta filtrada, recalcula sus totales al cambiar filtros, no muestra importes sin tarifa y conserva columnas y acciones con desplazamiento horizontal. Evidencia registrada: 3 pruebas específicas de render correctas, 47 pruebas frontend correctas, inspección confirma eliminación de datos demo y cálculos locales en `historial.tsx`, build correcto y lint sin errores (9 warnings preexistentes en cobertura y componentes UI).

- [x] **T8 — Añadir configuración de tarifa y excepción diaria en la vista** (RF-13, RF-14, RF-15, RF-20, RF-21, RF-22)
  - Alcance: Incorporar al historial un panel para definir la tarifa base de cualquier proyecto propio y reemplazar la acción genérica de fila por una edición de tarifa específica para el día y proyecto de esa fila; mostrar estados de guardado y errores accesibles.
  - Plan: Estructura y responsabilidades: Frontend; Flujos y comportamiento técnico: Tarifas y cambios históricos; Estados frontend: saving rate.
  - Depende de: T7
  - Verificación: Tests de formularios y eventos para dos decimales, cero válido, valores inválidos, error remoto, tarifa base y excepción aislada a una fecha.
  - Hecho cuando: La persona puede configurar cada proyecto y modificar la tarifa de una fila sin cambiar otros días, y los controles no se cierran ni confirman cambios cuando la API falla. Evidencia registrada: 3 pruebas específicas de formularios/eventos correctas, 30 pruebas de `src/routes` y `src/hooks` correctas, 50 pruebas frontend correctas, build correcto y lint sin errores (9 warnings preexistentes en cobertura y componentes UI).

- [x] **T9 — Enviar el contexto correcto al detalle diario** (RF-12, RF-24)
  - Alcance: Cambiar el enlace de detalle del historial y la ruta `frontend/src/routes/detalle-diario.tsx` para transportar y validar fecha/proyecto, solicitar solo el contexto autorizado y evitar que la vista se quede en la fecha o proyecto demo.
  - Plan: Estructura y responsabilidades: Frontend: detalle; Flujos y comportamiento técnico: Detalle y seguridad.
  - Depende de: T3, T7
  - Verificación: Test de navegación desde una fila con fecha y proyecto concretos, validación de parámetros y rechazo de contexto no autorizado.
  - Hecho cuando: Abrir «Ver detalle» presenta la fecha y el proyecto de la fila seleccionada y no permite consultar el detalle de un proyecto ajeno. Evidencia registrada: 5 pruebas específicas de navegación/contexto correctas, 52 pruebas frontend correctas, build correcto y lint sin errores (9 warnings preexistentes en cobertura y componentes UI).

- [x] **T10 — Cubrir contratos completos con pruebas e2e** (RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24)
  - Alcance: Ampliar la suite e2e autenticada con datos de varios proyectos, sesiones y tarifas para comprobar filtros, agregación, cambios históricos, excepciones, importes, persistencia, detalle y aislamiento entre usuarios.
  - Plan: Estrategia de verificación: Backend y Frontend; Trazabilidad RF → implementación → verificación.
  - Depende de: T4, T8, T9
  - Verificación: `npm run test:e2e` desde `backend/` y los tests frontend de ruta, hook y contratos desde `frontend/`.
  - Hecho cuando: La suite e2e demuestra los escenarios positivos, inválidos y de aislamiento definidos en RF-1 a RF-24 sin depender de datos demo. Evidencia registrada: 7 pruebas e2e correctas en `backend/`, incluyendo dos proyectos, tarifas base/excepción, importes, persistencia y aislamiento; 43 pruebas frontend de rutas, hooks y contratos correctas.

- [x] **T11 — Ejecutar validación final responsive y de calidad** (RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17, RF-18, RF-19, RF-20, RF-21, RF-22, RF-23, RF-24)
  - Alcance: Ejecutar las suites completas, builds, lint y estado de migraciones, y realizar la comprobación manual de escritorio, tablet y móvil para teclado, foco, mensajes en español, tabla desplazable y estados de carga/vacío/error.
  - Plan: Estrategia de verificación: Comandos de integración y verificación manual; Criterios de finalización de la Spec 003.
  - Depende de: T10
  - Verificación: En `backend/`, `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run build` y `npm run migration:show`; en `frontend/`, `npm run test`, `npm run lint` y `npm run build`; revisión manual responsive y accesible.
  - Hecho cuando: Todos los comandos requeridos pasan, las migraciones nuevas aparecen aplicadas, los 24 RF tienen evidencia y la interfaz conserva el comportamiento responsive y accesible definido. Evidencia registrada: backend `npm run test` 102/102, `npm run test:e2e` 7/7, `npm run lint` sin errores (1 warning preexistente), `npm run build` correcto y `npm run migration:show` confirma 4 migraciones aplicadas; frontend `npm run test` 52/52, `npm run lint` sin errores (9 warnings preexistentes) y `npm run build` correcto. Inspección responsive/accesible confirma tabla desplazable, selector móvil, controles etiquetados, estados de carga/vacío/error y foco visible.
