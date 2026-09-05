# Plan · 004 Detalle diario

## Enfoque
Render puro a partir de la lista de segmentos del día. El timeline se calcula normalizando cada tramo contra 1440 minutos.

## Piezas
| Pieza | Archivo |
|---|---|
| Pantalla, timeline y desglose | `src/routes/detalle-diario.tsx` |
| Datos y formato | `src/lib/tracker.ts` |

## Cálculo del timeline
1. Ordenar segmentos por hora de inicio.
2. Insertar tramos de inactividad en los huecos, incluidos el inicial y el final.
3. Cada tramo aporta `minutos / 1440` de ancho (alto en móvil).
4. Redondear el último tramo para que el total cierre exactamente.

## Migración a backend
- `GET /days/:date?companyId` devuelve resumen + segmentos con `origen` y notas.
- El ajuste manual se envía como propuesta de corrección y queda pendiente de aprobación (ver 006).

## Riesgos
- Tramos de pocos segundos invisibles en pantalla: aplicar un ancho mínimo visual sin alterar los totales.
- Cambios de horario de verano: calcular sobre marcas absolutas y formatear en la zona de la empresa.
