# 001 · Autenticación con Google

## Objetivo
Permitir el acceso a TimeFlow únicamente mediante cuenta corporativa de Google, sin formularios de usuario/contraseña.

## Alcance
- Pantalla de acceso `/auth` con un único botón "Continuar con Google".
- Mensaje de aplicación privada y nota de privacidad de datos.
- Redirección al Tracker (`/`) tras autenticar.
- Cierre de sesión desde el shell (icono en la cabecera).

## Fuera de alcance
- Registro público, recuperación de contraseña, MFA.
- Invitaciones y alta de empresas (ver 006).

## Historias de usuario
1. Como colaborador, entro con mi cuenta de Google y llego directo a mi cronómetro del día.
2. Como colaborador, cierro sesión y vuelvo a la pantalla de acceso.
3. Como persona sin invitación, veo un mensaje de acceso restringido.

## Criterios de aceptación
- [ ] `/auth` no muestra campos de texto.
- [ ] Un usuario autenticado que visita `/auth` es enviado a `/`.
- [ ] Un usuario no autenticado que visita cualquier ruta privada es enviado a `/auth`.
- [ ] Tras cerrar sesión no queda estado de sesión accesible en el navegador.
- [ ] Si la cuenta no pertenece a ninguna empresa, se muestra "Tu cuenta no tiene acceso" en vez de entrar.

## Estado actual del prototipo
Pantalla maquetada con cuenta de demostración; sin OAuth real.
