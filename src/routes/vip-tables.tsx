import { createFileRoute } from "@tanstack/react-router";
import { Crown } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Pill, StatCard } from "@/components/nox/primitives";
import { Progress } from "@/components/ui/progress";
import { currency, vipTables } from "@/data/demo";

export const Route = createFileRoute("/vip-tables")({
  head: () => ({
    meta: [
      { title: "VIP Tables — NOX OS" },
      { name: "description", content: "Live table map: hosts, minimum spend, current spend and availability." },
      { property: "og:title", content: "VIP Tables — NOX OS" },
      { property: "og:description", content: "Live table map with hosts and minimum spend." },
    ],
  }),
  component: VipTablesPage,
});

const tone = {
  occupied: "primary",
  reserved: "warning",
  open: "success",
  closed: "muted",
} as const;

function VipTablesPage() {
  const spend = vipTables.reduce((s, t) => s + t.spend, 0);
  return (
    <AppShell title="VIP tables" description="Bottle service, live by zone.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tables" value={String(vipTables.length)} icon={Crown} />
        <StatCard label="Occupied" value={String(vipTables.filter((t) => t.status === "occupied").length)} icon={Crown} />
        <StatCard label="VIP spend tonight" value={currency(spend)} delta={24.6} icon={Crown} />
        <StatCard label="Avg per table" value={currency(Math.round(spend / 5))} delta={9.1} icon={Crown} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vipTables.map((t) => (
          <div key={t.id} className="surface-card p-5 transition-transform duration-200 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.zone} · {t.seats} seats
                </p>
              </div>
              <Pill tone={tone[t.status]}>{t.status}</Pill>
            </div>
            <p className="mt-4 text-sm">
              {t.host ? (
                <span className="font-medium">{t.host}</span>
              ) : (
                <span className="text-muted-foreground">Available tonight</span>
              )}
            </p>
            <Progress value={Math.min((t.spend / t.minSpend) * 100, 100)} className="mt-4 h-1.5" />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {currency(t.spend)} of {currency(t.minSpend)} minimum
            </p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
