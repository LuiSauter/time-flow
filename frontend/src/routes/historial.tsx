import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { AppShell, PageHeading, Segmented } from "@/components/AppShell";
import { PROJECTS, HISTORY, projectName, hm, isWeekday, shortDate, weekdayOf } from "@/lib/tracker";
import { requirePrivateSession } from "@/lib/route-guard";

export const Route = createFileRoute("/historial")({
  beforeLoad: requirePrivateSession,
  head: () => ({
    meta: [
      { title: "Historial de horas por día · TimeFlow" },
      {
        name: "description",
        content:
          "Filtra tu historial de jornadas por rango de fechas, proyecto y días hábiles, con totales acumulados.",
      },
      { property: "og:title", content: "Historial de horas por día · TimeFlow" },
      {
        property: "og:description",
        content: "Revisa horas activas, descansos y cumplimiento de meta día por día.",
      },
    ],
  }),
  component: HistorialPage,
});

function HistorialPage() {
  const [projectId, setProjectId] = useState(PROJECTS[0]!.id);
  const [range, setRange] = useState("mes");
  const [onlyWeekdays, setOnlyWeekdays] = useState(true);
  const [projectFilter, setProjectFilter] = useState("todos");

  const rows = useMemo(() => {
    const limit = range === "semana" ? 7 : range === "mes" ? 30 : 14;
    return HISTORY.filter((r) => (onlyWeekdays ? isWeekday(r.date) : true))
      .filter((r) => (projectFilter === "todos" ? true : r.projectId === projectFilter))
      .slice(0, limit);
  }, [range, onlyWeekdays, projectFilter]);

  const totalWork = rows.reduce((a, r) => a + r.workMinutes, 0);
  const totalBreak = rows.reduce((a, r) => a + r.breakMinutes, 0);

  return (
    <AppShell projectId={projectId} onProjectChange={setProjectId}>
      <PageHeading
        eyebrow="Historial"
        title="Horas registradas por día"
        aside={
          <Segmented
            value={range}
            onChange={setRange}
            options={[
              { value: "semana", label: "Semana" },
              { value: "mes", label: "Mes" },
              { value: "custom", label: "Personalizado" },
            ]}
          />
        }
      />

      <div className="rim flex flex-wrap items-center gap-3 rounded-[14px] bg-panel/70 px-4 py-3 backdrop-blur-sm">
        <label className="flex items-center gap-2 text-[13px] font-medium text-mute">
          <input
            type="checkbox"
            checked={onlyWeekdays}
            onChange={(e) => setOnlyWeekdays(e.target.checked)}
            className="size-3.5 accent-[var(--ink)]"
          />
          Filtrar solo Días Hábiles (L-V)
        </label>
        <span className="h-4 w-px bg-rim" />
        <span className="text-[12px] font-medium text-mute">Proyecto</span>
        <Segmented
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: "todas", label: "Todas" },
            ...PROJECTS.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
      </div>

      <div className="rim overflow-hidden rounded-[16px] bg-panel/60 ring-1 ring-black/5 backdrop-blur-sm">
        <div className="grid grid-cols-[110px_100px_1fr_90px_90px_120px_100px] gap-3 border-b border-rim px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
          <span>Fecha</span>
          <span>Día</span>
          <span>Proyecto</span>
          <span className="text-right">Activas</span>
          <span className="text-right">Descansos</span>
          <span className="text-right">Cumplimiento</span>
          <span className="text-right">Acciones</span>
        </div>
        <div className="divide-y divide-black/5">
          {rows.map((r) => {
            const ratio = r.workMinutes / r.goalMinutes;
            return (
              <div
                key={r.date}
                className="grid grid-cols-[110px_100px_1fr_90px_90px_120px_100px] items-center gap-3 px-5 py-3 text-[13px]"
              >
                <span className="font-clock tabular-nums text-mute">{shortDate(r.date)}</span>
                <span className="text-mute">{weekdayOf(r.date)}</span>
                <span className="font-medium">{projectName(r.projectId)}</span>
                <span className="text-right font-clock tabular-nums">{hm(r.workMinutes)}</span>
                <span className="text-right font-clock tabular-nums text-rest">
                  {hm(r.breakMinutes)}
                </span>
                <span className="flex items-center justify-end gap-2">
                  <span className="h-1.5 w-14 overflow-hidden rounded-full bg-black/5">
                    <span
                      className="block h-full rounded-full bg-work"
                      style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                    />
                  </span>
                  <span className="font-clock text-[12px] tabular-nums text-faint">
                    {Math.round(ratio * 100)}%
                  </span>
                </span>
                <span className="flex items-center justify-end gap-1 text-mute">
                  <Link
                    to="/detalle-diario"
                    className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/5"
                    title="Ver detalle"
                  >
                    <Eye className="size-3.5" />
                  </Link>
                  <button
                    className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/5"
                    title="Editar"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/5 hover:text-stop"
                    title="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-rim bg-paper/60 px-5 py-3.5">
          <span className="text-[13px] font-medium text-mute">
            {rows.length} días en el período filtrado
          </span>
          <span className="flex items-center gap-6">
            <span className="font-clock text-[13px] tabular-nums text-rest">
              Descansos {hm(totalBreak)}
            </span>
            <span className="font-clock text-[15px] font-medium tabular-nums">
              Total activo {hm(totalWork)}
            </span>
          </span>
        </div>
      </div>
    </AppShell>
  );
}
