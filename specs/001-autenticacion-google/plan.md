# Plan · 001 Autenticación con Google

## Enfoque
Google OAuth como único proveedor. La sesión se resuelve en el servidor y el front consume un hook `useAuth` con `{ user, companies, loading }`.

## Piezas
| Pieza | Detalle |
|---|---|
| Ruta pública | `src/routes/auth.tsx` |
| Guard | Layout privado que envuelve `/`, `/historial`, `/detalle-diario`, `/dashboard` |
| Sesión | Cookie httpOnly firmada; refresco silencioso |
| Perfil | `user`: id, google_id, email, nombre, avatar_url |
| Membresías | Se cargan junto con la sesión para poblar el selector de empresa |

## Flujo
```text
/auth ──click──> OAuth Google ──callback──> crear/actualizar user
      └── sin membresías ──> pantalla "sin acceso"
      └── con membresías  ──> set cookie ──> redirect "/"
```

## Decisiones
- Sin contraseñas: reduce superficie de ataque y encaja con cuentas corporativas.
- La empresa activa se guarda por usuario y se restaura al iniciar sesión.
- Todo endpoint privado valida sesión + membresía de la empresa solicitada.

## Riesgos
- Cuentas personales de Google en dominios mixtos: mitigar con lista de dominios permitidos por empresa.
- Expiración de sesión en pestaña con cronómetro abierto: el temporizador usa marcas absolutas, no se pierde tiempo.
