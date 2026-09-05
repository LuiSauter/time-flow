import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { TrackerPage } from "./index";

const mocks = vi.hoisted(() => ({
  useProjects: vi.fn(),
  useTimeTracker: vi.fn(),
}));

vi.mock("@/hooks/useProjects", () => ({ useProjects: mocks.useProjects }));
vi.mock("@/hooks/useTimeTracker", () => ({ useTimeTracker: mocks.useTimeTracker }));
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ session: null })),
  clearSession: vi.fn(),
}));
vi.mock("@/lib/route-guard", () => ({ requirePrivateSession: vi.fn() }));
vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageHeading: ({ title, aside }: { title: string; aside?: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {aside}
    </header>
  ),
  Segmented: ({
    options,
    onChange,
  }: {
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }) => (
    <div>
      {options.map((option) => (
        <button key={option.value} onClick={() => onChange(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));

const activeProject = {
  id: "remote-project",
  name: "Proyecto remoto",
  timeZone: "America/La_Paz",
  dailyGoalMinutes: 480,
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
};

function trackerState() {
  return {
    projectId: activeProject.id,
    status: "WORKING" as const,
    segments: [
      {
        id: "segment-1",
        kind: "work" as const,
        label: "Bloque persistido",
        start: Date.now() - 3_600_000,
        end: Date.now() - 1_800_000,
      },
    ],
    now: Date.now(),
    totals: { workSeconds: 3_600, breakSeconds: 1_800, currentSeconds: 0 },
    metrics: {
      activeSeconds: 3_600,
      workSeconds: 3_600,
      breakSeconds: 1_800,
      dailyGoalMinutes: 480,
      goalMet: false,
    },
    previousDay: {
      date: "2026-09-04",
      activeSeconds: 10_800,
      workSeconds: 10_800,
      breakSeconds: 0,
      dailyGoalMinutes: 480,
      goalMet: true,
    },
    isPending: false,
    error: null,
    startWork: vi.fn(),
    startBreak: vi.fn(),
    finishDay: vi.fn(),
    addManual: vi.fn(),
  };
}

describe("TrackerPage remote data", () => {
  beforeEach(() => {
    mocks.useProjects.mockReturnValue({
      activeProject,
      activeProjectId: activeProject.id,
      projects: [activeProject],
    });
    mocks.useTimeTracker.mockReturnValue(trackerState());
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders remote project, metrics and persisted sessions instead of demo data", () => {
    render(<TrackerPage />);

    expect(screen.getByText(/Proyecto remoto/)).toBeInTheDocument();
    expect(screen.getByText("Bloque persistido · Trabajo activo")).toBeInTheDocument();
    expect(screen.getByText("3h 00m")).toBeInTheDocument();
    expect(screen.queryByText("6h 45m")).not.toBeInTheDocument();
  });

  it("uses the active project and changes the previous-day scope", async () => {
    const user = userEvent.setup();
    render(<TrackerPage />);

    expect(mocks.useTimeTracker).toHaveBeenCalledWith(activeProject.id, "business");
    await user.click(screen.getByRole("button", { name: "Todos los días (L-D)" }));

    expect(mocks.useTimeTracker).toHaveBeenLastCalledWith(activeProject.id, "all");
  });

  it("delegates tracker actions to the remote hook", async () => {
    const user = userEvent.setup();
    const tracker = trackerState();
    mocks.useTimeTracker.mockReturnValue(tracker);
    render(<TrackerPage />);

    await user.click(screen.getByRole("button", { name: "Iniciar Descanso" }));
    expect(tracker.startBreak).toHaveBeenCalledOnce();
  });
});
