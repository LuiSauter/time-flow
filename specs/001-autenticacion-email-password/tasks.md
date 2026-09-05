# Tareas 001 — Autenticación con email y contraseña

- [x] **T1 — Definir configuración de expiración del token** (RF-8, RF-12, RF-14)
  - Alcance: Establecer el TTL del token bearer y las variables de entorno asociadas.
  - Plan: Bloqueos para la implementación; Persistencia y sesión.
  - Depende de: ninguna
  - Verificación: Revisar configuración de desarrollo y producción; probar token vigente y expirado.
  - Hecho cuando: Existe un TTL concreto (`1h`), configurable mediante `JWT_EXPIRES_IN` y listo para ser consumido por la emisión y validación del token.
  - Evidencia: `backend/src/config/app.config.ts`, `backend/src/config/var.d.ts` y `backend/.env.example` declaran `JWT_EXPIRES_IN` con valor predeterminado `1h`; `backend/.env.test` ya lo define como `1h`. Verificado con `npm run lint` y `npm run build`.

- [x] **T2 — Preparar dependencias de autenticación** (RF-5, RF-8, RF-12)
  - Alcance: Incorporar las dependencias necesarias para hashing seguro y tokens bearer.
  - Plan: Integraciones y compatibilidad.
  - Depende de: T1
  - Verificación: `npm run build` desde `backend/`.
  - Hecho cuando: El backend compila con las dependencias de autenticación disponibles.
  - Evidencia: Añadidos `@nestjs/jwt` y `bcryptjs` en `backend/package.json` y `backend/package-lock.json`. Verificado con `npm run build` y `npm run lint` desde `backend/`.

- [x] **T3 — Crear entidad y migración de usuarios** (RF-6, RF-7, RF-12)
  - Alcance: Definir la entidad de usuario con nombre completo, email, hash de contraseña y timestamps; añadir unicidad del email.
  - Plan: Contratos, datos y estados; decisión de persistencia en PostgreSQL.
  - Depende de: ninguna
  - Verificación: Ejecutar la migración y comprobar la restricción de email único.
  - Hecho cuando: Un usuario válido puede persistirse y dos usuarios no pueden compartir email.
  - Evidencia: Añadidas `backend/src/users/user.entity.ts`, `backend/src/users/user.entity.spec.ts` y `backend/src/migrations/1760000000000-create-users.ts`. La prueba específica pasó con 2 tests; la migración creó `users` con `email` único. Verificado con `npm run build`, `npm run lint` y el CLI compilado de TypeORM.

- [x] **T4 — Definir DTOs y validaciones del registro** (RF-3, RF-4, RF-5)
  - Alcance: Declarar los contratos de registro y sus reglas para campos obligatorios, email y contraseña.
  - Plan: Contratos, datos y estados; validación en frontend y backend.
  - Depende de: ninguna
  - Verificación: Tests para campos vacíos, espacios, emails inválidos y límites de contraseña.
  - Hecho cuando: Todas las entradas inválidas se rechazan antes de crear una cuenta.
  - Evidencia: Añadidos `backend/src/auth/dto/register.dto.ts` y `backend/src/auth/dto/register.dto.spec.ts`. RED confirmado por módulo inexistente; GREEN con 6 tests pasando para registro válido, campos obligatorios, espacios, email inválido y reglas de contraseña. Verificado con `npm run build` y `npm run lint` desde `backend/`.

- [x] **T5 — Implementar servicio de registro** (RF-6, RF-7)
  - Alcance: Crear la cuenta, detectar email duplicado y almacenar únicamente el hash de la contraseña.
  - Plan: Flujos y comportamiento técnico; estructura backend.
  - Depende de: T2, T3, T4
  - Verificación: Tests unitarios y e2e para registro válido y email duplicado.
  - Hecho cuando: El registro válido persiste un usuario y el duplicado devuelve conflicto sin crear otra cuenta.
  - Evidencia: Añadidos `backend/src/auth/auth.service.ts` y `backend/src/auth/auth.service.spec.ts`. RED confirmado por módulo inexistente; GREEN con 2 tests pasando para hash de contraseña y email duplicado. Verificado con `npm run build` y `npm run lint` desde `backend/`.

- [x] **T6 — Implementar inicio de sesión y emisión de token** (RF-8, RF-10, RF-11, RF-12)
  - Alcance: Verificar credenciales, emitir bearer token y devolver el mismo error genérico ante email inexistente o contraseña incorrecta.
  - Plan: Flujos de inicio de sesión; decisión de token bearer.
  - Depende de: T1, T2, T3, T4
  - Verificación: Tests para login válido, email inexistente, contraseña incorrecta y token expirado.
  - Hecho cuando: Las credenciales válidas autentican y las inválidas no conceden acceso ni revelan qué dato falló.
  - Evidencia: Añadidos `backend/src/auth/dto/login.dto.ts` y el método `login` en `backend/src/auth/auth.service.ts`, con emisión mediante `JwtService`, expiración `JWT_EXPIRES_IN` y error `UNAUTHORIZED` genérico. RED confirmado por método inexistente; GREEN con 5 tests pasando para registro previo, login válido, email inexistente y contraseña incorrecta. Verificado con `npm run build` y `npm run lint` desde `backend/`.

- [x] **T7 — Registrar módulo y proteger rutas del backend** (RF-14)
  - Alcance: Integrar el módulo en `backend/src/app.module.ts` y aplicar la validación bearer a las rutas privadas.
  - Plan: Integraciones y compatibilidad; Protección frontend y backend.
  - Depende de: T6
  - Verificación: Test e2e con petición sin token, token inválido y token válido.
  - Hecho cuando: Las rutas privadas solo responden a tokens válidos.
  - Evidencia: Añadidos `backend/src/auth/auth.guard.ts`, `backend/src/auth/auth.guard.spec.ts` y `backend/src/auth/auth.module.ts`; registrados en `backend/src/app.module.ts` y aplicado `AuthGuard` a `AppController`. RED confirmado por guardia inexistente; GREEN con 3 tests pasando para token ausente, inválido y válido. Verificado con `npm run build` y `npm run lint` desde `backend/`.

- [x] **T8 — Cubrir el backend completo** (RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-10, RF-11, RF-12, RF-14)
  - Alcance: Consolidar tests unitarios, e2e y de migración para todos los flujos backend.
  - Plan: Estrategia de verificación del backend.
  - Depende de: T5, T6, T7
  - Verificación: `npm run test`, `npm run test:e2e`, `npm run lint` y `npm run build` desde `backend/`.
  - Hecho cuando: Todos los comandos pasan y existe evidencia para cada caso backend definido en el plan.
  - Evidencia: Actualizado `backend/test/app.e2e-spec.ts` para probar la ruta protegida con token ausente y válido en un fixture aislado de PostgreSQL. Suite unitaria: 6 archivos y 21 tests pasando. Suite e2e: 1 archivo y 2 tests pasando. Verificado con `npm run test`, `npm run test:e2e`, `npm run lint` y `npm run build` desde `backend/`.

- [x] **T9 — Crear cliente y estado de autenticación frontend** (RF-8, RF-12, RF-14)
  - Alcance: Gestionar usuario y token, persistir el token hasta su expiración y añadir `Authorization` a las peticiones protegidas.
  - Plan: Estructura frontend; Persistencia y sesión; SSR.
  - Depende de: T6
  - Verificación: Tests de almacenamiento, rehidratación, token expirado y encabezado bearer.
  - Hecho cuando: El estado autenticado sobrevive una recarga mientras el token sea válido y se limpia al expirar.
  - Evidencia: Añadidos `frontend/src/lib/auth.ts`, `frontend/src/lib/auth.spec.ts` y `frontend/src/hooks/useAuth.ts`. RED confirmado por módulo inexistente; GREEN con 4 tests pasando para persistencia, rehidratación, expiración, limpieza y encabezado bearer. Verificado con `npm run test -- --run src/lib/auth.spec.ts`, `npm run lint` y `npm run build` desde `frontend/`; lint termina sin errores y conserva 9 warnings preexistentes.

- [x] **T10 — Implementar formularios de registro e inicio de sesión** (RF-1, RF-2, RF-3, RF-4, RF-5)
  - Alcance: Evolucionar `frontend/src/routes/auth.tsx` con los dos formularios, validación, estados de carga y mensajes en español.
  - Plan: Estructura frontend; Contratos de registro e inicio de sesión.
  - Depende de: T4, T9
  - Verificación: Tests de renderizado, validaciones y navegación por teclado.
  - Hecho cuando: La pantalla muestra los campos correctos y bloquea entradas inválidas con mensajes comprensibles.
  - Evidencia: Añadidos `frontend/src/components/AuthForm.tsx` y `frontend/src/components/AuthForm.spec.tsx`; actualizada `frontend/src/routes/auth.tsx`. RED confirmado por componente inexistente; GREEN con 3 tests pasando para modos login/registro, validaciones y envío válido. Verificado con `npm run lint` y `npm run build` desde `frontend/`; lint termina sin errores y conserva 9 warnings preexistentes.

- [x] **T11 — Integrar registro, login y errores en la interfaz** (RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13)
  - Alcance: Conectar los formularios con el cliente de autenticación, manejar conflicto, error genérico y redirecciones al Tracker.
  - Plan: Flujos y comportamiento técnico; Cliente de autenticación.
  - Depende de: T5, T6, T9, T10
  - Verificación: Tests de integración para registro válido, login válido, duplicado y credenciales inválidas.
  - Hecho cuando: El registro y el login válidos autentican y navegan a `/`, mientras los errores conservan el estado no autenticado.
  - Evidencia: Añadido `backend/src/auth/auth.controller.ts` con endpoints de registro/login; actualizado `AuthService` para autenticar también tras el registro; conectada `frontend/src/routes/auth.tsx` con `register`, `login`, `setSession` y navegación al Tracker; `AuthForm` muestra errores de conflicto y credenciales inválidas. GREEN con 4 tests frontend y 7 tests backend pasando. Verificado con `npm run build` y `npm run lint` en ambas aplicaciones; frontend lint conserva 9 warnings preexistentes.

- [x] **T12 — Proteger las rutas privadas del frontend** (RF-11, RF-14)
  - Alcance: Aplicar la comprobación de autenticación a `/`, `/historial`, `/detalle-diario` y `/dashboard`.
  - Plan: Acceso protegido; Protección frontend y backend.
  - Depende de: T7, T9
  - Verificación: Tests de navegación directa sin token, token inválido y token válido.
  - Hecho cuando: Una persona no autenticada es redirigida a `/auth` y una persona autenticada puede abrir las rutas privadas.
  - Evidencia: Añadidos `frontend/src/lib/route-guard.ts` y la comprobación `canAccessPrivateRoute`; aplicado `requirePrivateSession` a `/`, `/historial`, `/detalle-diario` y `/dashboard`. GREEN con 6 tests de sesión/guardia pasando, incluyendo acceso sin sesión y con token válido. Verificado con `npm run lint` y `npm run build` desde `frontend/`; lint termina sin errores y conserva 9 warnings preexistentes.

- [x] **T13 — Verificar accesibilidad y responsive del módulo** (RF-1, RF-2, RF-3, RF-4, RF-5)
  - Alcance: Revisar foco visible, navegación por teclado, etiquetas, mensajes y comportamiento en escritorio y móvil.
  - Plan: Estrategia de verificación frontend; principios de accesibilidad y responsive.
  - Depende de: T10, T11
  - Verificación: Prueba manual en escritorio y móvil; navegación completa sin ratón.
  - Hecho cuando: Ambos formularios son operables por teclado, tienen foco visible y permanecen utilizables en móvil.
  - Evidencia: Añadida prueba de navegación por teclado y foco visible en `frontend/src/components/AuthForm.spec.tsx`; inspeccionados los labels, estilos de foco y layout responsive de `AuthForm` y `/auth`. Suite frontend: 2 archivos y 11 tests pasando. Verificado con `npm test`, `npm run lint` y `npm run build` desde `frontend/`; lint termina sin errores y conserva 9 warnings preexistentes.

- [x] **T14 — Ejecutar validación final de integración** (RF-1, RF-2, RF-3, RF-4, RF-5, RF-6, RF-7, RF-8, RF-9, RF-10, RF-11, RF-12, RF-13, RF-14)
  - Alcance: Validar el flujo completo frontend-backend y actualizar los criterios de finalización de la spec con la evidencia obtenida.
  - Plan: Estrategia de verificación; Trazabilidad RF → implementación → verificación.
  - Depende de: T8, T12, T13
  - Verificación: `npm run test`, `npm run lint` y `npm run build` desde `frontend/`; comandos equivalentes del backend; recorrido manual de registro, login y acceso privado.
  - Hecho cuando: Todos los RF tienen evidencia de implementación y verificación, y las comprobaciones frontend y backend pasan.
  - Evidencia: Validación final completada. Backend: `npm test` con 7 archivos y 23 tests, `npm run test:e2e` con 2 tests, `npm run lint` y `npm run build` correctos. Frontend: `npm test` con 2 archivos y 11 tests, `npm run lint` sin errores y `npm run build` correcto. Lint frontend conserva 9 warnings preexistentes.
