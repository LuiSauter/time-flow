# Spec 001 — Autenticación con email y contraseña

## Contexto y objetivo

TimeFlow necesita reemplazar el acceso de demostración por un flujo de autenticación basado únicamente en email y contraseña. Las personas deben poder crear una cuenta con los datos mínimos definidos, iniciar sesión de forma privada y acceder al Tracker, mientras que los datos incompletos, las contraseñas inseguras y las credenciales inválidas deben rechazarse con mensajes comprensibles.

## Usuarios / actores

- Persona usuaria de TimeFlow.

## Historias de usuario

- H1: Como persona usuaria, quiero crear una cuenta con mi nombre completo, email y contraseña para acceder a TimeFlow.
- H2: Como persona usuaria registrada, quiero iniciar sesión con mi email y contraseña para consultar mi Tracker.
- H3: Como persona no autenticada, quiero que se me solicite iniciar sesión antes de acceder a las pantallas privadas.

## Requisitos funcionales

- RF-1: EL SISTEMA mostrará un formulario de registro con los campos nombre completo, email y contraseña.
- RF-2: EL SISTEMA mostrará un formulario de inicio de sesión con los campos email y contraseña.
- RF-3: SI falta un campo obligatorio del registro o contiene únicamente espacios, ENTONCES EL SISTEMA no creará la cuenta e informará qué campo debe completarse.
- RF-4: SI el email del registro no tiene un formato válido, ENTONCES EL SISTEMA no creará la cuenta e informará que debe introducirse un email válido.
- RF-5: SI la contraseña del registro tiene menos de 8 caracteres, no contiene al menos un símbolo o no contiene al menos una letra mayúscula, ENTONCES EL SISTEMA no creará la cuenta e informará las reglas incumplidas. Un símbolo será cualquier carácter no alfanumérico.
- RF-6: SI el email ya pertenece a una cuenta, ENTONCES EL SISTEMA no creará otra cuenta e informará del conflicto.
- RF-7: CUANDO se envíe un registro válido, EL SISTEMA creará una cuenta con el nombre completo y el email proporcionados.
- RF-8: CUANDO se cree una cuenta correctamente, EL SISTEMA autenticará a la persona usuaria.
- RF-9: CUANDO una persona quede autenticada después del registro, EL SISTEMA la dirigirá al Tracker.
- RF-10: SI el email o la contraseña del inicio de sesión no son válidos, ENTONCES EL SISTEMA mostrará un mensaje genérico que indique que el email o la contraseña no son válidos.
- RF-11: SI el email o la contraseña del inicio de sesión no son válidos, ENTONCES EL SISTEMA no concederá acceso autenticado.
- RF-12: CUANDO se envíen credenciales válidas de una cuenta existente, EL SISTEMA autenticará a la persona usuaria.
- RF-13: CUANDO una persona inicie sesión correctamente, EL SISTEMA la dirigirá al Tracker.
- RF-14: SI una persona no autenticada intenta acceder a una pantalla privada, ENTONCES EL SISTEMA la dirigirá a la pantalla de autenticación.

## Requisitos no funcionales

- RNF-1: EL SISTEMA mostrará los textos y mensajes de autenticación en español.
- RNF-2: EL SISTEMA permitirá completar los formularios mediante teclado y mostrará un estado de foco identificable en sus controles.
- RNF-3: EL SISTEMA no revelará si el email existe al mostrar el error de credenciales inválidas durante el inicio de sesión.

## Casos límite

- Contraseña de exactamente 8 caracteres que cumple las otras dos reglas: se acepta.
- Contraseña de 7 caracteres: se rechaza.
- Contraseña sin letra mayúscula: se rechaza.
- Contraseña sin símbolo: se rechaza.
- Nombre completo vacío o compuesto solo por espacios: se rechaza.
- Email vacío, incompleto o con formato inválido: se rechaza.
- Registro con un email ya asociado a una cuenta: se rechaza sin crear duplicados.
- Inicio de sesión con email existente y contraseña incorrecta: se rechaza con mensaje genérico.
- Inicio de sesión con email no registrado: se rechaza con el mismo mensaje genérico.
- Acceso directo a una pantalla privada sin autenticación: se redirige a autenticación.

## Fuera de alcance

- Recuperación o cambio de contraseña.
- Verificación del email.
- Inicio de sesión con redes sociales, SSO, teléfono o métodos distintos de email y contraseña.
- Autenticación multifactor.
- Roles, permisos administrativos y colaboración entre usuarios.
- Edición o eliminación de la cuenta.
- Cierre de sesión y políticas de expiración de sesión en esta iteración.

## Criterios de finalización

- [ ] Existen pruebas para cada validación del registro, incluidos los límites de contraseña.
- [ ] Existen pruebas para el email duplicado y para los mensajes de inicio de sesión inválido.
- [ ] Se verifica que un registro válido autentica y dirige al Tracker.
- [ ] Se verifica que un inicio de sesión válido dirige al Tracker.
- [ ] Se verifica que una persona no autenticada no puede acceder a pantallas privadas.
- [ ] Se verifica que el flujo funciona en escritorio y móvil.
- [ ] Se verifica la navegación por teclado y el foco visible en los formularios.
- [ ] Todo el texto visible del módulo está en español.

## Dudas abiertas

- No quedan dudas funcionales dentro del alcance acordado.
