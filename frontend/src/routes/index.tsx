import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  Clock3,
  LineChart,
  Pause,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "https://timeflow.devhooh.com").replace(
  /\/$/,
  "",
);
const LANDING_URL = SITE_URL;
const LANDING_DESCRIPTION =
  "Time Flow es un time tracker gratis para registrar horas de trabajo activo, descansos y productividad por proyecto, con registros ilimitados.";
const FAQS = [
  {
    question: "¿Time Flow es gratis?",
    answer:
      "Sí. Time Flow es gratis para cualquier usuario, sin planes de pago ni límite de registros.",
  },
  {
    question: "¿Puedo registrar horas ilimitadas?",
    answer: "Sí. Puedes registrar todas las jornadas, descansos y entradas manuales que necesites.",
  },
  {
    question: "¿Time Flow separa el trabajo de los descansos?",
    answer:
      "Sí. Cada descanso se registra como un tramo separado para calcular con precisión tus horas activas.",
  },
];

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "Time Flow",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: LANDING_URL,
      description: LANDING_DESCRIPTION,
      inLanguage: "es",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      author: {
        "@type": "Person",
        name: "Luis Gabriel Janco",
        email: "luis.janco@devhooh.com",
      },
      featureList: [
        "Cronómetro de trabajo activo",
        "Registro de descansos",
        "Historial por proyecto",
        "Dashboard de productividad",
        "Registros ilimitados",
      ],
    },
    {
      "@type": "WebSite",
      name: "Time Flow",
      url: SITE_URL,
      inLanguage: "es",
    },
    {
      "@type": "FAQPage",
      mainEntity: FAQS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      })),
    },
  ],
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Time Flow · Mide tus horas activas, no las horas muertas" },
      {
        name: "description",
        content: LANDING_DESCRIPTION,
      },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "googlebot", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: "Time Flow · Mide tus horas activas, no las horas muertas" },
      {
        property: "og:description",
        content: LANDING_DESCRIPTION,
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: LANDING_URL },
      { property: "og:site_name", content: "Time Flow" },
      { property: "og:locale", content: "es_BO" },
      { property: "og:image", content: `${SITE_URL}/og-image.png` },
      {
        property: "og:image:alt",
        content: "Time Flow, time tracker gratis para registrar horas de trabajo",
      },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Time Flow · Mide tus horas activas" },
      { name: "twitter:description", content: LANDING_DESCRIPTION },
      { name: "twitter:image", content: `${SITE_URL}/og-image.png` },
    ],
    links: [
      { rel: "canonical", href: LANDING_URL },
      { rel: "alternate", hrefLang: "es", href: LANDING_URL },
      { rel: "manifest", href: "/site.webmanifest" },
    ],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(STRUCTURED_DATA) }],
  }),
  component: LandingPage,
});

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-clock text-[11px] lowercase tracking-[0.18em] text-faint">{children}</p>
  );
}

const FEATURES = [
  {
    icon: Clock3,
    title: "Cronómetro real",
    body: "Inicia, pausa y cierra la jornada. El tiempo corre con marcas absolutas, aunque cierres la pestaña.",
  },
  {
    icon: Pause,
    title: "Descansos aparte",
    body: "Cada pausa se guarda como su propio tramo y nunca contamina tus horas productivas.",
  },
  {
    icon: Building2,
    title: "Multiempresa",
    body: "Cambia de empresa en un clic. Metas, zona horaria y reportes independientes por espacio.",
  },
  {
    icon: LineChart,
    title: "Historial y detalle",
    body: "Filtra por semana, mes o días hábiles y abre la línea de tiempo hora por hora de cualquier día.",
  },
  {
    icon: Sparkles,
    title: "Insights con IA",
    body: "Resúmenes de eficiencia, mejores franjas horarias y avisos cuando la meta se aleja.",
  },
  {
    icon: ShieldCheck,
    title: "Privado por defecto",
    body: "Cada registro pertenece solo a tu cuenta. Nadie más ve tu jornada sin permiso.",
  },
];

const STATS = [
  { value: "100%", label: "gratis para cualquier usuario" },
  { value: "∞", label: "registros ilimitados" },
  { value: "3", label: "estados: activo, pausa, cerrado" },
  { value: "100%", label: "de tus datos, privados" },
];

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-paper text-ink">
      <div className="spectrum pointer-events-none absolute inset-x-0 top-0 h-[30rem]" />

      <header className="sticky top-0 z-20 border-b border-rim bg-panel/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-3 px-6">
          <Link to="/" aria-label="Time Flow, inicio" className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-ink">
              <span
                aria-hidden="true"
                className="font-clock text-[11px] font-semibold text-oncolor"
              >
                04
              </span>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Time Flow</span>
          </Link>
          <nav aria-label="Navegación de acceso" className="ml-auto flex items-center gap-2">
            <span className="mr-1 hidden font-clock text-[11px] lowercase tracking-[0.16em] text-faint sm:block">
              time_tracker/activo
            </span>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="flex h-9 items-center rounded-[10px] px-3 text-[13px] font-medium text-mute transition-colors hover:bg-black/5"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="flex h-9 items-center rounded-[10px] bg-ink px-4 text-[13px] font-semibold text-oncolor transition-transform hover:-translate-y-0.5"
            >
              Crear cuenta
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative mx-auto max-w-[1120px] px-6">
        <section
          aria-labelledby="hero-title"
          className="grid gap-10 py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-28"
        >
          <div>
            <Eyebrow>la_idea_completa</Eyebrow>
            <h1
              id="hero-title"
              className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl"
            >
              Tu jornada dura 9 horas. Tu trabajo activo, no.
            </h1>
            <p className="mt-5 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-mute">
              Time Flow cronometra el tiempo que realmente trabajas, separa cada descanso y elimina
              las horas muertas del cálculo. Gratis, sin límites y sin estimar a ojo.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="flex h-11 items-center gap-2 rounded-[12px] bg-ink px-5 text-[14px] font-semibold text-oncolor transition-transform hover:-translate-y-0.5"
              >
                Empezar gratis
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/app"
                className="flex h-11 items-center rounded-[12px] bg-panel px-5 text-[14px] font-medium text-ink ring-1 ring-black/5 transition-colors hover:bg-black/5"
              >
                Ver el tracker
              </Link>
            </div>
            <p className="mt-4 font-clock text-[11px] lowercase tracking-[0.14em] text-faint">
              // gratis para todos · registros ilimitados · zona horaria de bolivia por defecto
            </p>
          </div>

          <aside
            aria-label="Vista previa del registro de jornada"
            className="rim rounded-[20px] bg-panel/80 p-6 backdrop-blur-md"
          >
            <div className="flex items-center justify-between">
              <span className="font-clock text-[11px] lowercase tracking-[0.16em] text-faint">
                jornada_hoy
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-mute ring-1 ring-black/5">
                <span aria-hidden="true" className="dotwork size-1.5 rounded-full bg-work" />
                Activo
              </span>
            </div>
            <output
              aria-label="Tiempo activo de la jornada"
              className="mt-5 block font-clock text-[46px] font-semibold leading-none tracking-tight tabular-nums sm:text-[56px]"
            >
              06:12:44
            </output>
            <div className="mt-2 text-[12.5px] text-mute">Meta diaria 8 h · faltan 1 h 47 m</div>

            <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-paper ring-1 ring-black/5">
              <span className="h-full w-[62%] bg-work" />
              <span className="h-full w-[11%] bg-rest" />
            </div>

            <dl className="mt-6 grid grid-cols-3 gap-3">
              {[
                ["Activo", "6 h 12 m", "text-work"],
                ["Descanso", "48 m", "text-rest"],
                ["Muertas", "1 h 09 m", "text-stop"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-[12px] bg-paper p-3 ring-1 ring-black/5">
                  <dt className="text-[11px] font-medium text-faint">{label}</dt>
                  <dd className={`mt-1 font-clock text-[15px] font-semibold tabular-nums ${tone}`}>
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <ol
              aria-label="Segmentos de la jornada"
              className="mt-5 space-y-2 font-clock text-[11.5px] text-mute"
            >
              <li className="flex justify-between">
                <span>
                  <time dateTime="08:32">08:32</time> → <time dateTime="11:04">11:04</time> trabajo
                </span>
                <span className="tabular-nums text-ink">2 h 32 m</span>
              </li>
              <li className="flex justify-between">
                <span>
                  <time dateTime="11:04">11:04</time> → <time dateTime="11:22">11:22</time> descanso
                </span>
                <span className="tabular-nums text-ink">18 m</span>
              </li>
              <li className="flex justify-between">
                <span>
                  <time dateTime="11:22">11:22</time> → <time dateTime="15:02">15:02</time> trabajo
                </span>
                <span className="tabular-nums text-ink">3 h 40 m</span>
              </li>
            </ol>
          </aside>
        </section>

        <section aria-labelledby="benefits-title" className="border-t border-rim py-14">
          <Eyebrow>lo_que_recuperas</Eyebrow>
          <h2 id="benefits-title" className="sr-only">
            Beneficios de Time Flow
          </h2>
          <dl className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 mt-1.5 text-[12.5px] leading-relaxed text-mute">
                  {s.label}
                </dt>
                <dd className="order-1 font-clock text-3xl font-semibold tracking-tight tabular-nums">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 font-clock text-[11px] lowercase tracking-[0.14em] text-faint">
            // sin planes de pago · registra todo lo que necesites
          </p>
        </section>

        <section
          aria-labelledby="steps-title"
          className="grid gap-10 border-t border-rim py-16 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div>
            <Eyebrow>la_escalera</Eyebrow>
            <h2
              id="steps-title"
              className="mt-4 text-balance text-3xl font-semibold tracking-tight"
            >
              Cuatro pasos y tu día queda medido.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-mute">
              Nada de formularios largos ni reportes manuales al final de la semana. El registro
              ocurre mientras trabajas.
            </p>
          </div>
          <ol className="space-y-4">
            {[
              ["Entra con tu cuenta", "Google o correo. Tu espacio queda listo en segundos."],
              ["Pulsa iniciar", "El cronómetro corre en segundo plano, incluso si recargas."],
              ["Marca tus descansos", "Cada pausa se separa sola del tiempo productivo."],
              ["Cierra la jornada", "El día se guarda en el historial con su detalle completo."],
            ].map(([title, body], i) => (
              <li
                key={title}
                className="rim flex gap-4 rounded-[14px] bg-panel/70 p-4 backdrop-blur-sm"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-ink font-clock text-[11px] font-semibold text-oncolor">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
                  <div className="mt-1 text-[12.5px] leading-relaxed text-mute">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="features-title" className="border-t border-rim py-16">
          <Eyebrow>capacidades</Eyebrow>
          <h2
            id="features-title"
            className="mt-4 max-w-[24ch] text-balance text-3xl font-semibold tracking-tight"
          >
            Todo lo que necesita un control de horas serio.
          </h2>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <li key={f.title} className="rim rounded-[16px] bg-panel/70 p-5 backdrop-blur-sm">
                <span className="grid size-9 place-items-center rounded-[10px] bg-paper text-ink ring-1 ring-black/5">
                  <f.icon aria-hidden="true" className="size-4" />
                </span>
                <h3 className="mt-4 text-[14px] font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-mute">{f.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-rim py-16">
          <Eyebrow>preguntas_frecuentes</Eyebrow>
          <h2 id="faq-title" className="mt-4 text-balance text-3xl font-semibold tracking-tight">
            Todo claro antes de empezar.
          </h2>
          <dl className="mt-8 divide-y divide-black/5 rounded-[16px] bg-panel/60 ring-1 ring-black/5">
            {FAQS.map(({ question, answer }) => (
              <div key={question} className="p-5">
                <dt className="text-[14px] font-semibold tracking-tight">{question}</dt>
                <dd className="mt-2 text-[13px] leading-relaxed text-mute">{answer}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="cta-title" className="border-t border-rim py-20">
          <div className="rim overflow-hidden rounded-[20px] bg-ink px-8 py-12 text-center text-oncolor">
            <div className="font-clock text-[11px] lowercase tracking-[0.18em] text-oncolor/60">
              empieza_hoy
            </div>
            <h2
              id="cta-title"
              className="mx-auto mt-4 max-w-[22ch] text-balance text-3xl font-semibold tracking-tight"
            >
              Deja de estimar tus horas. Mídelas.
            </h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-[14px] leading-relaxed text-oncolor/70">
              Crea tu cuenta y registra tu primera jornada en menos de un minuto.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "register" }}
                className="flex h-11 items-center gap-2 rounded-[12px] bg-panel px-5 text-[14px] font-semibold text-ink transition-transform hover:-translate-y-0.5"
              >
                Crear cuenta
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                to="/auth"
                search={{ mode: "login" }}
                className="flex h-11 items-center rounded-[12px] px-5 text-[14px] font-medium text-oncolor/80 ring-1 ring-white/20 transition-colors hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-rim">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-6 py-8">
          <small className="font-clock text-[11px] lowercase tracking-[0.16em] text-faint">
            time flow · gratis para todos · registros ilimitados
          </small>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <nav
              aria-label="Navegación del pie de página"
              className="flex gap-4 text-[12.5px] text-mute"
            >
              <Link to="/app" className="hover:text-ink">
                Tracker
              </Link>
              <Link to="/historial" className="hover:text-ink">
                Historial
              </Link>
              <Link to="/dashboard" className="hover:text-ink">
                Dashboard
              </Link>
              <Link to="/detalle-diario" className="hover:text-ink">
                Detalle Diario
              </Link>
            </nav>
            <address className="text-[12px] not-italic text-faint">
              Desarrollado por Luis Gabriel Janco · Soporte:{" "}
              <a className="text-mute hover:text-ink" href="mailto:luis.janco@devhooh.com">
                luis.janco@devhooh.com
              </a>
            </address>
          </div>
        </div>
      </footer>
    </div>
  );
}
