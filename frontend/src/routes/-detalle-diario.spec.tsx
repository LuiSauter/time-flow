import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { vi } from "vitest";
import { DetallePage } from "./detalle-diario";

const mocks = vi.hoisted(() => ({
  useSearch: vi.fn(),
  useHistory: vi.fn(),
  useProjects: vi.fn(),
}));

vi.mock("@/hooks/useHistory", () => ({ useHistory: mocks.useHistory }));
vi.mock("@/hooks/useProjects", () => ({ useProjects: mocks.useProjects }));
vi.mock("@/lib/route-guard", () => ({ requirePrivateSession: vi.fn() }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    ...(options as object),
    useSearch: mocks.useSearch,
  }),
}));
vi.mock("@/components/AppShell", () => ({
  AppShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PageHeading: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

const projects = [
  { id: "project-1", name: "Nuxio" },
  { id: "project-2", name: "Focus" },
];

describe("DetallePage context", () => {
  beforeEach(() => {
    mocks.useSearch.mockReturnValue({ date: "2026-09-05", projectId: "project-2" });
    mocks.useProjects.mockReturnValue({
      projects,
      activeProjectId: "project-1",
      selectProject: vi.fn(),
    });
    mocks.useHistory.mockReturnValue({
      data: {
        rows: [
          {
            date: "2026-09-05",
            projectId: "project-2",
            projectName: "Focus",
            activeSeconds: 3600,
            breakSeconds: 600,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
  });

  it("requests and renders the selected date and project", () => {
    render(<DetallePage />);

    expect(mocks.useHistory).toHaveBeenCalledWith(
      {
        period: "custom",
        startDate: "2026-09-05",
        endDate: "2026-09-05",
        onlyWeekdays: false,
        projectId: "project-2",
      },
      { enabled: true },
    );
    expect(screen.getByRole("heading", { name: /5 de septiembre.*Focus/i })).toBeInTheDocument();
  });

  it("does not query an unknown project and reports invalid context", () => {
    mocks.useSearch.mockReturnValue({ date: "2026-09-05", projectId: "not-owned" });

    render(<DetallePage />);

    expect(mocks.useHistory).toHaveBeenCalledWith(expect.anything(), { enabled: false });
    expect(screen.getByRole("alert")).toHaveTextContent(/proyecto.*autorizado/i);
  });
});
