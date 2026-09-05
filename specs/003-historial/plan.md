# Plan · 003 Historial

## Enfoque
Vista de solo lectura sobre datos agregados por día. Hoy consume el mock determinista de `src/lib/tracker.ts`; a futuro un endpoint agregado por período.

## Piezas
| Pieza | Archivo |
|---|---|
| Pantalla y filtros | `src/routes/historial.tsx` |
| Datos y utilidades | `src/lib/tracker.ts` (`HISTORY`, `hm`, `shortDate`, `isWeekday`) |
| Controles | `Segmented` de `src/components/AppShell.tsx` |

## Contrato de datos
```ts
type DayRecord = {
  date: string;          // yyyy-mm-dd
  companyId: string;
  workMinutes: number;
  breakMinutes: number;
  goalMinutes: number;
};
```

## Migración a backend
- `GET /reports/days?from&to&companyId&weekdaysOnly` devuelve `DayRecord[]` más los totales del período.
- La agregación se hace en base de datos, no en el navegador.
- Paginación si el trimestre supera un umbral de filas.

## Riesgos
- Zonas horarias: agrupar por día en la zona horaria de la empresa, no en UTC.
- Días con jornadas en varias empresas: una fila por día y empresa.
