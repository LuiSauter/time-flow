import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { clearSession, useAuth } from "@/hooks/useAuth";
import { useProjects } from "@/hooks/useProjects";

const NAV = [
  { to: "/app", label: "Home" },
  { to: "/historial", label: "Historial" },
  { to: "/detalle-diario", label: "Detalle Diario" },
  { to: "/dashboard", label: "Dashboard & IA" },
] as const;

export function AppShell({
  children,
  projectId,
  onProjectChange,
}: {
  children: ReactNode;
  projectId: string;
  onProjectChange: (id: string) => void;
}) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { projects, activeProjectId, isLoading, isCreating, createProject, selectProject } =
    useProjects();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const fullName = session?.user.fullName ?? "Usuario";
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const logout = () => {
    clearSession();
    void navigate({ to: "/auth" });
  };

  const selectedProjectId = activeProjectId ?? projects[0]?.id ?? projectId;
  const changeProject = (nextProjectId: string) => {
    selectProject(nextProjectId);
    onProjectChange(nextProjectId);
  };
  const hasProjects = projects.length > 0;
  const showEmptyState = !isLoading && !hasProjects;

  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <div className="spectrum pointer-events-none absolute inset-x-0 top-0 h-[22rem]" />

      <header className="sticky top-0 z-20 border-b border-rim bg-panel/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
          <Link to="/app" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-ink">
              <span className="font-clock text-[11px] font-semibold tracking-tight text-oncolor">
                04
              </span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Time Flow</span>
          </Link>

          <div className="relative flex min-w-0 flex-1 items-center gap-2">
            {isLoading ? (
              <span className="text-[12px] text-faint">Cargando proyectos...</span>
            ) : null}
            {hasProjects ? (
              <div className="hidden items-center gap-1 rounded-xl bg-paper p-1 ring-1 ring-black/5 lg:flex">
                {projects.map((p) =>
                  p.id === selectedProjectId ? (
                    <button
                      key={p.id}
                      type="button"
                      className="flex h-8 items-center gap-2 rounded-lg bg-panel px-3 text-[13px] font-medium text-ink ring-1 ring-black/5"
                      aria-label={`Proyecto activo: ${p.name}`}
                    >
                      <span className="dotwork size-1.5 rounded-full bg-work" />
                      {p.name}
                      <ChevronDown className="size-3 text-faint" />
                    </button>
                  ) : (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => changeProject(p.id)}
                      className="h-8 rounded-lg px-3 text-[13px] font-medium text-mute transition-colors hover:bg-black/5"
                    >
                      {p.name}
                    </button>
                  ),
                )}
              </div>
            ) : null}
            {hasProjects ? (
              <label className="flex min-w-0 flex-1 items-center lg:hidden">
                <span className="sr-only">Proyecto activo</span>
                <select
                  aria-label="Proyecto activo"
                  value={selectedProjectId}
                  onChange={(event) => changeProject(event.target.value)}
                  className="h-9 min-w-0 max-w-full rounded-lg bg-paper px-3 text-[13px] font-medium text-ink outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-ink"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {hasProjects ? (
              <button
                type="button"
                onClick={() => setShowCreateForm((visible) => !visible)}
                aria-label="Agregar proyecto"
                className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-mute transition-colors hover:bg-black/5 focus:ring-2 focus:ring-ink"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            ) : null}
            {showCreateForm && hasProjects ? (
              <div className="absolute left-0 top-11 z-30 w-[min(320px,calc(100vw-3rem))] rounded-xl bg-panel p-4 shadow-lg ring-1 ring-black/10">
                <ProjectForm
                  isCreating={isCreating}
                  onSubmit={async (input) => {
                    await createProject(input);
                    setShowCreateForm(false);
                  }}
                />
              </div>
            ) : null}
          </div>

          <nav className="ml-2 hidden items-center gap-1 text-[13px] font-medium md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/app" }}
                className="flex h-8 items-center rounded-lg px-3 text-mute transition-colors hover:bg-black/5"
                activeProps={{ className: "bg-ink text-oncolor hover:bg-ink" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid size-8 place-items-center rounded-full bg-paper font-clock text-[11px] font-semibold text-mute ring-1 ring-black/5">
                {initials}
              </span>
              <span className="leading-tight">
                <span className="block text-[13px] font-medium">{fullName}</span>
                <span className="block text-[11px] text-faint">{session?.user.email}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Cerrar sesión"
              className="grid size-8 place-items-center rounded-full text-mute transition-colors hover:bg-black/5"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-8">
        {showEmptyState ? (
          <section className="rim mx-auto flex w-full max-w-xl flex-col rounded-[20px] bg-panel/60 p-6 ring-1 ring-black/5 backdrop-blur-md md:p-8">
            <h1 className="text-xl font-semibold tracking-tight">Crea tu primer proyecto</h1>
            <p className="mt-2 text-[13px] text-mute">
              Necesitas un proyecto para empezar a registrar tu jornada.
            </p>
            <div className="mt-5">
              <ProjectForm isCreating={isCreating} onSubmit={createProject} />
            </div>
          </section>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

function ProjectForm({
  isCreating,
  onSubmit,
}: {
  isCreating: boolean;
  onSubmit: (input: { name: string; timeZone: string }) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [timeZone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("El nombre del proyecto es obligatorio");
      return;
    }

    setError(null);
    try {
      await onSubmit({ name: trimmedName, timeZone });
      setName("");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : "No se pudo crear el proyecto",
      );
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div>
        <label htmlFor="project-name" className="block text-[11px] font-medium text-faint">
          Nombre del proyecto
        </label>
        <input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1.5 h-10 w-full rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-ink"
          placeholder="Ej. Nuxio"
          disabled={isCreating}
        />
      </div>
      <label htmlFor="project-time-zone" className="block text-[11px] font-medium text-faint">
        Zona horaria
        <input
          id="project-time-zone"
          value={timeZone}
          readOnly
          className="mt-1.5 h-10 w-full rounded-lg bg-paper px-3 text-[13px] text-ink outline-none ring-1 ring-black/10"
        />
      </label>
      {error ? (
        <p role="alert" className="text-[12px] text-stop">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isCreating}
        className="h-10 rounded-lg bg-ink text-[13px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5 focus:ring-2 focus:ring-ink disabled:cursor-wait disabled:opacity-60"
      >
        {isCreating ? "Creando..." : "Crear proyecto"}
      </button>
    </form>
  );
}

export function PageHeading({
  eyebrow,
  title,
  aside,
}: {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-faint">
          {eyebrow}
        </div>
        <h1 className="max-w-[34ch] text-balance text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      {aside}
    </div>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[10px] bg-panel p-1 ring-1 ring-black/5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={
            o.value === value
              ? "h-8 rounded-[7px] bg-ink px-3 text-[12px] font-medium text-oncolor"
              : "h-8 rounded-[7px] px-3 text-[12px] font-medium text-mute transition-colors hover:bg-black/5"
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
