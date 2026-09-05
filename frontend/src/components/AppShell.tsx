import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { PROJECTS } from "@/lib/tracker";
import { clearSession, useAuth } from "@/hooks/useAuth";

const NAV = [
  { to: "/", label: "Home" },
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

  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <div className="spectrum pointer-events-none absolute inset-x-0 top-0 h-[22rem]" />

      <header className="sticky top-0 z-20 border-b border-rim bg-panel/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-ink">
              <span className="font-clock text-[11px] font-semibold tracking-tight text-oncolor">
                04
              </span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">TimeFlow</span>
          </Link>

          <div className="hidden items-center gap-1 rounded-xl bg-paper p-1 ring-1 ring-black/5 lg:flex">
            {PROJECTS.map((p) =>
              p.id === projectId ? (
                <button
                  key={p.id}
                  className="flex h-8 items-center gap-2 rounded-lg bg-panel px-3 text-[13px] font-medium text-ink ring-1 ring-black/5"
                >
                  <span className="dotwork size-1.5 rounded-full bg-work" />
                  {p.name}
                  <ChevronDown className="size-3 text-faint" />
                </button>
              ) : (
                <button
                  key={p.id}
                  onClick={() => onProjectChange(p.id)}
                  className="h-8 rounded-lg px-3 text-[13px] font-medium text-mute transition-colors hover:bg-black/5"
                >
                  {p.name}
                </button>
              ),
            )}
            <button className="flex h-8 items-center gap-1 rounded-lg px-2.5 text-[13px] font-medium text-mute transition-colors hover:bg-black/5">
              <Plus className="size-3.5" />
              Agregar
            </button>
          </div>

          <nav className="ml-2 hidden items-center gap-1 text-[13px] font-medium md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
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
        {children}
      </main>
    </div>
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
