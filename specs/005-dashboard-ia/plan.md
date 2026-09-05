# Plan · 005 Dashboard e IA

## Enfoque
Capa de analítica sobre los mismos agregados del Historial, más un generador de insights que recibe únicamente métricas resumidas.

## Piezas
| Pieza | Archivo |
|---|---|
| Pantalla, KPIs y gráficos | `src/routes/dashboard.tsx` |
| Gráficos | Recharts (barras y torta) |
| Datos | `src/lib/tracker.ts` |

## Insights
1. Se arma un resumen compacto: horas por día, descansos, huecos de inactividad, cumplimiento y tendencia.
2. Ese resumen se envía al generador; nunca se envían datos personales identificables.
3. La respuesta se muestra como lista corta de observaciones, cada una con su dato de respaldo.
4. Resultado cacheado por período y empresa; se recalcula solo si cambian los datos.

## Migración a backend
- `GET /reports/summary?from&to&companyId` devuelve KPIs y series de los gráficos.
- `POST /insights` recibe el resumen y devuelve las observaciones.

## Riesgos
- Alucinaciones: exigir que cada observación referencie una cifra del resumen; descartar las que no lo hagan.
- Coste por llamada: caché por período y límite de frecuencia de regeneración.
