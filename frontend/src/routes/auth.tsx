import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión · TimeFlow" },
      {
        name: "description",
        content:
          "Accede a TimeFlow con Google. Tus registros de tiempo son privados y únicos para tu cuenta.",
      },
      { property: "og:title", content: "Iniciar sesión · TimeFlow" },
      {
        property: "og:description",
        content: "Accede a TimeFlow con Google y controla tus horas de trabajo activo.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
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

        <Link
          to="/"
          className="mt-8 flex h-11 items-center justify-center gap-3 rounded-[12px] bg-ink text-[14px] font-semibold text-oncolor ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
        >
          <svg viewBox="0 0 18 18" className="size-4" aria-hidden="true">
            <path
              fill="currentColor"
              d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.5h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.6Z"
            />
            <path
              fill="currentColor"
              opacity=".7"
              d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.2-3.8H.8v2.3A9 9 0 0 0 9 18Z"
            />
            <path
              fill="currentColor"
              opacity=".45"
              d="M3.8 10.7a5.4 5.4 0 0 1 0-3.4V5H.8a9 9 0 0 0 0 8l3-2.3Z"
            />
            <path
              fill="currentColor"
              opacity=".85"
              d="M9 3.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 .8 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6Z"
            />
          </svg>
          Iniciar sesión con Google
        </Link>

        <p className="mt-6 text-pretty text-center text-[12px] leading-relaxed text-faint">
          Tus registros de tiempo son totalmente privados y únicos para tu cuenta.
        </p>
      </div>
    </div>
  );
}
