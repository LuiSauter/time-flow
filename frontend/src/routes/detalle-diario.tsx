import { createFileRoute } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { hm } from "@/lib/tracker";
import { useHistory } from "@/hooks/useHistory";
import { useProjects } from "@/hooks/useProjects";
import { requirePrivateSession } from "@/lib/route-guard";

export const Route = createFileRoute("/detalle-diario")({
  beforeLoad: requirePrivateSession,
  validateSearch: (search: Record<string, unknown>): DetailSearch => ({
    date: typeof search.date === "string" ? search.date : "",
    projectId: typeof search.projectId === "string" ? search.projectId : "",
  }),
  head: () => ({
    meta: [
      { title: "Detalle de horas y descansos del día · Time Flow" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Línea de tiempo de 24 horas con bloques de trabajo activo, descansos e inactividad del día seleccionado.",
      },
      { property: "og:title", content: "Detalle de horas y descansos del día · Time Flow" },
      {
        property: "og:description",
        content: "Revisa y ajusta cada bloque de trabajo y descanso del día.",
      },
    ],
  }),
  component: DetallePage,
});

type Entry = { kind: "work" | "break"; label: string; from: string; to: string; minutes: number };
type DetailSearch = { date: string; projectId: string };

const ENTRIES: Entry[] = [
  { kind: "work", label: "Bloque 1 · Trabajo", from: "08:30", to: "12:30", minutes: 240 },
  { kind: "break", label: "Descanso 1 · Almuerzo", from: "12:30", to: "13:15", minutes: 45 },
  { kind: "work", label: "Bloque 2 · Trabajo", from: "13:15", to: "17:00", minutes: 225 },
];

const toPct = (t: string) => {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return ((h * 60 + m) / 1440) * 100;
};

export function DetallePage() {
  const { date, projectId } = Route.useSearch();
  const { projects, selectProject } = useProjects();
  const project = projects.find((item) => item.id === projectId);
  const validContext = Boolean(date && /^\d{4}-\d{2}-\d{2}$/.test(date) && project);
  const history = useHistory(
    {
      period: "custom",
      startDate: date,
      endDate: date,
      onlyWeekdays: false,
      projectId,
    },
    { enabled: validContext },
  );
  const row = history.data?.rows.find((item) => item.date === date && item.projectId === projectId);
  const totalWork = row ? row.activeSeconds / 60 : 0;
  const totalBreak = row ? row.breakSeconds / 60 : 0;
  const titleDate = validContext
    ? new Intl.DateTimeFormat("es-ES", { dateStyle: "long" }).format(new Date(`${date}T12:00:00`))
    : "Contexto no válido";

  return (
    <AppShell projectId={projectId} onProjectChange={selectProject}>
      <PageHeading
        eyebrow="Detalle diario"
        title={`${titleDate} · ${project?.name ?? "Proyecto desconocido"}`}
        aside={
          <div className="flex items-center gap-6">
            <span className="text-right">
              <span className="block text-[11px] font-medium text-mute">Trabajo activo</span>
              <span className="block font-clock text-[20px] tabular-nums text-work">
                {hm(totalWork)}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-[11px] font-medium text-mute">Descansos</span>
              <span className="block font-clock text-[20px] tabular-nums text-rest">
                {hm(totalBreak)}
              </span>
            </span>
          </div>
        }
      />

      {!validContext ? (
        <p role="alert" className="rim rounded-[16px] bg-panel/60 p-5 text-sm text-stop">
          La fecha o el proyecto no son válidos o el proyecto no está autorizado.
        </p>
      ) : history.isLoading ? (
        <p role="status" className="rim rounded-[16px] bg-panel/60 p-5 text-sm text-mute">
          Cargando detalle...
        </p>
      ) : history.isError ? (
        <p role="alert" className="rim rounded-[16px] bg-panel/60 p-5 text-sm text-stop">
          No se pudo cargar el detalle diario.
        </p>
      ) : !row ? (
        <p className="rim rounded-[16px] bg-panel/60 p-5 text-sm text-mute">
          No hay registros para este día y proyecto.
        </p>
      ) : null}

      {row ? (
        <section className="rim rounded-[16px] bg-panel/60 p-5 ring-1 ring-black/5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-semibold tracking-tight">Línea de tiempo · 24 horas</h2>
            <div className="flex items-center gap-4 text-[11px] text-mute">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-work" />
                Trabajo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rest" />
                Descanso
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-rim" />
                Inactivo
              </span>
            </div>
          </div>

          <div className="relative mt-5 h-9 overflow-hidden rounded-[10px] bg-rim/60">
            {ENTRIES.map((e) => (
              <span
                key={e.label}
                title={`${e.label} · ${e.from}–${e.to}`}
                className={`absolute inset-y-0 ${e.kind === "work" ? "bg-work" : "bg-rest"}`}
                style={{ left: `${toPct(e.from)}%`, width: `${toPct(e.to) - toPct(e.from)}%` }}
              />
            ))}
          </div>
          <div className="mt-2.5 flex justify-between font-clock text-[11px] tabular-nums text-faint">
            {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>
      ) : null}

      {row ? (
        <section className="rim overflow-hidden rounded-[16px] bg-panel/60 ring-1 ring-black/5 backdrop-blur-sm">
          <div className="border-b border-rim px-5 py-3.5">
            <h2 className="text-[14px] font-semibold tracking-tight">Desglose cronológico</h2>
          </div>
          <div className="divide-y divide-black/5">
            {ENTRIES.map((e) => (
              <div key={e.label} className="flex items-center gap-4 px-5 py-3.5">
                <span
                  className={`size-2 shrink-0 rounded-full ${e.kind === "work" ? "bg-work" : "bg-rest"}`}
                />
                <span className="w-[130px] shrink-0 font-clock text-[13px] tabular-nums text-mute">
                  {e.from} – {e.to}
                </span>
                <span className="text-[13px] font-medium">{e.label}</span>
                <span className="ml-auto font-clock text-[13px] tabular-nums">{hm(e.minutes)}</span>
                <button
                  className="ml-4 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-mute transition-colors hover:bg-black/5"
                  title="Edición rápida"
                >
                  <Pencil className="size-3.5" />
                  Ajustar
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
