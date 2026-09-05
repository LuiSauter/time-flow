import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { HistoryResponse } from "@/lib/tracker";
import { HistorialPage } from "./historial";

const mocks = vi.hoisted(() => ({
  useHistory: vi.fn(),
  useProjects: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("@/hooks/useHistory", () => ({ useHistory: mocks.useHistory }));
vi.mock("@/hooks/useProjects", () => ({ useProjects: mocks.useProjects }));
vi.mock("@/lib/route-guard", () => ({ requirePrivateSession: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    search,
    title,
  }: {
    children: ReactNode;
    search?: Record<string, string>;
    title?: string;
  }) => (
    <a href="#" title={title} data-search={JSON.stringify(search)}>
      {children}
    </a>
  ),
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
        <button key={option.value} type="button" onClick={() => onChange(option.value)}>
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

describe("HistorialPage remote rendering", () => {
  beforeEach(() => {
    mocks.useProjects.mockReturnValue({
      projects,
      activeProjectId: "project-1",
      activeProject: projects[0],
      selectProject: vi.fn(),
    });
    mocks.refetch.mockReset();
  });

  afterEach(() => vi.restoreAllMocks());

  it("renders remote rows with active time, breaks, compliance and conditional amounts", () => {
    renderPage({
      rows: [
        {
          date: "2026-09-05",
          projectId: "project-1",
          projectName: "Nuxio",
          workSeconds: 14_400,
          breakSeconds: 1_800,
          activeSeconds: 14_400,
          goalMinutes: 480,
          goalMet: false,
          hourlyRate: 25,
          rateSource: "base",
          amountUsd: 100,
        },
        {
          date: "2026-09-04",
          projectId: "project-2",
          projectName: "Focus",
          workSeconds: 3_600,
          breakSeconds: 0,
          activeSeconds: 3_600,
          goalMinutes: 480,
          goalMet: false,
          hourlyRate: null,
          rateSource: null,
          amountUsd: null,
        },
      ],
      totals: {
        days: 2,
        workSeconds: 18_000,
        breakSeconds: 1_800,
        activeSeconds: 18_000,
        amountUsd: 100,
      },
    });

    expect(screen.getAllByText("Nuxio")).not.toHaveLength(0);
    expect(screen.getAllByText("Focus")).not.toHaveLength(0);
    expect(screen.getAllByTitle("Ver detalle")[0]).toHaveAttribute(
      "data-search",
      JSON.stringify({ date: "2026-09-05", projectId: "project-1" }),
    );
    expect(screen.getByText("4h 00m")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getAllByText("$100.00")).toHaveLength(1);
    expect(screen.getByText(/Total USD/)).toHaveTextContent("$100.00");
    expect(screen.getByText("2 días en el período filtrado")).toBeInTheDocument();
  });

  it("renders a zero-rate amount and hides the monetary summary when no row has a rate", () => {
    const zeroRate: HistoryResponse = {
      rows: [
        {
          date: "2026-09-05",
          projectId: "project-1",
          projectName: "Nuxio",
          workSeconds: 0,
          breakSeconds: 0,
          activeSeconds: 0,
          goalMinutes: 480,
          goalMet: false,
          hourlyRate: 0,
          rateSource: "base",
          amountUsd: 0,
        },
      ],
      totals: { days: 1, workSeconds: 0, breakSeconds: 0, activeSeconds: 0, amountUsd: 0 },
    };
    renderPage(zeroRate);
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.getByText(/Total USD/)).toHaveTextContent("$0.00");

    cleanup();
    renderPage({
      ...zeroRate,
      rows: [{ ...zeroRate.rows[0]!, hourlyRate: null, rateSource: null, amountUsd: null }],
      totals: { ...zeroRate.totals, amountUsd: null },
    });
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
    expect(screen.queryByText(/Total USD/)).not.toBeInTheDocument();
  });

  it("renders empty, loading and error states with zero totals and retry", async () => {
    const empty: HistoryResponse = {
      rows: [],
      totals: { days: 0, workSeconds: 0, breakSeconds: 0, activeSeconds: 0, amountUsd: null },
    };
    renderPage(empty);
    expect(screen.getByRole("status")).toHaveTextContent("No hay registros");
    expect(screen.getByText("0 días en el período filtrado")).toBeInTheDocument();
    expect(screen.queryByText(/Total USD/)).not.toBeInTheDocument();

    cleanup();
    mocks.useHistory.mockReturnValue(historyState({ isLoading: true, data: undefined }));
    const { rerender } = render(<HistorialPage />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando historial");

    mocks.useHistory.mockReturnValue(
      historyState({
        isError: true,
        error: new Error("No se pudo cargar el historial"),
        data: undefined,
      }),
    );
    rerender(<HistorialPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar el historial");
    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));
    expect(mocks.refetch).toHaveBeenCalledOnce();
  });
});

function renderPage(data: HistoryResponse) {
  mocks.useHistory.mockReturnValue(historyState({ data }));
  return render(<HistorialPage />);
}

function historyState(overrides: Record<string, unknown> = {}) {
  return {
    filters: { period: "month", onlyWeekdays: true, projectId: null },
    setFilters: vi.fn(),
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: mocks.refetch,
    ...overrides,
  };
}
