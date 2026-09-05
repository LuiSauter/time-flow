# Tareas · 001 Autenticación con Google

## Front
- [ ] Maqueta de `/auth` con botón único y nota de privacidad.
- [ ] Acción de cerrar sesión en el shell.
- [ ] Hook `useAuth` con estado de carga.
- [ ] Layout privado que redirige a `/auth` sin sesión.
- [ ] Estado "cuenta sin acceso".
- [ ] Avatar y datos reales en la cabecera (hoy son de demostración).

## Backend
- [ ] Registrar credenciales OAuth de Google.
- [ ] Endpoint de inicio y callback de OAuth.
- [ ] Crear o actualizar el usuario tras el callback.
- [ ] Emitir cookie de sesión httpOnly + refresco.
- [ ] Endpoint de sesión actual con membresías.
- [ ] Endpoint de cierre de sesión.

## Pruebas
- [ ] Acceso con cuenta con membresía.
- [ ] Acceso con cuenta sin membresía.
- [ ] Redirección de ruta privada sin sesión.
- [ ] Cierre de sesión y reintento de ruta privada.
