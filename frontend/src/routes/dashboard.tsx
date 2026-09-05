import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeading, Segmented } from "@/components/AppShell";
import { COMPANIES, HISTORY, companyName, hm, isWeekday, shortDate } from "@/lib/tracker";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard de productividad & IA · TimeFlow" },
      {
        name: "description",
        content:
          "KPIs de horas activas, ratio trabajo/descanso, distribución por empresa e insights generados por IA.",
      },
      { property: "og:title", content: "Dashboard de productividad & IA · TimeFlow" },
      {
        property: "og:description",
        content: "Analiza tus patrones de jornada y recibe recomendaciones personalizadas.",
      },
    ],
  }),
  component: DashboardPage,
});

const INSIGHTS = [
  {
    tag: "Alerta de fatiga",
    tone: "rest" as const,
    text: "Estás tomando descansos muy cortos los días Miércoles después de las 4 PM.",
  },
  {
    tag: "Análisis de distribución",
    tone: "ink" as const,
    text: "El 70% de tus horas trabajadas esta semana fueron para Nuxio.",
  },
  {
    tag: "Optimización",
    tone: "work" as const,
    text: "Tu promedio de horas activas en días hábiles es de 7.2h. Estás manteniendo un ritmo constante.",
  },
];

function DashboardPage() {
  const [companyId, setCompanyId] = useState(COMPANIES[0]!.id);
  const [scope, setScope] = useState("habiles");

  const rows = useMemo(
    () => HISTORY.filter((r) => (scope === "habiles" ? isWeekday(r.date) : true)).slice(0, 30),
    [scope],
  );

  const avgWeekday =
    rows.filter((r) => isWeekday(r.date)).reduce((a, r) => a + r.workMinutes, 0) /
    Math.max(1, rows.filter((r) => isWeekday(r.date)).length);
  const totalWork = rows.reduce((a, r) => a + r.workMinutes, 0);
  const totalBreak = rows.reduce((a, r) => a + r.breakMinutes, 0);
  const efficiency = (totalWork / Math.max(1, totalWork + totalBreak)) * 100;

  const barData = [...rows]
    .reverse()
    .map((r) => ({ date: shortDate(r.date).slice(0, 6), horas: +(r.workMinutes / 60).toFixed(2), weekday: isWeekday(r.date) }));

  const pieData = COMPANIES.map((c) => ({
    name: c.name,
    value: rows.filter((r) => r.companyId === c.id).reduce((a, r) => a + r.workMinutes, 0),
  }));

  return (
    <AppShell companyId={companyId} onCompanyChange={setCompanyId}>
      <PageHeading
        eyebrow="Dashboard & IA"
        title="Productividad de los últimos 30 días"
        aside={
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: "habiles", label: "Días hábiles (L-V)" },
              { value: "todos", label: "Todos los días (L-D)" },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rim rounded-[14px] bg-panel/70 px-4 py-3.5 backdrop-blur-sm">
          <div className="text-[11px] font-medium text-mute">Promedio por día hábil</div>
          <div className="mt-1 font-clock text-[26px] font-medium tabular-nums tracking-tight">
            {hm(avgWeekday)}
          </div>
          <div className="mt-0.5 text-[11px] text-faint">Sobre {rows.length} jornadas</div>
        </div>
        <div className="rim rounded-[14px] bg-panel/70 px-4 py-3.5 backdrop-blur-sm">
          <div className="text-[11px] font-medium text-mute">Ratio trabajo vs. descanso</div>
          <div className="mt-1 font-clock text-[26px] font-medium tabular-nums tracking-tight text-work">
            {efficiency.toFixed(1)}%
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/5">
            <div className="h-full rounded-full bg-work" style={{ width: `${efficiency}%` }} />
          </div>
        </div>
        <div className="rim rounded-[14px] bg-panel/70 px-4 py-3.5 backdrop-blur-sm">
          <div className="text-[11px] font-medium text-mute">Horas activas acumuladas</div>
          <div className="mt-1 font-clock text-[26px] font-medium tabular-nums tracking-tight">
            {hm(totalWork)}
          </div>
          <div className="mt-0.5 text-[11px] text-faint">Descansos {hm(totalBreak)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rim rounded-[16px] bg-panel/60 p-5 ring-1 ring-black/5 backdrop-blur-sm lg:col-span-2">
          <h2 className="text-[14px] font-semibold tracking-tight">Horas trabajadas por día</h2>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--faint)" }}
                  interval={2}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--faint)" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.04)" }}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--rim)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
                  {barData.map((d, i) => (
                    <Cell key={i} fill={d.weekday ? "var(--work)" : "var(--faint)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rim rounded-[16px] bg-panel/60 p-5 ring-1 ring-black/5 backdrop-blur-sm">
          <h2 className="text-[14px] font-semibold tracking-tight">Distribución por empresa</h2>
          <div className="mt-2 h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={52} outerRadius={78} strokeWidth={0}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "var(--work)" : "var(--rest)"} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {pieData.map((d, i) => (
              <li key={d.name} className="flex items-center gap-2 text-[13px]">
                <span
                  className={`size-2 rounded-full ${i === 0 ? "bg-work" : "bg-rest"}`}
                />
                <span className="font-medium">{d.name}</span>
                <span className="ml-auto font-clock tabular-nums text-mute">{hm(d.value)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="text-[14px] font-semibold tracking-tight">Insights & Recomendaciones de la IA</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {INSIGHTS.map((i) => (
            <article key={i.tag} className="rim rounded-[16px] bg-panel/60 p-5 backdrop-blur-sm">
              <span
                className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ring-1 ${
                  i.tone === "work"
                    ? "bg-work/10 text-work ring-work/20"
                    : i.tone === "rest"
                      ? "bg-rest/10 text-rest ring-rest/20"
                      : "bg-black/5 text-mute ring-black/10"
                }`}
              >
                {i.tag}
              </span>
              <p className="mt-3 text-pretty text-[13px] leading-relaxed text-ink">{i.text}</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Generado a partir de tus patrones de registro e inactividad · {companyName(companyId)}
        </p>
      </section>
    </AppShell>
  );
}
