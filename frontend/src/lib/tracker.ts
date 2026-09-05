import { apiRequest } from "./auth";

export type TimerStatus = "IDLE" | "WORKING" | "PAUSED";

export type ApiProject = {
  id: string;
  name: string;
  timeZone: string;
  dailyGoalMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type ApiSegment = {
  id: string;
  kind: "work" | "break";
  label: string;
  start: string;
  end: string | null;
};

export type TrackerMetrics = {
  activeSeconds: number;
  workSeconds: number;
  breakSeconds: number;
  dailyGoalMinutes: number;
  goalMet: boolean;
};

export type TrackerDaySummary = TrackerMetrics & { date: string };

export type TrackerSnapshot = {
  project: Pick<ApiProject, "id" | "name" | "timeZone" | "dailyGoalMinutes">;
  status: TimerStatus;
  openSessionId: string | null;
  segments: ApiSegment[];
  metrics: TrackerMetrics;
  previousDay: TrackerDaySummary;
};

export type PreviousDayScope = "all" | "business";

export type CreateProjectInput = {
  name: string;
  timeZone: string;
};

export type ManualEntryInput = {
  date: string;
  startTime: string;
  endTime: string;
};

export function getProjects(accessToken: string) {
  return apiRequest<ApiProject[]>("/projects", { accessToken });
}

export function createProject(accessToken: string, input: CreateProjectInput) {
  return apiRequest<ApiProject>("/projects", {
    accessToken,
    method: "POST",
    body: input,
  });
}

export function getTracker(
  accessToken: string,
  projectId: string,
  previousDayScope: PreviousDayScope = "all",
) {
  const query = new URLSearchParams({ previousDayScope }).toString();
  return apiRequest<TrackerSnapshot>(
    `/projects/${encodeURIComponent(projectId)}/tracker?${query}`,
    { accessToken },
  );
}

function trackerMutation(accessToken: string, projectId: string, action: string) {
  return apiRequest<TrackerSnapshot>(
    `/projects/${encodeURIComponent(projectId)}/tracker/${action}`,
    { accessToken, method: "POST" },
  );
}

export function startTracker(accessToken: string, projectId: string) {
  return trackerMutation(accessToken, projectId, "start");
}

export function pauseTracker(accessToken: string, projectId: string) {
  return trackerMutation(accessToken, projectId, "break");
}

export function resumeTracker(accessToken: string, projectId: string) {
  return trackerMutation(accessToken, projectId, "resume");
}

export function finishTracker(accessToken: string, projectId: string) {
  return trackerMutation(accessToken, projectId, "finish");
}

export function addManualEntry(accessToken: string, projectId: string, input: ManualEntryInput) {
  return apiRequest<TrackerSnapshot>(`/projects/${encodeURIComponent(projectId)}/manual-entries`, {
    accessToken,
    method: "POST",
    body: input,
  });
}

export type Project = {
  id: string;
  name: string;
  dailyGoalMinutes: number;
};

export type Segment = {
  id: string;
  kind: "work" | "break";
  label: string;
  /** epoch ms */
  start: number;
  /** epoch ms, null when running */
  end: number | null;
};

export type DayRecord = {
  date: string; // yyyy-mm-dd
  projectId: string;
  workMinutes: number;
  breakMinutes: number;
  goalMinutes: number;
  segments: { kind: "work" | "break"; label: string; from: string; to: string }[];
};

export const PROJECTS: Project[] = [
  { id: "nuxio", name: "Nuxio", dailyGoalMinutes: 480 },
  { id: "focus", name: "Focus", dailyGoalMinutes: 360 },
];

export const WEEKDAY_ES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const MONTH_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function longDate(d: Date) {
  return `${WEEKDAY_ES[d.getDay()]}, ${d.getDate()} de ${MONTH_ES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function shortDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return `${String(d).padStart(2, "0")} ${MONTH_ES[m - 1]!.slice(0, 3)} ${y}`;
}

export function weekdayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  return WEEKDAY_ES[new Date(y, m - 1, d).getDay()];
}

export function isWeekday(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const wd = new Date(y, m - 1, d).getDay();
  return wd >= 1 && wd <= 5;
}

/** 12345 -> "03:25:45" */
export function hms(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** 195 -> "3h 15m" */
export function hm(totalMinutes: number) {
  const m = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest}m`;
  return `${h}h ${String(rest).padStart(2, "0")}m`;
}

export function clockOf(ms: number) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Deterministic demo history for the last 30 days. */
export const HISTORY: DayRecord[] = (() => {
  const out: DayRecord[] = [];
  const today = new Date(2026, 8, 1);
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = iso(d);
    const weekend = !isWeekday(key);
    const projectId = i % 4 === 0 ? "focus" : "nuxio";
    const goal = projectId === "nuxio" ? 480 : 360;
    const base = weekend ? 95 : 400 + ((i * 37) % 90);
    const work = weekend && i % 3 !== 0 ? 0 : base;
    if (work === 0) continue;
    const brk = weekend ? 15 : 30 + ((i * 13) % 40);
    out.push({
      date: key,
      projectId,
      workMinutes: work,
      breakMinutes: brk,
      goalMinutes: goal,
      segments: [
        { kind: "work", label: "Bloque 1 · Trabajo", from: "08:30", to: "12:30" },
        { kind: "break", label: "Descanso 1 · Almuerzo", from: "12:30", to: "13:15" },
        { kind: "work", label: "Bloque 2 · Trabajo", from: "13:15", to: "17:00" },
      ],
    });
  }
  return out;
})();

export function projectName(id: string) {
  return PROJECTS.find((p) => p.id === id)?.name ?? id;
}
