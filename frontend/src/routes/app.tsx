import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { AppShell, PageHeading, Segmented } from "@/components/AppShell";
import { useTimeTracker } from "@/hooks/useTimeTracker";
import { useProjects } from "@/hooks/useProjects";
import { clockOf, hm, hms, longDate } from "@/lib/tracker";
import type { ManualEntryInput } from "@/lib/tracker";
import { requirePrivateSession } from "@/lib/route-guard";

export const Route = createFileRoute("/app")({
  beforeLoad: requirePrivateSession,
  head: () => ({
    meta: [
      { title: "Time Flow · Cronómetro de jornada en tiempo real" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Controla tu jornada activa, descansos y límite diario por proyecto con un cronómetro en tiempo real.",
      },
      { property: "og:title", content: "Time Flow · Cronómetro de jornada en tiempo real" },
      {
        property: "og:description",
        content:
          "Controla tu jornada activa, descansos y límite diario por proyecto con un cronómetro en tiempo real.",
      },
    ],
  }),
  component: TrackerPage,
});

function MetricCard({
  label,
  value,
  hint,
  tone,
  right,
  progress,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "work" | "rest";
  right?: string;
  progress?: number;
}) {
  const toneClass = tone === "work" ? "text-work" : tone === "rest" ? "text-rest" : "text-ink";
  return (
    <div className="rim rounded-[14px] bg-panel/70 px-4 py-3.5 backdrop-blur-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium text-mute">{label}</span>
        {right ? (
          <span className="font-clock text-[12px] tabular-nums text-faint">{right}</span>
        ) : null}
      </div>
      <div
        className={`mt-1 font-clock text-[26px] font-medium tabular-nums tracking-tight ${toneClass}`}
      >
        {value}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-faint">{hint}</div> : null}
      {progress !== undefined ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
          <div
            className="h-full rounded-full bg-work"
            style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export function TrackerPage() {
  const { activeProject, activeProjectId } = useProjects();
  const [dayFilter, setDayFilter] = useState("habiles");
  const previousDayScope = dayFilter === "todos" ? "all" : "business";
  const tracker = useTimeTracker(activeProjectId ?? "", previousDayScope);
  const project = activeProject;
  const today = useMemo(() => new Date(), []);

  if (!project) {
    return (
      <AppShell projectId="" onProjectChange={() => undefined}>
        <div className="rounded-[16px] bg-panel/60 p-6 text-[13px] text-mute">
          Cargando proyecto...
        </div>
      </AppShell>
    );
  }

  const workMinutes = (tracker.metrics?.workSeconds ?? tracker.totals.workSeconds) / 60;
  const breakMinutes = (tracker.metrics?.breakSeconds ?? tracker.totals.breakSeconds) / 60;
  const goalMinutes = tracker.metrics?.dailyGoalMinutes ?? project.dailyGoalMinutes;
  const goalRatio = workMinutes / goalMinutes;

  const badge =
    tracker.status === "WORKING"
      ? { text: "TRABAJANDO", cls: "bg-work/10 text-work ring-work/20", dot: "bg-work dotwork" }
      : tracker.status === "PAUSED"
        ? { text: "EN DESCANSO", cls: "bg-rest/10 text-rest ring-rest/20", dot: "bg-rest" }
        : { text: "DETENIDO", cls: "bg-black/5 text-mute ring-black/10", dot: "bg-faint" };

  const mainClock =
    tracker.status === "PAUSED"
      ? hms(tracker.totals.workSeconds)
      : hms(tracker.status === "IDLE" ? tracker.totals.workSeconds : tracker.totals.workSeconds);

  const [hh, mm, ss] = mainClock.split(":");

  return (
    <AppShell projectId={project.id} onProjectChange={() => undefined}>
      <PageHeading
        eyebrow="Hoy"
        title={longDate(today)}
        aside={
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-medium text-mute">Filtro</span>
            <Segmented
              value={dayFilter}
              onChange={setDayFilter}
              options={[
                { value: "habiles", label: "Días hábiles (L-V)" },
                { value: "todos", label: "Todos los días (L-D)" },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Ayer"
          value={hm((tracker.previousDay?.activeSeconds ?? 0) / 60)}
          hint={tracker.previousDay?.goalMet ? "Cumplió meta" : "No cumplió meta"}
        />
        <MetricCard
          label="Hoy · en curso"
          value={hm(workMinutes)}
          tone="work"
          hint={`${tracker.segments.filter((s) => s.kind === "work").length} bloques activos`}
        />
        <MetricCard
          label="Descanso hoy"
          value={hm(breakMinutes)}
          tone="rest"
          hint={`${tracker.segments.filter((s) => s.kind === "break").length} pausas registradas`}
        />
        <MetricCard
          label="Límite diario"
          right={hm(goalMinutes)}
          value={hm(workMinutes)}
          progress={goalRatio}
        />
      </div>

      <section className="rim rounded-[20px] bg-panel/60 px-6 py-8 ring-1 ring-black/5 backdrop-blur-md md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-7 items-center gap-2 rounded-full px-3 text-[12px] font-semibold tracking-wide ring-1 ${badge.cls}`}
              >
                <span className={`size-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>
              <span className="text-[12px] text-faint">
                {tracker.status === "IDLE" ? "Sin sesión activa" : "Sesión activa"} · {project.name}
              </span>
            </div>

            <div
              className={`mt-3 font-clock text-[clamp(3.5rem,11vw,8rem)] font-medium leading-none tabular-nums tracking-tighter ${
                tracker.status === "WORKING" ? "tick" : ""
              }`}
            >
              <span className="text-ink">{hh}</span>
              <span className="text-faint">:</span>
              <span className="text-ink">{mm}</span>
              <span className="text-faint">:</span>
              <span className="text-ink">{ss}</span>
            </div>
            <div className="mt-2 font-clock text-[13px] tabular-nums tracking-[0.2em] text-faint">
              HORAS : MINUTOS : SEGUNDOS
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2.5 md:w-[260px]">
            {tracker.status === "IDLE" ? (
              <button
                onClick={tracker.startWork}
                disabled={tracker.isPending}
                className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-work text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
              >
                Comenzar a Trabajar
              </button>
            ) : null}

            {tracker.status === "WORKING" ? (
              <>
                <button
                  onClick={tracker.startBreak}
                  disabled={tracker.isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-rest text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
                >
                  Iniciar Descanso
                </button>
                <button
                  onClick={tracker.finishDay}
                  disabled={tracker.isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-stop text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
                >
                  Finalizar Jornada y Guardar
                </button>
              </>
            ) : null}

            {tracker.status === "PAUSED" ? (
              <>
                <button
                  onClick={tracker.startWork}
                  disabled={tracker.isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-work text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
                >
                  Reanudar Trabajo
                </button>
                <button
                  onClick={tracker.finishDay}
                  disabled={tracker.isPending}
                  className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-stop text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
                >
                  Finalizar Jornada y Guardar
                </button>
                <div className="mt-1 rounded-[12px] bg-paper px-3.5 py-2.5 ring-1 ring-black/5">
                  <div className="text-[11px] font-medium text-mute">Tiempo en descanso actual</div>
                  <div className="font-clock text-[18px] tabular-nums tracking-tight text-rest">
                    {hms(tracker.totals.currentSeconds)}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>

      {tracker.error ? (
        <p role="alert" className="text-[13px] text-stop">
          {tracker.error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rim overflow-hidden rounded-[16px] bg-panel/60 ring-1 ring-black/5 backdrop-blur-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-rim px-5 py-3.5">
            <h2 className="text-[14px] font-semibold tracking-tight">Sesiones del día</h2>
            <span className="font-clock text-[12px] tabular-nums text-faint">
              {tracker.segments.length} bloques
            </span>
          </div>
          <div className="divide-y divide-black/5">
            {tracker.segments.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13px] text-faint">
                Aún no hay bloques hoy. Pulsa «Comenzar a Trabajar» para abrir el primero.
              </p>
            ) : (
              tracker.segments.map((s) => {
                const running = s.end === null;
                const seconds = ((s.end ?? tracker.now) - s.start) / 1000;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 px-5 py-3 ${running ? "bg-work/5" : ""}`}
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        s.kind === "work" ? "bg-work" : "bg-rest"
                      } ${running ? "dotwork" : ""}`}
                    />
                    <span className="w-[112px] shrink-0 font-clock text-[13px] tabular-nums text-mute">
                      {clockOf(s.start)} – {running ? "En curso" : clockOf(s.end!)}
                    </span>
                    <span className="text-[13px] font-medium">
                      {s.label} · {s.kind === "work" ? "Trabajo activo" : "Descanso"}
                    </span>
                    <span
                      className={`ml-auto font-clock text-[13px] tabular-nums ${
                        running ? "text-work" : "text-ink"
                      }`}
                    >
                      {running ? hms(seconds) : hm(seconds / 60)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <ManualEntryCard onAdd={tracker.addManual} />
      </div>
    </AppShell>
  );
}

export function ManualEntryCard({
  onAdd,
}: {
  onAdd: (input: ManualEntryInput) => Promise<unknown>;
}) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [from, setFrom] = useState("15:30");
  const [to, setTo] = useState("16:15");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!date || !from || !to) {
      setError("Completa todos los campos");
      return;
    }
    if (to <= from) {
      setError("La hora de fin debe ser posterior a la de inicio");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onAdd({ date, startTime: from, endTime: to });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "No se pudo guardar el registro",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rim flex flex-col rounded-[16px] bg-panel/60 p-5 ring-1 ring-black/5 backdrop-blur-sm"
    >
      <h2 className="text-[14px] font-semibold tracking-tight">Registro manual</h2>
      <p className="mt-1 max-w-[30ch] text-pretty text-[13px] text-mute">
        Captura horas que no se registraron en tiempo real. Sin límite de entradas.
      </p>
      <div className="mt-4 grid gap-2">
        <label
          htmlFor="manual-date"
          className="rounded-[10px] bg-paper px-3 py-2.5 ring-1 ring-black/5"
        >
          <span className="block text-[11px] font-medium text-faint">Fecha</span>
          <input
            id="manual-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent font-clock text-[13px] tabular-nums outline-none"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label
            htmlFor="manual-start"
            className="rounded-[10px] bg-paper px-3 py-2.5 ring-1 ring-black/5"
          >
            <span className="block text-[11px] font-medium text-faint">Inicio</span>
            <input
              id="manual-start"
              type="time"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-transparent font-clock text-[13px] tabular-nums outline-none"
            />
          </label>
          <label
            htmlFor="manual-end"
            className="rounded-[10px] bg-paper px-3 py-2.5 ring-1 ring-black/5"
          >
            <span className="block text-[11px] font-medium text-faint">Fin</span>
            <input
              id="manual-end"
              type="time"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent font-clock text-[13px] tabular-nums outline-none"
            />
          </label>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-[12px] text-stop">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 flex h-11 items-center justify-center gap-2 rounded-[12px] bg-ink text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="size-4" />
        {isSubmitting ? "Guardando..." : "Registrar Horas Manualmente"}
      </button>
    </form>
  );
}
