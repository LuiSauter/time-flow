import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState, type FormEvent } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { AppShell, PageHeading, Segmented } from "@/components/AppShell";
import { hm, shortDate, weekdayOf } from "@/lib/tracker";
import type { HistoryPeriod, HistoryResponse } from "@/lib/tracker";
import { useHistory } from "@/hooks/useHistory";
import { useProjects } from "@/hooks/useProjects";
import { requirePrivateSession } from "@/lib/route-guard";

export const Route = createFileRoute("/historial")({
  beforeLoad: requirePrivateSession,
  head: () => ({
    meta: [
      { title: "Historial de horas por día · Time Flow" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content:
          "Filtra tu historial de jornadas por rango de fechas, proyecto y días hábiles, con totales acumulados.",
      },
      { property: "og:title", content: "Historial de horas por día · Time Flow" },
      {
        property: "og:description",
        content: "Revisa horas activas, descansos y cumplimiento de meta día por día.",
      },
    ],
  }),
  component: HistorialPage,
});

export function HistorialPage() {
  const { projects, activeProjectId, selectProject } = useProjects();
  const [period, setPeriod] = useState<HistoryPeriod>("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const customRangeError =
    period === "custom" ? validateCustomRange(customStartDate, customEndDate) : null;
  const {
    filters,
    setFilters,
    data,
    isLoading,
    isError,
    error,
    refetch,
    saveRate,
    saveDailyOverride,
    isSavingRate,
    isSavingDailyOverride,
    rateError,
    dailyOverrideError,
  } = useHistory(undefined, { enabled: customRangeError === null });
  const projectId = activeProjectId ?? projects[0]?.id ?? "";

  const changePeriod = (nextPeriod: string) => {
    if (!isHistoryPeriod(nextPeriod)) return;
    setPeriod(nextPeriod);
    setFilters((current) => ({
      ...current,
      period: nextPeriod,
      startDate: nextPeriod === "custom" ? customStartDate || undefined : undefined,
      endDate: nextPeriod === "custom" ? customEndDate || undefined : undefined,
    }));
  };

  const changeCustomDate = (field: "startDate" | "endDate", value: string) => {
    if (field === "startDate") setCustomStartDate(value);
    else setCustomEndDate(value);
    setFilters((current) => ({ ...current, period: "custom", [field]: value || undefined }));
  };

  const changeWeekdayFilter = (onlyWeekdays: boolean) => {
    setFilters((current) => ({ ...current, onlyWeekdays }));
  };

  const changeProjectFilter = (nextProjectId: string) => {
    setFilters((current) => ({
      ...current,
      projectId: nextProjectId === "todos" ? null : nextProjectId,
    }));
  };

  return (
    <AppShell projectId={projectId} onProjectChange={selectProject}>
      <PageHeading
        eyebrow="Historial"
        title="Horas registradas por día"
        aside={
          <Segmented
            value={filters.period}
            onChange={changePeriod}
            options={[
              { value: "week", label: "Semana" },
              { value: "month", label: "Mes" },
              { value: "custom", label: "Personalizado" },
            ]}
          />
        }
      />

      <div className="rim flex flex-wrap items-center gap-3 rounded-[14px] bg-panel/70 px-4 py-3 backdrop-blur-sm">
        <label className="flex items-center gap-2 text-[13px] font-medium text-mute">
          <input
            type="checkbox"
            checked={filters.onlyWeekdays}
            onChange={(e) => changeWeekdayFilter(e.target.checked)}
            className="size-3.5 accent-[var(--ink)]"
          />
          Filtrar solo Días Hábiles (L-V)
        </label>
        <span className="h-4 w-px bg-rim" />
        <span className="text-[12px] font-medium text-mute">Proyecto</span>
        <Segmented
          value={filters.projectId ?? "todos"}
          onChange={changeProjectFilter}
          options={[
            { value: "todos", label: "Todos" },
            ...projects.map((p) => ({ value: p.id, label: p.name })),
          ]}
        />
        {filters.period === "custom" ? (
          <div className="flex flex-wrap items-end gap-3 basis-full border-t border-rim pt-3">
            <label className="grid gap-1 text-[11px] font-medium text-faint">
              Fecha de inicio
              <input
                type="date"
                value={customStartDate}
                onChange={(event) => changeCustomDate("startDate", event.target.value)}
                className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-ink"
              />
            </label>
            <label className="grid gap-1 text-[11px] font-medium text-faint">
              Fecha de fin
              <input
                type="date"
                value={customEndDate}
                onChange={(event) => changeCustomDate("endDate", event.target.value)}
                className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-ink"
              />
            </label>
            {customRangeError ? (
              <p role="alert" className="text-[12px] text-stop">
                {customRangeError}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <RateSettings
        projects={projects}
        saveRate={saveRate}
        isSaving={isSavingRate}
        remoteError={rateError}
      />

      {isLoading ? (
        <p
          role="status"
          className="rounded-[16px] bg-panel/60 px-5 py-8 text-center text-sm text-mute"
        >
          Cargando historial...
        </p>
      ) : isError ? (
        <div role="alert" className="rounded-[16px] bg-panel/60 px-5 py-8 text-center">
          <p className="text-sm text-stop">{errorMessage(error)}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-4 rounded-lg bg-ink px-4 py-2 text-[13px] font-medium text-oncolor focus:ring-2 focus:ring-ink"
          >
            Reintentar
          </button>
        </div>
      ) : data ? (
        <HistoryTable
          history={data}
          saveDailyOverride={saveDailyOverride}
          isSaving={isSavingDailyOverride}
          remoteError={dailyOverrideError}
        />
      ) : null}
    </AppShell>
  );
}

function RateSettings({
  projects,
  saveRate,
  isSaving = false,
  remoteError,
}: {
  projects: { id: string; name: string; hourlyRate?: number | null }[];
  saveRate?: (input: { projectId: string; hourlyRate: number }) => Promise<unknown>;
  isSaving?: boolean;
  remoteError?: unknown;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [value, setValue] = useState(() => formatRate(projects[0]?.hourlyRate));
  const [error, setError] = useState<string | null>(null);
  const selectedProject = projects.find((project) => project.id === projectId);

  useEffect(() => {
    if (!selectedProject) {
      setProjectId(projects[0]?.id ?? "");
      return;
    }
    setValue(formatRate(selectedProject.hourlyRate));
  }, [projects, selectedProject]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hourlyRate = parseRate(value);
    if (hourlyRate === null) {
      setError("La tarifa debe ser un importe válido no negativo con hasta dos decimales.");
      return;
    }
    if (!saveRate || !projectId) return;
    setError(null);
    try {
      await saveRate({ projectId, hourlyRate });
    } catch (submissionError) {
      setError(errorMessage(submissionError));
    }
  };

  return (
    <section className="rim rounded-[14px] bg-panel/70 px-4 py-4 backdrop-blur-sm">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label htmlFor="history-rate-project" className="text-[11px] font-medium text-faint">
            Proyecto para tarifa base
          </label>
          <select
            id="history-rate-project"
            value={projectId}
            onChange={(event) => {
              setProjectId(event.target.value);
              setError(null);
            }}
            className="h-9 min-w-40 rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-ink"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <label htmlFor="history-hourly-rate" className="text-[11px] font-medium text-faint">
            Tarifa por hora (USD)
          </label>
          <input
            id="history-hourly-rate"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="h-9 w-28 rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-ink"
            disabled={isSaving}
          />
        </div>
        <button
          type="submit"
          disabled={isSaving || !projectId}
          className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-oncolor focus:ring-2 focus:ring-ink disabled:cursor-wait disabled:opacity-60"
        >
          {isSaving ? "Guardando..." : "Guardar tarifa base"}
        </button>
        {error || remoteError ? (
          <p role="alert" className="basis-full text-[12px] text-stop">
            {error ?? errorMessage(remoteError)}
          </p>
        ) : null}
      </form>
    </section>
  );
}

function HistoryTable({
  history,
  saveDailyOverride,
  isSaving = false,
  remoteError,
}: {
  history: HistoryResponse;
  saveDailyOverride?: (input: {
    projectId: string;
    date: string;
    hourlyRate: number;
  }) => Promise<unknown>;
  isSaving?: boolean;
  remoteError?: unknown;
}) {
  const { rows, totals } = history;
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideError, setOverrideError] = useState<string | null>(null);

  const editRow = (row: HistoryResponse["rows"][number]) => {
    setEditingRowKey(`${row.date}-${row.projectId}`);
    setOverrideValue(formatRate(row.hourlyRate));
    setOverrideError(null);
  };

  const submitOverride = async (
    event: FormEvent<HTMLFormElement>,
    row: HistoryResponse["rows"][number],
  ) => {
    event.preventDefault();
    const hourlyRate = parseRate(overrideValue);
    if (hourlyRate === null) {
      setOverrideError("La tarifa debe ser un importe válido no negativo con hasta dos decimales.");
      return;
    }
    if (!saveDailyOverride) return;
    setOverrideError(null);
    try {
      await saveDailyOverride({ projectId: row.projectId, date: row.date, hourlyRate });
      setEditingRowKey(null);
    } catch (submissionError) {
      setOverrideError(errorMessage(submissionError));
    }
  };
  return (
    <div className="rim overflow-x-auto rounded-[16px] bg-panel/60 ring-1 ring-black/5 backdrop-blur-sm">
      {rows.length === 0 ? (
        <p role="status" className="border-b border-rim px-5 py-8 text-center text-sm text-mute">
          No hay registros en el período seleccionado.
        </p>
      ) : null}
      <div className="min-w-[850px]">
        <div className="grid grid-cols-[110px_100px_1fr_90px_90px_120px_100px_100px] gap-3 border-b border-rim px-5 py-3 text-[11px] font-medium uppercase tracking-[0.12em] text-faint">
          <span>Fecha</span>
          <span>Día</span>
          <span>Proyecto</span>
          <span className="text-right">Activas</span>
          <span className="text-right">Descansos</span>
          <span className="text-right">Cumplimiento</span>
          <span className="text-right">Importe</span>
          <span className="text-right">Acciones</span>
        </div>
        <div className="divide-y divide-black/5">
          {rows.map((row) => {
            const percentage = row.goalMinutes
              ? Math.round((row.activeSeconds / (row.goalMinutes * 60)) * 100)
              : 0;
            return (
              <Fragment key={`${row.date}-${row.projectId}`}>
                <div className="grid grid-cols-[110px_100px_1fr_90px_90px_120px_100px_100px] items-center gap-3 px-5 py-3 text-[13px]">
                  <span className="font-clock tabular-nums text-mute">{shortDate(row.date)}</span>
                  <span className="text-mute">{weekdayOf(row.date)}</span>
                  <span className="font-medium">{row.projectName}</span>
                  <span className="text-right font-clock tabular-nums">
                    {hm(row.activeSeconds / 60)}
                  </span>
                  <span className="text-right font-clock tabular-nums text-rest">
                    {hm(row.breakSeconds / 60)}
                  </span>
                  <span className="flex items-center justify-end gap-2">
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-black/5">
                      <span
                        className="block h-full rounded-full bg-work"
                        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                      />
                    </span>
                    <span className="font-clock text-[12px] tabular-nums text-faint">
                      {percentage}%
                    </span>
                  </span>
                  <span className="text-right font-clock tabular-nums">
                    {row.amountUsd == null ? (
                      <span className="text-faint">Sin tarifa</span>
                    ) : (
                      formatUsd(row.amountUsd)
                    )}
                  </span>
                  <span className="flex items-center justify-end gap-1 text-mute">
                    <Link
                      to="/detalle-diario"
                      search={{ date: row.date, projectId: row.projectId }}
                      className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/5"
                      title="Ver detalle"
                    >
                      <Eye className="size-3.5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => editRow(row)}
                      className="grid size-7 place-items-center rounded-md transition-colors hover:bg-black/5"
                      title="Editar tarifa del día"
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
                {editingRowKey === `${row.date}-${row.projectId}` ? (
                  <form
                    className="grid grid-cols-[1fr_auto] items-end gap-3 border-t border-rim bg-paper/40 px-5 py-3"
                    onSubmit={(event) => void submitOverride(event, row)}
                  >
                    <label className="grid max-w-48 gap-1 text-[11px] font-medium text-faint">
                      Tarifa de excepción para {row.date}
                      <input
                        value={overrideValue}
                        onChange={(event) => setOverrideValue(event.target.value)}
                        inputMode="decimal"
                        className="h-9 rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-ink"
                        disabled={isSaving}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="h-9 rounded-lg bg-ink px-4 text-[13px] font-medium text-oncolor focus:ring-2 focus:ring-ink disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSaving ? "Guardando..." : "Guardar excepción"}
                    </button>
                    {overrideError || remoteError ? (
                      <p role="alert" className="col-span-2 text-[12px] text-stop">
                        {overrideError ?? errorMessage(remoteError)}
                      </p>
                    ) : null}
                  </form>
                ) : null}
              </Fragment>
            );
          })}
        </div>
        <div className="flex items-center justify-between border-t border-rim bg-paper/60 px-5 py-3.5">
          <span className="text-[13px] font-medium text-mute">
            {totals.days} días en el período filtrado
          </span>
          <span className="flex items-center gap-6">
            <span className="font-clock text-[13px] tabular-nums text-rest">
              Descansos {hm(totals.breakSeconds / 60)}
            </span>
            <span className="font-clock text-[15px] font-medium tabular-nums">
              Total activo {hm(totals.activeSeconds / 60)}
            </span>
            {totals.amountUsd != null ? (
              <span className="font-clock text-[15px] font-medium tabular-nums">
                Total USD {formatUsd(totals.amountUsd)}
              </span>
            ) : null}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatUsd(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function formatRate(rate: number | null | undefined) {
  return rate == null ? "" : rate.toFixed(2);
}

function parseRate(value: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const rate = Number(value);
  return Number.isFinite(rate) ? rate : null;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo cargar el historial.";
}

function isHistoryPeriod(value: string): value is HistoryPeriod {
  return value === "week" || value === "month" || value === "custom";
}

function validateCustomRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return "Selecciona ambas fechas para consultar el período.";
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "Introduce fechas válidas para el período personalizado.";
  }
  if (startDate > endDate) return "La fecha de inicio no puede ser posterior a la fecha de fin.";
  return null;
}

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}
