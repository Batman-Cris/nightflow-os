import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, StatCard } from "@/components/nox/primitives";
import { AreaTrend, BarTrend, LineTrend } from "@/components/nox/charts";
import { attendanceTrend, currency, popularProducts, revenueTrend, salesPerHour } from "@/data/demo";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NOX OS" },
      { name: "description", content: "Deep venue analytics: retention, spend per guest, peak hours and product mix." },
      { property: "og:title", content: "Analytics — NOX OS" },
      { property: "og:description", content: "Retention, spend per guest and peak-hour analytics." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <AppShell title="Analytics" description="How the venue behaves, beyond tonight.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Returning guests" value="38%" delta={6.3} icon={TrendingUp} />
        <StatCard label="Spend per guest" value={currency(51)} delta={3.9} icon={TrendingUp} />
        <StatCard label="Peak hour" value="01:00" icon={TrendingUp} hint={currency(15200)} />
        <StatCard label="Capacity usage" value="96%" delta={2.1} icon={TrendingUp} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue trend" subtitle="Last 7 nights">
          <AreaTrend data={revenueTrend} xKey="day" keys={[{ key: "revenue", color: "var(--color-chart-1)" }]} />
        </Panel>
        <Panel title="Tickets scanned per hour" subtitle="Door throughput">
          <LineTrend data={salesPerHour} xKey="hour" dataKey="tickets" />
        </Panel>
        <Panel title="Attendance" subtitle="Guests per night">
          <BarTrend data={attendanceTrend} xKey="day" dataKey="guests" />
        </Panel>
        <Panel title="Product mix" subtitle="Units sold">
          <BarTrend data={popularProducts} xKey="name" dataKey="value" horizontal />
        </Panel>
      </div>
    </AppShell>
  );
}
