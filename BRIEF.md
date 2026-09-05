# TimeFlow — Brief completo del prototipo

Aplicación web privada (multiproyecto) para el **seguimiento de horas de trabajo en tiempo real**, orientada a eliminar "horas muertas" y a dar visibilidad de la productividad real por proyecto, día y persona.

Estado actual: **prototipo funcional de front-end** (alta fidelidad) con datos de demostración y cronómetro real persistente. Sin backend conectado todavía.

---

## 1. Resumen del producto

| Elemento | Definición |
|---|---|
| Nombre | TimeFlow |
| Tipo | Aplicación web privada, acceso mediante cuenta propia |
| Usuario objetivo | Colaboradores que registran su jornada y responsables que supervisan cumplimiento |
| Propuesta de valor | Cronómetro de jornada con descansos explícitos, historial auditable y analítica con insights de IA |
| Modelo | Multiproyecto: una misma persona puede crear varios proyectos y alternar entre ellos |
| Idioma | Español |

---

## 2. Dirección de diseño: "Prismatic Glass Instrument"

- **Concepto:** instrumento de precisión. Superficies claras tipo vidrio, bordes prismáticos sutiles y acentos espectrales; el dato manda, el adorno acompaña.
- **Color:** paleta definida en OKLCH con tokens semánticos:
  - trabajo (activo), descanso (pausa), finalización (cierre de jornada), neutro/inactivo.
  - Fondos con degradados espectrales muy suaves sobre superficies claras.
- **Tipografía:** *Space Grotesk* para títulos e interfaz, *JetBrains Mono* para cifras y cronómetro.
- **Números:** numerales tabulares en todos los contadores para que los dígitos no "salten".
- **Movimiento:** animación de tick por segundo y pulso suave en estado activo; nada más.
- **Regla del sistema:** todos los colores, sombras y degradados viven como tokens en `src/styles.css`; los componentes nunca fijan colores a mano.

---

## 3. Estructura de navegación

Shell compartido (`AppShell`) presente en todas las pantallas autenticadas:

- **Marca** TimeFlow.
- **Selector de proyecto activo:** Nuxio, Focus, y acción "Agregar".
- **Navegación principal:** Home (Tracker) · Historial · Detalle Diario · Dashboard & IA.
- **Perfil:** nombre, email y cerrar sesión.

Rutas:

| Ruta | Pantalla |
|---|---|
| `/auth` | Acceso |
| `/` | Tracker (Home) |
| `/historial` | Historial |
| `/detalle-diario` | Detalle Diario |
| `/dashboard` | Dashboard de Productividad & IA |

---

## 4. Pantallas y funcionalidades

### 4.1 Acceso (`/auth`)
- Registro e inicio de sesión con nombre completo, email y contraseña.
- Recuperación de contraseña mediante enlace de 20 minutos.
- Mensaje de aplicación privada y nota de privacidad de datos.
- Redirección al Tracker tras autenticar.

### 4.2 Tracker / Home (`/`)
- Fecha larga en español del día en curso.
- Filtro de alcance: días hábiles (L-V) o semana completa (L-D).
- **Cuatro métricas del día:** horas activas, tiempo en descanso, bloques registrados y cumplimiento respecto a la meta.
- **Cronómetro central** en formato `HH:MM:SS`, con el tiempo del segmento en curso y el acumulado del día.
- **Estados visuales:** DETENIDO · TRABAJANDO · EN DESCANSO, cada uno con su color semántico.
- **Botones dinámicos según estado:** Iniciar jornada / Tomar descanso / Reanudar / Finalizar jornada.
- **Lista cronológica de segmentos** del día (trabajo y descanso) con hora de inicio, fin y duración.
- **Registro manual** de un bloque de trabajo (inicio y fin) para corregir olvidos.

### 4.3 Historial (`/historial`)
- Filtros: período (semana / mes / trimestre), solo días hábiles, y proyecto (todos o uno).
- Tabla por día: fecha, día de la semana, horas activas, tiempo de descanso, cumplimiento y acciones.
- Fila de totales del período.
- Acceso directo al detalle de cada día.

### 4.4 Detalle Diario (`/detalle-diario`)
- Resumen del día: total activo, total en descanso y cumplimiento.
- **Timeline de 24 horas** que dibuja proporcionalmente los tramos de trabajo, descanso e inactividad.
- Desglose cronológico de cada bloque con etiqueta, rango horario y duración.
- Acción de ajuste manual del registro.

### 4.5 Dashboard de Productividad & IA (`/dashboard`)
- KPIs del período: eficiencia, horas acumuladas, promedio diario y descansos.
- **Gráfico de barras** de horas por día.
- **Gráfico de torta** con la distribución de horas por proyecto.
- **Insights de IA:** observaciones en lenguaje natural sobre ritmo, constancia y horas muertas detectadas.

---

## 5. Modelo de estado del cronómetro

Máquina de estados de tres estados:

```text
IDLE ──iniciar jornada──> WORKING ──tomar descanso──> PAUSED
                            ▲                            │
                            └────────reanudar────────────┘
WORKING / PAUSED ──finalizar jornada──> IDLE
```

Características:

- El tiempo **nunca se cuenta con un contador incremental**: cada segmento guarda marcas de tiempo absolutas (`start`, `end`) y la duración se deriva de ellas.
- Consecuencia: el cronómetro sigue siendo exacto tras recargar la página, con la pestaña en segundo plano o con el equipo suspendido.
- Persistencia en el navegador (`localStorage`, clave `TimeFlow.session.v1`), rehidratación después del montaje para no romper el render en servidor.
- Recalculo al volver a hacer visible la pestaña.
- Acciones expuestas: `startWork`, `startBreak`, `finishDay`, `addManual`, `reset`.
- Totales derivados: trabajo, descanso y segmento actual.
- La sesión guardada está ligada al proyecto activo; al cambiar de proyecto se carga su propio estado.

Tipo de segmento:

```ts
type Segment = {
  id: string;
  kind: "work" | "break";
  label: string;   // "Bloque 2 · Trabajo"
  start: number;   // epoch ms
  end?: number;    // abierto mientras corre
};
```

---

## 6. Modelo de datos propuesto (PostgreSQL)

```text
User ──< Project
             │
             └──< WorkSession ──< BreakSession
```

| Tabla | Campos clave |
|---|---|
| `user` | id, email, nombre, creado_en |
| `project` | id, user_id, nombre, slug, zona_horaria, meta_horas_diarias, creado_en |
| `work_session` | id, user_id, project_id, inicio, fin, origen (automático / manual), nota |
| `break_session` | id, work_session_id, inicio, fin, motivo |

Reglas:
- Una jornada activa por usuario y proyecto (`fin IS NULL` único).
- Los descansos siempre cuelgan de una jornada y quedan dentro de su rango.
- Horas activas del día = suma de jornadas − suma de descansos.
- Aislamiento por proyecto en toda consulta.

---

## 7. Arquitectura y stack

**Prototipo actual (implementado)**

| Capa | Tecnología |
|---|---|
| Framework | TanStack Start v1 + React 19 |
| Build | Vite 7 |
| Estilos | Tailwind CSS v4 con tokens en `src/styles.css` |
| Gráficos | Recharts |
| Estado del cronómetro | Hook propio + `localStorage` |
| Datos | Mock determinista de 30 días |

**Destino planteado por el negocio**

- API: NestJS
- Base de datos: PostgreSQL
- Front: React + Tailwind
- Autenticación: email y contraseña

### Archivos principales

```text
src/
  components/AppShell.tsx     Shell, selector de proyecto, navegación, perfil
  hooks/useTimeTracker.ts     Máquina de estados y persistencia del cronómetro
  lib/tracker.ts              Tipos, proyectos demo, formato en español, historial mock
  routes/auth.tsx             Acceso
  routes/index.tsx            Tracker
  routes/historial.tsx        Historial
  routes/detalle-diario.tsx   Detalle diario
  routes/dashboard.tsx        Dashboard & IA
  styles.css                  Sistema visual completo
```

---

## 8. Comportamiento responsive

- **Escritorio:** navegación horizontal en la cabecera, métricas en cuatro columnas, tablas completas y gráficos lado a lado.
- **Tablet:** métricas en dos columnas, gráficos apilados.
- **Móvil:** navegación compacta, cronómetro a ancho completo como elemento principal, métricas en dos columnas, tablas con desplazamiento horizontal y timeline vertical legible.

---

## 9. Fuera de alcance del prototipo

- Backend real, base de datos y autenticación persistente real (hoy es una cuenta de demostración).
- Alta y administración real de proyectos.
- Insights de IA generados en vivo (hoy son textos de ejemplo).
- Exportaciones, notificaciones y aprobación de ajustes por un responsable.

---

## 10. Siguientes pasos sugeridos

1. Conectar el backend y el acceso real con email y contraseña.
2. Persistir jornadas y descansos en base de datos con aislamiento por proyecto.
3. Panel de responsable: equipo, cumplimiento y aprobación de ajustes manuales.
4. Insights de IA reales sobre los datos históricos.
5. Exportación a CSV/PDF y reportes por período.
