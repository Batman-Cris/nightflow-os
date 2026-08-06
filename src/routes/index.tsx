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
import {
  activity,
  attendanceTrend,
  currency,
  events,
  popularProducts,
  products,
  revenueTrend,
  salesPerHour,
} from "@/data/demo";

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
  const upcoming = events.filter((e) => e.status === "scheduled" || e.status === "sold-out").slice(0, 4);
  const critical = products.filter((p) => p.minStock > 0 && p.stock < p.minStock);

  return (
    <AppShell
      title="Tonight at NOX"
      description="Saturday, August 8 · Neon Cathedral · doors open 23:30"
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
        <StatCard label="Revenue today" value={currency(58400)} delta={18.4} icon={DollarSign} hint="vs last Saturday" />
        <StatCard label="Estimated profit" value={currency(26100)} delta={12.1} icon={TrendingUp} hint="44.7% margin" />
        <StatCard label="People inside" value="1,147" delta={4.2} icon={Users} hint="of 1,200 capacity" />
        <StatCard label="Tickets sold" value="1,180" delta={9.8} icon={TicketIcon} hint="98% sell-through" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average ticket" value={currency(49)} delta={3.6} icon={Receipt} hint="per guest spend" />
        <StatCard label="Bar spend / guest" value={currency(32)} delta={-2.4} icon={DollarSign} hint="drinks only" />
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
            data={salesPerHour}
            xKey="hour"
            keys={[{ key: "sales", color: "var(--color-chart-1)" }]}
            height={280}
          />
        </Panel>

        <Panel title="Recent activity" subtitle="Last 90 minutes">
          <ul className="space-y-4">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-3">
                <span
                  className={
                    a.tone === "success"
                      ? "mt-1.5 size-2 shrink-0 rounded-full bg-success"
                      : a.tone === "warning"
                        ? "mt-1.5 size-2 shrink-0 rounded-full bg-warning"
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
          <BarTrend data={popularProducts} xKey="name" dataKey="value" horizontal />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Attendance" subtitle="Guests per night" className="lg:col-span-2">
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
