import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DollarSign,
  TrendingUp,
  Users,
  Ticket as TicketIcon,
  Receipt,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { StatCard, Panel, Pill } from "@/components/nox/primitives";
import { AreaTrend, BarTrend } from "@/components/nox/charts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useStock } from "@/contexts/stock-context";
import { useTickets } from "@/contexts/tickets-context";
import { dayKey, hourlySales, isToday, recentDays } from "@/lib/dashboard-metrics";
// `events` sigue siendo data de ejemplo — Eventos todavía no está migrado a la base.
import { currency, events } from "@/data/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio — NOX OS" },
      {
        name: "description",
        content:
          "Ingresos, asistencia, venta de entradas y alertas de stock en vivo, en un solo panel ejecutivo.",
      },
      { property: "og:title", content: "Inicio — NOX OS" },
      {
        property: "og:description",
        content: "Ingresos, asistencia y venta de entradas en vivo para tu local.",
      },
    ],
  }),
  component: Dashboard,
});

const EVENT_STATUS_LABELS: Record<string, string> = {
  live: "en vivo",
  scheduled: "programado",
  "sold-out": "agotado",
  draft: "borrador",
  finished: "finalizado",
};

function Dashboard() {
  const { products, sales, movements } = useStock();
  const { tickets } = useTickets();

  const upcoming = events
    .filter((e) => e.status === "scheduled" || e.status === "sold-out")
    .slice(0, 4);
  const critical = products.filter((p) => p.minStock > 0 && p.stock < p.minStock);

  // 1. Ingresos de hoy — ventas registradas hoy.
  const todaySales = sales.filter((s) => isToday(s.createdAt));
  const revenueToday = todaySales.reduce((sum, s) => sum + s.total, 0);

  // 8. Ganancia estimada — ingresos menos el costo implícito en los movimientos de
  // stock tipo Venta/Receta, valuados al costo de cada producto. Es una estimación,
  // no un costo de mercadería exacto de contabilidad.
  const costByName = new Map(products.map((p) => [p.name, p.cost]));
  const estimatedCost = movements
    .filter((m) => m.type === "Sale" || m.type === "Recipe")
    .reduce((sum, m) => sum + Math.abs(m.qty) * (costByName.get(m.item) ?? 0), 0);
  const grossRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const estimatedProfit = grossRevenue - estimatedCost;
  const margin = grossRevenue > 0 ? (estimatedProfit / grossRevenue) * 100 : 0;

  // 2. Gente adentro — cuenta entradas con ingreso registrado en la puerta. Todavía
  // no hay escaneo de salida, así que es un total de ingresos, no ocupación en vivo exacta.
  const checkedIn = tickets.filter((t) => t.status === "checked-in").length;

  // 3. Entradas vendidas — todas las emitidas, con el % de venta sobre el total.
  const ticketsSold = tickets.filter((t) => t.status !== "refunded").length;
  const sellThrough = tickets.length > 0 ? (ticketsSold / tickets.length) * 100 : 0;
  const ticketRevenue = tickets
    .filter((t) => t.status !== "refunded")
    .reduce((sum, t) => sum + t.price, 0);
  const averageTicket = ticketsSold > 0 ? ticketRevenue / ticketsSold : 0;
  const barSpendPerGuest = checkedIn > 0 ? grossRevenue / checkedIn : 0;

  // 5. Ventas por hora — agrupadas de verdad desde la tabla de ventas.
  const hourly = hourlySales(sales);

  // 6. Actividad reciente — movimientos de stock, ventas y check-ins de entrada, mezclados.
  const feed = [
    ...movements.map((m) => ({
      id: `m_${m.id}`,
      at: m.createdAt ?? "",
      time: m.time,
      text:
        m.type === "Restock"
          ? `Reposición de ${m.qty} × ${m.item} (${m.user})`
          : m.type === "Breakage"
            ? `Rotura registrada: ${Math.abs(m.qty)} × ${m.item}`
            : `${Math.abs(m.qty)} × ${m.item} consumido (${m.type === "Recipe" ? "receta" : "venta"})`,
      tone: m.type === "Restock" ? "success" : m.type === "Breakage" ? "danger" : "muted",
    })),
    ...sales.map((s) => ({
      id: `s_${s.id}`,
      at: s.createdAt ?? "",
      time: s.time,
      text: `Venta ${s.channel} · ${s.items} productos · ${currency(s.total)} (${s.method}, ${s.cashier})`,
      tone: "success",
    })),
    ...tickets
      .filter((t) => t.status === "checked-in" && t.checkedInAt)
      .map((t) => ({
        id: `t_${t.id}`,
        at: t.checkedInAt ?? "",
        time: (t.checkedInAt ?? "").slice(0, 5),
        text: `${t.holder} ingresó · ${t.tier}`,
        tone: "primary",
      })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 8);

  // 7. Productos populares — unidades vendidas, directo de products.sold.
  const popular = [...products]
    .filter((p) => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6)
    .map((p) => ({ name: p.name, value: p.sold }));

  // 9. Agregados diarios de los últimos 7 días. Con una sola noche de datos semilla,
  // esto legítimamente va a mostrar un solo día con datos.
  const days = recentDays(7);
  const revenueTrend = days.map((d) => {
    const daySales = sales.filter((s) => s.createdAt && dayKey(s.createdAt) === d.key);
    const revenue = daySales.reduce((sum, s) => sum + s.total, 0);
    const ratio = grossRevenue > 0 ? estimatedProfit / grossRevenue : 0;
    return { day: d.label, revenue: Math.round(revenue), profit: Math.round(revenue * ratio) };
  });
  const attendanceTrend = days.map((d) => ({
    day: d.label,
    guests: tickets.filter((t) => t.purchasedAt && dayKey(t.purchasedAt) === d.key).length,
  }));

  return (
    <AppShell
      title="Esta noche en NOX"
      description="Operación en vivo · Neon Cathedral · apertura de puertas 23:30"
      actions={
        <>
          <Button variant="outline" size="sm">
            Exportar reporte de la noche
          </Button>
          <Button size="sm" asChild>
            <Link to="/pos">Ir a la barra</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos de hoy"
          value={currency(revenueToday)}
          icon={DollarSign}
          hint={`${todaySales.length} transacciones hoy`}
        />
        <StatCard
          label="Ganancia estimada"
          value={currency(estimatedProfit)}
          icon={TrendingUp}
          hint={`${margin.toFixed(1)}% de margen estimado`}
        />
        <StatCard
          label="Gente adentro"
          value={String(checkedIn)}
          icon={Users}
          hint="entradas con ingreso (sin escaneo de salida)"
        />
        <StatCard
          label="Entradas vendidas"
          value={String(ticketsSold)}
          icon={TicketIcon}
          hint={`${sellThrough.toFixed(0)}% de venta`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Entrada promedio"
          value={currency(averageTicket)}
          icon={Receipt}
          hint="gasto por invitado"
        />
        <StatCard
          label="Consumo en barra / invitado"
          value={currency(barSpendPerGuest)}
          icon={DollarSign}
          hint="ventas por invitado que ingresó"
        />
        <StatCard
          label="Stock crítico"
          value={String(critical.length)}
          icon={AlertTriangle}
          hint="productos bajo el mínimo"
        />
        <StatCard
          label="Próximos eventos"
          value={String(upcoming.length)}
          icon={CalendarDays}
          hint="próximos 14 días"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Ventas por hora"
          subtitle="Ingresos de barra + puerta, en vivo"
          className="lg:col-span-2"
          actions={<Pill tone="primary">En vivo</Pill>}
        >
          <AreaTrend
            data={hourly}
            xKey="hour"
            keys={[{ key: "sales", color: "var(--color-chart-1)" }]}
            height={280}
          />
        </Panel>

        <Panel title="Actividad reciente" subtitle="Feed en vivo">
          <ul className="space-y-4">
            {feed.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span
                  className={
                    a.tone === "success"
                      ? "mt-1.5 size-2 shrink-0 rounded-full bg-success"
                      : a.tone === "primary"
                        ? "mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        : a.tone === "danger"
                          ? "mt-1.5 size-2 shrink-0 rounded-full bg-destructive"
                          : "mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/50"
                  }
                />
                <div>
                  <p className="text-sm leading-snug">{a.text}</p>
                  <p className="text-[11px] text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
            {feed.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                Todavía no hay actividad esta noche.
              </li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Ingresos y ganancia" subtitle="Últimos 7 días" className="lg:col-span-2">
          <AreaTrend
            data={revenueTrend}
            xKey="day"
            keys={[
              { key: "revenue", color: "var(--color-chart-1)" },
              { key: "profit", color: "var(--color-chart-2)" },
            ]}
          />
        </Panel>
        <Panel title="Productos populares" subtitle="Unidades vendidas esta noche">
          <BarTrend data={popular} xKey="name" dataKey="value" horizontal />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Asistencia" subtitle="Entradas compradas por día" className="lg:col-span-2">
          <BarTrend data={attendanceTrend} xKey="day" dataKey="guests" />
        </Panel>

        <Panel
          title="Próximos eventos"
          subtitle="Lo que sigue en el calendario"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/events">
                Ver todos <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-4">
            {upcoming.map((e) => (
              <li key={e.id} className="rounded-xl border border-border p-3 row-hover">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{e.name}</p>
                  <Pill tone={e.status === "sold-out" ? "success" : "primary"}>
                    {EVENT_STATUS_LABELS[e.status] ?? e.status}
                  </Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {e.artist} ·{" "}
                  {new Date(e.date).toLocaleDateString("es-AR", { month: "short", day: "numeric" })}
                </p>
                <Progress value={(e.ticketsSold / e.capacity) * 100} className="mt-3 h-1.5" />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {e.ticketsSold} / {e.capacity} entradas · {currency(e.revenue)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
