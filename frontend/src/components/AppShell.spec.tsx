import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AppShell } from "./AppShell";

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useNavigate: vi.fn(() => vi.fn()),
  useProjects: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.useAuth, clearSession: vi.fn() }));
vi.mock("@/hooks/useProjects", () => ({ useProjects: mocks.useProjects }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
  useNavigate: mocks.useNavigate,
}));

const projects = [
  {
    id: "project-1",
    name: "Nuxio",
    timeZone: "America/La_Paz",
    dailyGoalMinutes: 480,
    createdAt: "2026-09-05T10:00:00.000Z",
    updatedAt: "2026-09-05T10:00:00.000Z",
  },
  {
    id: "project-2",
    name: "Focus",
    timeZone: "Europe/Madrid",
    dailyGoalMinutes: 480,
    createdAt: "2026-09-05T11:00:00.000Z",
    updatedAt: "2026-09-05T11:00:00.000Z",
  },
];

describe("AppShell project controls", () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({
      session: { user: { fullName: "Diego Ferrer", email: "diego@example.com" } },
    });
    mocks.useProjects.mockReturnValue(projectsState());
  });

  it("renders real projects and changes the active project from desktop or mobile controls", async () => {
    const user = userEvent.setup();
    const selectProject = vi.fn();
    const onProjectChange = vi.fn();
    mocks.useProjects.mockReturnValue({
      ...projectsState(),
      selectProject,
    });

    render(
      <AppShell projectId="project-1" onProjectChange={onProjectChange}>
        <span>Contenido</span>
      </AppShell>,
    );

    expect(screen.getByRole("option", { name: "Focus" })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Proyecto activo"), "project-2");

    expect(selectProject).toHaveBeenCalledWith("project-2");
    expect(onProjectChange).toHaveBeenCalledWith("project-2");
  });

  it("creates a project from the accessible shell form", async () => {
    const user = userEvent.setup();
    const createProject = vi.fn().mockResolvedValue(projects[1]);
    mocks.useProjects.mockReturnValue({
      ...projectsState(),
      createProject,
    });

    render(
      <AppShell projectId="project-1" onProjectChange={vi.fn()}>
        <span>Contenido</span>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Agregar proyecto" }));
    const nameInput = screen.getByLabelText("Nombre del proyecto");
    expect(nameInput).toHaveClass("focus:ring-2");
    await user.type(nameInput, "Focus nuevo");
    await user.click(screen.getByRole("button", { name: "Crear proyecto" }));

    await waitFor(() =>
      expect(createProject).toHaveBeenCalledWith({
        name: "Focus nuevo",
        timeZone: expect.any(String),
      }),
    );
  });

  it("shows the required creation state and does not mount tracker content when empty", () => {
    mocks.useProjects.mockReturnValue({
      ...projectsState(),
      projects: [],
      activeProject: null,
      activeProjectId: null,
    });

    render(
      <AppShell projectId="project-1" onProjectChange={vi.fn()}>
        <span>Tracker montado</span>
      </AppShell>,
    );

    expect(screen.getByText("Crea tu primer proyecto")).toBeInTheDocument();
    expect(screen.queryByText("Tracker montado")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del proyecto")).toBeInTheDocument();
  });

  it("requires a project name before submitting", async () => {
    const user = userEvent.setup();
    const createProject = vi.fn();
    mocks.useProjects.mockReturnValue({
      ...projectsState(),
      projects: [],
      activeProject: null,
      activeProjectId: null,
      createProject,
    });

    render(
      <AppShell projectId="project-1" onProjectChange={vi.fn()}>
        <span>Tracker montado</span>
      </AppShell>,
    );

    await user.click(screen.getByRole("button", { name: "Crear proyecto" }));

    expect(screen.getByRole("alert")).toHaveTextContent("El nombre del proyecto es obligatorio");
    expect(createProject).not.toHaveBeenCalled();
  });
});

function projectsState() {
  return {
    projects,
    activeProject: projects[0],
    activeProjectId: projects[0]!.id,
    isLoading: false,
    isCreating: false,
    error: null,
    selectProject: vi.fn(),
    createProject: vi.fn().mockResolvedValue(projects[1]),
  };
}
