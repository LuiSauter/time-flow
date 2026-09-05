# Plan · 002 Tracker de jornada

## Enfoque
El reloj es local y derivado de timestamps; el servidor es la fuente de verdad de los segmentos. El front escribe transiciones y reconcilia al cargar.

## Piezas
| Pieza | Archivo |
|---|---|
| Máquina de estados y totales | `src/hooks/useTimeTracker.ts` |
| Tipos y formato en español | `src/lib/tracker.ts` |
| Pantalla | `src/routes/index.tsx` |
| Shell y empresa activa | `src/components/AppShell.tsx` |

## Modelo
```ts
type Segment = {
  id: string;
  kind: "work" | "break";
  label: string;   // "Bloque 2 · Trabajo"
  start: number;   // epoch ms
  end: number | null;
};
```

## Comportamiento
- Tick de 1s solo mientras hay un segmento abierto.
- Recalculo en `visibilitychange`.
- Persistencia en `localStorage` (`TimeFlow.session.v1`) y rehidratación después del montaje para no romper el render en servidor.
- Acciones expuestas: `startWork`, `startBreak`, `finishDay`, `addManual`, `reset`.

## Migración a backend
1. Cada acción envía la transición con su marca de tiempo del cliente; el servidor valida contra su propio reloj con tolerancia.
2. `localStorage` pasa a ser caché optimista; ante conflicto gana el servidor.
3. Los bloques manuales quedan marcados con `origen = manual` para su revisión.

## Riesgos
- Reloj del cliente desfasado: el servidor sella la hora en cada transición.
- Doble pestaña abierta: sincronizar por evento `storage` y revalidar contra el servidor.
