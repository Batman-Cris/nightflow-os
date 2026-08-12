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
// `events` is still demo data — events aren't migrated to the database yet.
import { currency, events } from "@/data/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NOX OS" },
      {
        name: "description",
        content:
          "Live revenue, attendance, ticket sales and stock alerts for your venue, in one executive dashboard.",
      },
      { property: "og:title", content: "Dashboard — NOX OS" },
      {
        property: "og:description",
        content: "Live revenue, attendance and ticket sales for your nightlife venue.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { products, sales, movements } = useStock();
  const { tickets } = useTickets();

  const upcoming = events.filter((e) => e.status === "scheduled" || e.status === "sold-out").slice(0, 4);
  const critical = products.filter((p) => p.minStock > 0 && p.stock < p.minStock);

  // 1. Revenue today — sales rows created today.
  const todaySales = sales.filter((s) => isToday(s.createdAt));
  const revenueToday = todaySales.reduce((sum, s) => sum + s.total, 0);

  // 8. Estimated profit — revenue minus the cost of goods implied by Sale/Recipe
  // stock movements valued at each product's `cost`. Movements are matched to
  // products by name, so this is an estimate, not accounting-grade COGS.
  const costByName = new Map(products.map((p) => [p.name, p.cost]));
  const estimatedCost = movements
    .filter((m) => m.type === "Sale" || m.type === "Recipe")
    .reduce((sum, m) => sum + Math.abs(m.qty) * (costByName.get(m.item) ?? 0), 0);
  const grossRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const estimatedProfit = grossRevenue - estimatedCost;
  const margin = grossRevenue > 0 ? (estimatedProfit / grossRevenue) * 100 : 0;

  // 2. People inside — this counts tickets checked in at the door. There is no
  // exit scan yet, so it is a check-in total rather than a live in/out count.
  const checkedIn = tickets.filter((t) => t.status === "checked-in").length;

  // 3. Tickets sold — every ticket issued, with sell-through against the total.
  const ticketsSold = tickets.filter((t) => t.status !== "refunded").length;
  const sellThrough = tickets.length > 0 ? (ticketsSold / tickets.length) * 100 : 0;
  const ticketRevenue = tickets
    .filter((t) => t.status !== "refunded")
    .reduce((sum, t) => sum + t.price, 0);
  const averageTicket = ticketsSold > 0 ? ticketRevenue / ticketsSold : 0;
  const barSpendPerGuest = checkedIn > 0 ? grossRevenue / checkedIn : 0;

  // 5. Sales per hour — real hourly buckets from the sales table.
  const hourly = hourlySales(sales);

  // 6. Recent activity — merged stock movements, sales and ticket check-ins.
  const feed = [
    ...movements.map((m) => ({
      id: `m_${m.id}`,
      at: m.createdAt ?? "",
      time: m.time,
      text:
        m.type === "Restock"
          ? `Restocked ${m.qty} × ${m.item} (${m.user})`
          : m.type === "Breakage"
            ? `Breakage logged: ${Math.abs(m.qty)} × ${m.item}`
            : `${Math.abs(m.qty)} × ${m.item} consumed (${m.type})`,
      tone: m.type === "Restock" ? "success" : m.type === "Breakage" ? "danger" : "muted",
    })),
    ...sales.map((s) => ({
      id: `s_${s.id}`,
      at: s.createdAt ?? "",
      time: s.time,
      text: `${s.channel} sale · ${s.items} items · ${currency(s.total)} (${s.method}, ${s.cashier})`,
      tone: "success",
    })),
    ...tickets
      .filter((t) => t.status === "checked-in" && t.checkedInAt)
      .map((t) => ({
        id: `t_${t.id}`,
        at: t.checkedInAt ?? "",
        time: (t.checkedInAt ?? "").slice(0, 5),
        text: `${t.holder} checked in · ${t.tier}`,
        tone: "primary",
      })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))
    .slice(0, 8);

  // 7. Popular products — units sold, straight from products.sold.
  const popular = [...products]
    .filter((p) => p.sold > 0)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6)
    .map((p) => ({ name: p.name, value: p.sold }));

  // 9. Daily aggregates over the last 7 days. With one night of seed data this
  // will legitimately show a single populated day.
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
      title="Tonight at NOX"
      description="Live operation · Neon Cathedral · doors open 23:30"
      actions={
        <>
          <Button variant="outline" size="sm">
            Export night report
          </Button>
          <Button size="sm" asChild>
            <Link to="/pos">Open POS</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={currency(revenueToday)}
          icon={DollarSign}
          hint={`${todaySales.length} transactions today`}
        />
        <StatCard
          label="Estimated profit"
          value={currency(estimatedProfit)}
          icon={TrendingUp}
          hint={`${margin.toFixed(1)}% estimated margin`}
        />
        <StatCard
          label="People inside"
          value={String(checkedIn)}
          icon={Users}
          hint="tickets checked in (no exit scan)"
        />
        <StatCard
          label="Tickets sold"
          value={String(ticketsSold)}
          icon={TicketIcon}
          hint={`${sellThrough.toFixed(0)}% sell-through`}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average ticket" value={currency(averageTicket)} icon={Receipt} hint="per guest spend" />
        <StatCard
          label="Bar spend / guest"
          value={currency(barSpendPerGuest)}
          icon={DollarSign}
          hint="sales per checked-in guest"
        />
        <StatCard label="Critical stock" value={String(critical.length)} icon={AlertTriangle} hint="items below minimum" />
        <StatCard label="Upcoming events" value={String(upcoming.length)} icon={CalendarDays} hint="next 14 days" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel
          title="Sales per hour"
          subtitle="Bar + door revenue, live"
          className="lg:col-span-2"
          actions={<Pill tone="primary">Live</Pill>}
        >
          <AreaTrend
            data={hourly}
            xKey="hour"
            keys={[{ key: "sales", color: "var(--color-chart-1)" }]}
            height={280}
          />
        </Panel>

        <Panel title="Recent activity" subtitle="Live feed">
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
              <li className="text-sm text-muted-foreground">No activity yet tonight.</li>
            ) : null}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Revenue & profit" subtitle="Last 7 days" className="lg:col-span-2">
          <AreaTrend
            data={revenueTrend}
            xKey="day"
            keys={[
              { key: "revenue", color: "var(--color-chart-1)" },
              { key: "profit", color: "var(--color-chart-2)" },
            ]}
          />
        </Panel>
        <Panel title="Popular products" subtitle="Units sold tonight">
          <BarTrend data={popular} xKey="name" dataKey="value" horizontal />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Attendance" subtitle="Tickets purchased per day" className="lg:col-span-2">
          <BarTrend data={attendanceTrend} xKey="day" dataKey="guests" />
        </Panel>

        <Panel
          title="Upcoming events"
          subtitle="Next on the calendar"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link to="/events">
                All <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          }
        >
          <ul className="space-y-4">
            {upcoming.map((e) => (
              <li key={e.id} className="rounded-xl border border-border p-3 row-hover">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{e.name}</p>
                  <Pill tone={e.status === "sold-out" ? "success" : "primary"}>{e.status}</Pill>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {e.artist} · {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <Progress value={(e.ticketsSold / e.capacity) * 100} className="mt-3 h-1.5" />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {e.ticketsSold} / {e.capacity} tickets · {currency(e.revenue)}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppShell>
  );
}
