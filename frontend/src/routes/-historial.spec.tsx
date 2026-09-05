import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { vi } from "vitest";
import { HistorialPage } from "./historial";

const mocks = vi.hoisted(() => ({
  useHistory: vi.fn(),
  useProjects: vi.fn(),
  lastFilters: null as Record<string, unknown> | null,
  lastEnabled: true,
  historyState: {
    isLoading: false,
    isError: false,
    error: null as Error | null,
  },
}));

vi.mock("@/hooks/useProjects", () => ({ useProjects: mocks.useProjects }));
vi.mock("@/hooks/useHistory", () => ({
  useHistory: mocks.useHistory,
}));
vi.mock("@/lib/route-guard", () => ({ requirePrivateSession: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
  createFileRoute: () => (options: unknown) => options,
}));
vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeading: ({ title, aside }: { title: string; aside?: ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {aside}
    </header>
  ),
  Segmented: ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
  }) => (
    <div>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

const projects = [
  { id: "project-1", name: "Nuxio" },
  { id: "project-2", name: "Focus" },
];

describe("HistorialPage filters", () => {
  beforeEach(() => {
    mocks.useProjects.mockReturnValue({
      projects,
      activeProjectId: "project-1",
      activeProject: projects[0],
    });
    mocks.historyState = { isLoading: false, isError: false, error: null };
    mocks.useHistory.mockImplementation((initialFilters = undefined, options = {}) => {
      const [filters, setFilters] = useState(
        initialFilters ?? { period: "month", onlyWeekdays: true, projectId: null },
      );
      mocks.lastFilters = filters;
      mocks.lastEnabled = options.enabled ?? true;
      return {
        filters,
        setFilters,
        ...mocks.historyState,
        isSuccess: !mocks.historyState.isLoading && !mocks.historyState.isError,
        data: { rows: [], totals: { days: 0, workSeconds: 0, breakSeconds: 0, activeSeconds: 0 } },
      };
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("changes period, weekday and project filters", async () => {
    const user = userEvent.setup();
    render(<HistorialPage />);

    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(mocks.lastFilters).toMatchObject({
      period: "week",
      onlyWeekdays: true,
      projectId: null,
    });

    await user.click(screen.getByRole("checkbox", { name: /solo días hábiles/i }));
    expect(mocks.lastFilters).toMatchObject({
      period: "week",
      onlyWeekdays: false,
      projectId: null,
    });

    await user.click(screen.getByRole("button", { name: "Focus" }));
    expect(mocks.lastFilters).toMatchObject({
      period: "week",
      onlyWeekdays: false,
      projectId: "project-2",
    });
  });

  it("shows custom dates and queries an inclusive one-day range", async () => {
    const user = userEvent.setup();
    render(<HistorialPage />);

    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    const start = screen.getByLabelText("Fecha de inicio");
    const end = screen.getByLabelText("Fecha de fin");
    await user.type(start, "2026-09-05");
    await user.type(end, "2026-09-05");

    expect(mocks.lastEnabled).toBe(true);
    expect(mocks.lastFilters).toMatchObject({
      period: "custom",
      startDate: "2026-09-05",
      endDate: "2026-09-05",
    });
  });

  it("does not enable a query for incomplete or inverted custom ranges", async () => {
    const user = userEvent.setup();
    render(<HistorialPage />);

    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    expect(mocks.lastEnabled).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("Selecciona ambas fechas");

    await user.type(screen.getByLabelText("Fecha de inicio"), "2026-09-05");
    await user.type(screen.getByLabelText("Fecha de fin"), "2026-09-01");

    expect(mocks.lastEnabled).toBe(false);
    expect(screen.getByRole("alert")).toHaveTextContent("posterior");
    expect(screen.getByLabelText("Fecha de inicio")).toHaveValue("2026-09-05");
    expect(screen.getByLabelText("Fecha de fin")).toHaveValue("2026-09-01");
  });

  it("keeps the selected filters visible while history is loading or fails", async () => {
    const user = userEvent.setup();
    mocks.historyState = { isLoading: true, isError: false, error: null };
    const { rerender } = render(<HistorialPage />);

    await user.click(screen.getByRole("button", { name: "Semana" }));
    expect(mocks.lastFilters).toMatchObject({ period: "week" });
    expect(screen.getByRole("button", { name: "Semana" })).toHaveAttribute("aria-pressed", "true");

    mocks.historyState = {
      isLoading: false,
      isError: true,
      error: new Error("No se pudo cargar el historial"),
    };
    rerender(<HistorialPage />);

    expect(mocks.lastFilters).toMatchObject({ period: "week" });
    expect(screen.getByRole("button", { name: "Semana" })).toHaveAttribute("aria-pressed", "true");
  });
});
