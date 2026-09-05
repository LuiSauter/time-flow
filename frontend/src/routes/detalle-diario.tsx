import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { AppShell, PageHeading } from "@/components/AppShell";
import { COMPANIES, hm } from "@/lib/tracker";

export const Route = createFileRoute("/detalle-diario")({
  head: () => ({
    meta: [
      { title: "Detalle de horas y descansos del día · TimeFlow" },
      {
        name: "description",
        content:
          "Línea de tiempo de 24 horas con bloques de trabajo activo, descansos e inactividad del día seleccionado.",
      },
      { property: "og:title", content: "Detalle de horas y descansos del día · TimeFlow" },
      {
        property: "og:description",
        content: "Revisa y ajusta cada bloque de trabajo y descanso del día.",
      },
    ],
  }),
  component: DetallePage,
});

type Entry = { kind: "work" | "break"; label: string; from: string; to: string; minutes: number };

const ENTRIES: Entry[] = [
  { kind: "work", label: "Bloque 1 · Trabajo", from: "08:30", to: "12:30", minutes: 240 },
  { kind: "break", label: "Descanso 1 · Almuerzo", from: "12:30", to: "13:15", minutes: 45 },
  { kind: "work", label: "Bloque 2 · Trabajo", from: "13:15", to: "17:00", minutes: 225 },
];

const toPct = (t: string) => {
  const [h, m] = t.split(":").map(Number) as [number, number];
  return ((h * 60 + m) / 1440) * 100;
};

function DetallePage() {
  const [companyId, setCompanyId] = useState(COMPANIES[0]!.id);
  const totalWork = ENTRIES.filter((e) => e.kind === "work").reduce((a, e) => a + e.minutes, 0);
  const totalBreak = ENTRIES.filter((e) => e.kind === "break").reduce((a, e) => a + e.minutes, 0);

  return (
    <AppShell companyId={companyId} onCompanyChange={setCompanyId}>
      <PageHeading
        eyebrow="Detalle diario"
        title="Lunes 31 de Agosto · Nuxio"
        aside={
          <div className="flex items-center gap-6">
            <span className="text-right">
              <span className="block text-[11px] font-medium text-mute">Trabajo activo</span>
              <span className="block font-clock text-[20px] tabular-nums text-work">
                {hm(totalWork)}
              </span>
            </span>
            <span className="text-right">
              <span className="block text-[11px] font-medium text-mute">Descansos</span>
              <span className="block font-clock text-[20px] tabular-nums text-rest">
                {hm(totalBreak)}
              </span>
            </span>
          </div>
        }
      />

      <section className="rim rounded-[16px] bg-panel/60 p-5 ring-1 ring-black/5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold tracking-tight">Línea de tiempo · 24 horas</h2>
          <div className="flex items-center gap-4 text-[11px] text-mute">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-work" />
              Trabajo
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rest" />
              Descanso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rim" />
              Inactivo
            </span>
          </div>
        </div>

        <div className="relative mt-5 h-9 overflow-hidden rounded-[10px] bg-rim/60">
          {ENTRIES.map((e) => (
            <span
              key={e.label}
              title={`${e.label} · ${e.from}–${e.to}`}
              className={`absolute inset-y-0 ${e.kind === "work" ? "bg-work" : "bg-rest"}`}
              style={{ left: `${toPct(e.from)}%`, width: `${toPct(e.to) - toPct(e.from)}%` }}
            />
          ))}
        </div>
        <div className="mt-2.5 flex justify-between font-clock text-[11px] tabular-nums text-faint">
          {["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>

      <section className="rim overflow-hidden rounded-[16px] bg-panel/60 ring-1 ring-black/5 backdrop-blur-sm">
        <div className="border-b border-rim px-5 py-3.5">
          <h2 className="text-[14px] font-semibold tracking-tight">Desglose cronológico</h2>
        </div>
        <div className="divide-y divide-black/5">
          {ENTRIES.map((e) => (
            <div key={e.label} className="flex items-center gap-4 px-5 py-3.5">
              <span
                className={`size-2 shrink-0 rounded-full ${e.kind === "work" ? "bg-work" : "bg-rest"}`}
              />
              <span className="w-[130px] shrink-0 font-clock text-[13px] tabular-nums text-mute">
                {e.from} – {e.to}
              </span>
              <span className="text-[13px] font-medium">{e.label}</span>
              <span className="ml-auto font-clock text-[13px] tabular-nums">{hm(e.minutes)}</span>
              <button
                className="ml-4 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-medium text-mute transition-colors hover:bg-black/5"
                title="Edición rápida"
              >
                <Pencil className="size-3.5" />
                Ajustar
              </button>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
