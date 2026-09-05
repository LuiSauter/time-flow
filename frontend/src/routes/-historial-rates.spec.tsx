import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { vi } from "vitest";
import type { HistoryResponse } from "@/lib/tracker";
import { HistorialPage } from "./historial";

const mocks = vi.hoisted(() => ({
  useHistory: vi.fn(),
  useProjects: vi.fn(),
  saveRate: vi.fn(),
  saveDailyOverride: vi.fn(),
}));

vi.mock("@/hooks/useHistory", () => ({ useHistory: mocks.useHistory }));
vi.mock("@/hooks/useProjects", () => ({ useProjects: mocks.useProjects }));
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
    onChange,
  }: {
    options: { value: string; label: string }[];
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
  { id: "project-1", name: "Nuxio", hourlyRate: 5 },
  { id: "project-2", name: "Focus", hourlyRate: 7.5 },
];

const history: HistoryResponse = {
  rows: [
    {
      date: "2026-09-05",
      projectId: "project-1",
      projectName: "Nuxio",
      workSeconds: 3600,
      breakSeconds: 0,
      activeSeconds: 3600,
      goalMinutes: 480,
      goalMet: false,
      hourlyRate: 5,
      rateSource: "base",
      amountUsd: 5,
    },
  ],
  totals: { days: 1, workSeconds: 3600, breakSeconds: 0, activeSeconds: 3600, amountUsd: 5 },
};

describe("HistorialPage rate configuration", () => {
  beforeEach(() => {
    mocks.useProjects.mockReturnValue({
      projects,
      activeProjectId: "project-1",
      activeProject: projects[0],
      selectProject: vi.fn(),
    });
    mocks.saveRate.mockResolvedValue({
      projectId: "project-1",
      hourlyRate: 7.25,
      effectiveFrom: "2026-09-05",
    });
    mocks.saveDailyOverride.mockResolvedValue({
      projectId: "project-1",
      hourlyRate: 8,
      overrideDate: "2026-09-05",
    });
    mocks.useHistory.mockReturnValue({
      filters: { period: "month", onlyWeekdays: true, projectId: null },
      setFilters: vi.fn(),
      data: history,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      saveRate: mocks.saveRate,
      saveDailyOverride: mocks.saveDailyOverride,
      isSavingRate: false,
      isSavingDailyOverride: false,
      rateError: null,
      dailyOverrideError: null,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("saves a valid base rate, including zero, for the selected project", async () => {
    const user = userEvent.setup();
    render(<HistorialPage />);

    const project = screen.getByLabelText("Proyecto para tarifa base");
    await user.selectOptions(project, "project-2");
    const input = screen.getByLabelText("Tarifa por hora (USD)");
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: "Guardar tarifa base" }));

    expect(mocks.saveRate).toHaveBeenCalledWith({ projectId: "project-2", hourlyRate: 0 });
  });

  it("rejects negative and over-precise base rates without calling the API", async () => {
    const user = userEvent.setup();
    render(<HistorialPage />);
    const input = screen.getByLabelText("Tarifa por hora (USD)");

    await user.clear(input);
    await user.type(input, "7.256");
    await user.click(screen.getByRole("button", { name: "Guardar tarifa base" }));

    expect(screen.getByRole("alert")).toHaveTextContent("dos decimales");
    expect(mocks.saveRate).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "-1");
    await user.click(screen.getByRole("button", { name: "Guardar tarifa base" }));

    expect(screen.getByRole("alert")).toHaveTextContent("no negativo");
    expect(mocks.saveRate).not.toHaveBeenCalled();
  });

  it("saves a daily override for the row date and keeps the form after a remote error", async () => {
    const user = userEvent.setup();
    mocks.saveDailyOverride.mockRejectedValueOnce(new Error("No se pudo guardar la excepción"));
    render(<HistorialPage />);

    await user.click(screen.getByRole("button", { name: "Editar tarifa del día" }));
    const input = screen.getByLabelText("Tarifa de excepción para 2026-09-05");
    await user.clear(input);
    await user.type(input, "8");
    await user.click(screen.getByRole("button", { name: "Guardar excepción" }));

    expect(mocks.saveDailyOverride).toHaveBeenCalledWith({
      projectId: "project-1",
      date: "2026-09-05",
      hourlyRate: 8,
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo guardar la excepción");
    expect(screen.getByLabelText("Tarifa de excepción para 2026-09-05")).toHaveValue("8");
  });
});
