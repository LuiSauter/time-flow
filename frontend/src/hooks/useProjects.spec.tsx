import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import * as trackerApi from "@/lib/tracker";
import { ProjectsProvider } from "./ProjectsProvider";
import { useProjects } from "./useProjects";

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

describe("useProjects", () => {
  afterEach(() => vi.restoreAllMocks());

  it("loads authenticated projects", async () => {
    vi.spyOn(trackerApi, "getProjects").mockResolvedValue(projects);
    const { result } = renderProjects();

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.projects).toEqual(projects));
  });

  it("keeps the empty state without an active project", async () => {
    vi.spyOn(trackerApi, "getProjects").mockResolvedValue([]);
    const { result } = renderProjects();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.projects).toEqual([]);
    expect(result.current.activeProjectId).toBeNull();
    expect(result.current.activeProject).toBeNull();
  });

  it("selects the first project and accepts only valid selections", async () => {
    vi.spyOn(trackerApi, "getProjects").mockResolvedValue(projects);
    const { result } = renderProjects();

    await waitFor(() => expect(result.current.activeProjectId).toBe("project-1"));

    act(() => result.current.selectProject("project-2"));
    expect(result.current.activeProjectId).toBe("project-2");

    act(() => result.current.selectProject("missing-project"));
    expect(result.current.activeProjectId).toBe("project-2");
  });

  it("selects the first project created from an empty list", async () => {
    vi.spyOn(trackerApi, "getProjects").mockResolvedValue([]);
    const createdProject = { ...projects[0]! };
    vi.spyOn(trackerApi, "createProject").mockResolvedValue(createdProject);
    const { result } = renderProjects();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.createProject({ name: "Nuxio", timeZone: "America/La_Paz" });
    });

    expect(result.current.projects).toEqual([createdProject]);
    expect(result.current.activeProjectId).toBe(createdProject.id);
  });
});

function renderProjects() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ProjectsProvider, { accessToken: "token" }, children),
    );

  return renderHook(() => useProjects(), { wrapper });
}
