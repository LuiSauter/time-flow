import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { setSession } from "@/hooks/useAuth";
import { login, register } from "@/lib/auth";
import { requireGuestSession } from "@/lib/route-guard";

export const Route = createFileRoute("/auth")({
  beforeLoad: requireGuestSession,
  head: () => ({
    meta: [
      { title: "Iniciar sesión · TimeFlow" },
      {
        name: "description",
        content:
          "Accede a TimeFlow con tu email y contraseña. Tus registros de tiempo son privados y únicos para tu cuenta.",
      },
      { property: "og:title", content: "Iniciar sesión · TimeFlow" },
      {
        property: "og:description",
        content: "Accede a TimeFlow con tu email y controla tus horas de trabajo activo.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();

  const handleSubmit = async (
    values: Parameters<typeof register>[0] | Parameters<typeof login>[0],
  ) => {
    const session = "fullName" in values ? await register(values) : await login(values);
    setSession(session);
    await navigate({ to: "/" });
  };

  return (
    <div className="relative grid min-h-screen place-items-center bg-paper px-6 text-ink">
      <div className="spectrum pointer-events-none absolute inset-x-0 top-0 h-[26rem]" />

      <div className="rim relative w-full max-w-[420px] rounded-[20px] bg-panel/70 px-8 py-10 ring-1 ring-black/5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-ink">
            <span className="font-clock text-[12px] font-semibold tracking-tight text-oncolor">
              04
            </span>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">TimeFlow</span>
        </div>

        <h1 className="mt-8 text-balance text-2xl font-semibold tracking-tight">
          Bienvenido a tu Time Tracker
        </h1>
        <p className="mt-2 text-[13px] text-mute">
          Registra tu jornada activa, tus descansos y elimina las horas muertas.
        </p>

        <AuthForm onSubmit={handleSubmit} />

        <button
          type="button"
          className="mt-2 w-full text-center text-[12px] text-faint hover:text-ink"
        >
          ¿Olvidaste tu contraseña?
        </button>

        <p className="mt-6 text-pretty text-center text-[12px] leading-relaxed text-faint">
          Tus registros de tiempo son totalmente privados y únicos para tu cuenta.
        </p>
      </div>
    </div>
  );
}
