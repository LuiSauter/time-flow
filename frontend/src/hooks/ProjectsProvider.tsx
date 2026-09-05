import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProject as createProjectRequest,
  getProjects,
  type ApiProject,
  type CreateProjectInput,
} from "@/lib/tracker";
import { ProjectsContext, type ProjectsContextValue } from "./projects-context";

const projectsQueryKey = (accessToken: string | null) => ["projects", accessToken] as const;

export function ProjectsProvider({
  accessToken,
  children,
}: {
  accessToken: string | null;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const projectsQuery = useQuery({
    queryKey: projectsQueryKey(accessToken),
    queryFn: () => getProjects(accessToken!),
    enabled: accessToken !== null,
  });
  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  useEffect(() => {
    setActiveProjectId((currentId) => {
      if (currentId && projects.some((project) => project.id === currentId)) return currentId;
      return projects[0]?.id ?? null;
    });
  }, [projects]);

  const createMutation = useMutation({
    mutationFn: (input: CreateProjectInput) => {
      if (!accessToken) throw new Error("No hay una sesión autenticada");
      return createProjectRequest(accessToken, input);
    },
    onSuccess: (createdProject) => {
      queryClient.setQueryData<ApiProject[]>(projectsQueryKey(accessToken), (current) => [
        ...(current ?? []),
        createdProject,
      ]);
      setActiveProjectId(createdProject.id);
    },
  });

  const selectProject = useCallback(
    (projectId: string) => {
      if (projects.some((project) => project.id === projectId)) setActiveProjectId(projectId);
    },
    [projects],
  );

  const createProject = useCallback(
    (input: CreateProjectInput) => createMutation.mutateAsync(input),
    [createMutation],
  );

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [activeProjectId, projects],
  );

  const value = useMemo<ProjectsContextValue>(
    () => ({
      projects,
      activeProject,
      activeProjectId,
      isLoading: projectsQuery.isLoading,
      isCreating: createMutation.isPending,
      error: toError(projectsQuery.error ?? createMutation.error),
      selectProject,
      createProject,
    }),
    [
      activeProject,
      activeProjectId,
      createMutation.error,
      createMutation.isPending,
      createProject,
      projects,
      projectsQuery.error,
      projectsQuery.isLoading,
      selectProject,
    ],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

function toError(value: unknown): Error | null {
  return value instanceof Error ? value : null;
}
