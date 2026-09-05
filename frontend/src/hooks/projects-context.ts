import { createContext } from "react";
import type { ApiProject, CreateProjectInput } from "@/lib/tracker";

export type ProjectsContextValue = {
  projects: ApiProject[];
  activeProject: ApiProject | null;
  activeProjectId: string | null;
  isLoading: boolean;
  isCreating: boolean;
  error: Error | null;
  selectProject: (projectId: string) => void;
  createProject: (input: CreateProjectInput) => Promise<ApiProject>;
};

export const ProjectsContext = createContext<ProjectsContextValue | null>(null);
