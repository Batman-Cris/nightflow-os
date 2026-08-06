import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { BarTrend } from "@/components/nox/charts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, promoters } from "@/data/demo";

export const Route = createFileRoute("/promoters")({
  head: () => ({
    meta: [
      { title: "Promoters — NOX OS" },
      { name: "description", content: "Promoter performance: guests brought, tickets sold and commissions owed." },
      { property: "og:title", content: "Promoters — NOX OS" },
      { property: "og:description", content: "Guests, tickets and commissions per promoter." },
    ],
  }),
  component: PromotersPage,
});

function PromotersPage() {
  const revenue = promoters.reduce((s, p) => s + p.revenue, 0);
  const commission = promoters.reduce((s, p) => s + p.commission, 0);
  const chart = promoters.slice(0, 6).map((p) => ({ name: p.name, value: p.guests }));

  return (
    <AppShell title="Promoters" description="Who is filling the room, and what they are owed.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active promoters" value={String(promoters.length)} icon={Megaphone} />
        <StatCard label="Guests brought" value="1,193" delta={16.4} icon={Megaphone} />
        <StatCard label="Attributed revenue" value={currency(revenue)} delta={12.8} icon={Megaphone} />
        <StatCard label="Commissions due" value={currency(commission)} icon={Megaphone} hint="paid weekly" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Leaderboard" subtitle="This month">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Promoter</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Tier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoters.map((p) => (
                <TableRow key={p.id} className="row-hover">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.code}</TableCell>
                  <TableCell>{p.guests}</TableCell>
                  <TableCell>{p.ticketsSold}</TableCell>
                  <TableCell>{currency(p.revenue)}</TableCell>
                  <TableCell className="font-medium text-primary">{currency(p.commission)}</TableCell>
                  <TableCell>
                    <Pill tone={p.tier === "Platinum" ? "primary" : p.tier === "Gold" ? "warning" : "muted"}>
                      {p.tier}
                    </Pill>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <Panel title="Guests brought" subtitle="Top 6 promoters">
          <BarTrend data={chart} xKey="name" dataKey="value" horizontal height={340} />
        </Panel>
      </div>
    </AppShell>
  );
}
