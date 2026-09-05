# Plan 001 — Autenticación con email y contraseña

## Alcance y superficies afectadas

- **Backend NestJS:** nuevo módulo de autenticación, entidad y migración de usuarios, endpoints de registro e inicio de sesión, validación de DTOs y protección bearer.
- **Frontend React:** evolución de `frontend/src/routes/auth.tsx`, estado de autenticación, cliente HTTP y protección de las rutas privadas.
- **Configuración:** dependencias de hashing y tokens, variables de entorno para la conexión API, firma y expiración de tokens.
- **Verificación:** pruebas unitarias, integración y e2e usando los scripts existentes en `frontend/package.json` y `backend/package.json`.

Quedan fuera recuperación y cambio de contraseña, verificación de email, OAuth/SSO, teléfono, MFA, roles, colaboración, edición o eliminación de cuenta y cierre de sesión.

## Estructura y responsabilidades

### Backend

- `AuthModule`: agrupa las piezas de autenticación.
- `AuthController`: expone registro e inicio de sesión bajo el prefijo global `/api`.
- `AuthService`: aplica validaciones de negocio, comprueba duplicados, verifica contraseñas y emite tokens.
- Entidad de usuario: persiste identificador, nombre completo, email, hash de contraseña y timestamps.
- Guardia o estrategia bearer: valida firma y expiración y expone la identidad autenticada a las rutas privadas.
- Migración TypeORM: crea la tabla de usuarios y la restricción de unicidad del email.

### Frontend

- `frontend/src/routes/auth.tsx`: alterna registro e inicio de sesión y presenta validaciones y errores en español.
- Estado de autenticación compartido: conserva usuario y token, persiste el token hasta su expiración y limpia el estado inválido.
- Cliente de autenticación: ejecuta registro e inicio de sesión y añade el encabezado bearer a peticiones protegidas.
- Rutas privadas: impiden el acceso sin autenticación y redirigen a `/auth`.

## Contratos, datos y estados

### Registro

Entrada: `fullName`, `email` y `password`.

- Los tres campos son obligatorios.
- El nombre no puede estar vacío ni contener solo espacios.
- El email debe tener formato válido y ser único.
- La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter no alfanumérico.
- Una respuesta válida crea la cuenta, autentica a la persona y permite redirigir al Tracker.

### Inicio de sesión

Entrada: `email` y `password`.

- Credenciales válidas: usuario autenticado y token bearer.
- Credenciales inválidas: respuesta no autorizada con el mismo mensaje genérico para email inexistente y contraseña incorrecta.
- El contrato de error debe integrarse con `ErrorCode.UNAUTHORIZED` y el `HttpExceptionFilter` existentes.

### Persistencia y sesión

- La cuenta se persiste en PostgreSQL mediante TypeORM.
- La contraseña se almacena únicamente como hash irreversible.
- El token se conserva en el cliente hasta su expiración y se rehidrata únicamente cuando el navegador está disponible.
- El TTL exacto del token debe definirse como configuración antes de implementar.
- No se incluye refresh token porque no está definido en la spec.

## Flujos y comportamiento técnico

### Registro

1. El frontend valida los campos para proporcionar feedback inmediato.
2. El backend valida nuevamente el DTO.
3. El servicio consulta el email y devuelve conflicto si ya existe.
4. Para un registro válido, guarda el usuario con contraseña hasheada.
5. Emite un token bearer.
6. El frontend guarda el estado autenticado y navega al Tracker.

### Inicio de sesión

1. El frontend valida que email y contraseña estén presentes.
2. El backend busca la cuenta por email.
3. Verifica la contraseña contra el hash.
4. Ante cualquier fallo devuelve el mismo error genérico.
5. Ante credenciales válidas emite el token.
6. El frontend guarda el token y navega al Tracker.

### Acceso protegido

1. La ruta frontend comprueba si existe un token.
2. El backend valida firma y expiración en cada petición protegida.
3. Si el token falta, es inválido o expiró, se deniega el acceso y el frontend redirige a `/auth`.
4. Ningún error de autenticación debe revelar información sensible.

## Integraciones y compatibilidad

- Registrar el módulo en `backend/src/app.module.ts`.
- Mantener el prefijo global `/api`, `ValidationPipe`, `HttpExceptionFilter` y `ErrorCode` existentes.
- Usar TypeORM y el sistema de migraciones configurado en `backend/src/config/data.source.ts`.
- Mantener el encabezado `Authorization` permitido por `backend/src/config/cors.ts`.
- Añadir dependencias para hashing seguro y firma/verificación de tokens bearer; actualmente no existen en `backend/package.json`.
- Configurar la URL de API en el frontend sin introducir valores secretos en el bundle.
- Mantener compatibilidad SSR: el token solo se lee del navegador después del montaje.

## Decisiones técnicas

| Decisión | Motivo | Alternativas consideradas | RF |
|---|---|---|---|
| Persistencia en PostgreSQL | Las cuentas deben poder reutilizarse en sesiones posteriores | Estado en memoria, `localStorage` | RF-7, RF-12 |
| Hash irreversible de contraseñas | Evita conservar contraseñas utilizables | Texto plano, almacenamiento reversible | RF-5, RF-12 |
| Token bearer | Decisión confirmada para la sesión | Cookie HttpOnly | RF-8, RF-12 |
| Email único en base de datos | Evita duplicados incluso con concurrencia | Validación solo en servicio | RF-6 |
| Validación en frontend y backend | El frontend no es un límite de seguridad | Validación solo en frontend | RF-3, RF-4, RF-5 |
| Error genérico para login inválido | Evita revelar cuentas existentes | Errores diferenciados | RF-10, RF-11 |
| Persistencia del token hasta expiración | Mantiene la sesión tras recargar | Sesión solo en memoria | RF-8, RF-12 |
| Protección frontend y backend | Evita depender de una sola capa | Protección solo visual | RF-14 |

## Estrategia de verificación

### Backend

Ejecutar desde `backend/`:

- `npm run test`
- `npm run test:e2e`
- `npm run lint`
- `npm run build`

Cubrir registro válido, campos vacíos, email inválido, límites de contraseña, email duplicado, login válido, email inexistente, contraseña incorrecta, tokens válidos/inválidos/expirados, acceso sin token, unicidad y migración.

### Frontend

Ejecutar desde `frontend/`:

- `npm run test`
- `npm run lint`
- `npm run build`

Cubrir cambio entre formularios, validaciones en español, registro y login válidos, redirecciones, error genérico, rehidratación tras recarga, rutas privadas, navegación por teclado, foco visible y vista móvil.

## Bloqueos para la implementación

- Definir el valor concreto del TTL del token bearer antes de implementar y cubrirlo con pruebas de expiración.

## Trazabilidad RF → implementación → verificación

| RF | Superficie de implementación | Verificación | Evidencia esperada |
|---|---|---|---|
| RF-1 | `auth.tsx`, formulario de registro | Test de renderizado | Nombre, email y contraseña visibles |
| RF-2 | `auth.tsx`, formulario de login | Test de renderizado | Email y contraseña visibles |
| RF-3 | DTO y validación frontend | Tests de validación | Cuenta no creada y campo señalado |
| RF-4 | DTO y validación frontend | Tests con emails inválidos | Error de email |
| RF-5 | Regla de validación backend/frontend | Tests de límites | Contraseñas inválidas rechazadas |
| RF-6 | `AuthService`, índice único | Test unitario y e2e | Conflicto sin duplicado |
| RF-7 | Entidad, migración y servicio | Test e2e | Usuario persistido |
| RF-8 | Servicio de tokens y estado frontend | Test e2e | Sesión autenticada |
| RF-9 | Navegación de `auth.tsx` | Test de integración | Redirección a `/` |
| RF-10 | Error `UNAUTHORIZED` y UI | Test e2e y frontend | Mensaje genérico |
| RF-11 | Guardia bearer y estado frontend | Test de autorización | No se concede acceso |
| RF-12 | Verificación de hash y token | Test e2e | Login exitoso |
| RF-13 | Navegación posterior al login | Test de integración | Redirección a `/` |
| RF-14 | Guardias frontend/backend | Test de rutas protegidas | Redirección a `/auth` |
