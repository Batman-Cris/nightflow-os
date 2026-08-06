import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, StatCard } from "@/components/nox/primitives";
import { AreaTrend, BarTrend } from "@/components/nox/charts";
import { Button } from "@/components/ui/button";
import { attendanceTrend, currency, revenueTrend, salesPerHour } from "@/data/demo";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — NOX OS" },
      { name: "description", content: "KPI reports with date ranges, charts and one-click exports." },
      { property: "og:title", content: "Reports — NOX OS" },
      { property: "og:description", content: "KPI reports and exports for your venue." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      description="Last 7 nights · Aug 2 – Aug 8, 2026"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => toast.success("CSV export queued.")}>
            Export CSV
          </Button>
          <Button size="sm" onClick={() => toast.success("PDF report generated.")}>
            Export PDF
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue" value={currency(168600)} delta={19.2} icon={FileBarChart} />
        <StatCard label="Profit" value={currency(70500)} delta={14.7} icon={FileBarChart} />
        <StatCard label="Guests" value="3,917" delta={11.1} icon={FileBarChart} />
        <StatCard label="Avg spend" value={currency(43)} delta={4.4} icon={FileBarChart} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue vs profit" subtitle="Per night">
          <AreaTrend
            data={revenueTrend}
            xKey="day"
            keys={[
              { key: "revenue", color: "var(--color-chart-1)" },
              { key: "profit", color: "var(--color-chart-2)" },
            ]}
          />
        </Panel>
        <Panel title="Attendance" subtitle="Guests per night">
          <BarTrend data={attendanceTrend} xKey="day" dataKey="guests" />
        </Panel>
      </div>

      <Panel className="mt-6" title="Hourly sales distribution" subtitle="Aggregated across the week">
        <AreaTrend data={salesPerHour} xKey="hour" keys={[{ key: "sales", color: "var(--color-chart-4)" }]} />
      </Panel>
    </AppShell>
  );
}
