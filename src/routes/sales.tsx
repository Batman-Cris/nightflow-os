import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, DollarSign, Receipt, Wallet } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { AreaTrend } from "@/components/nox/charts";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency, sales, salesPerHour } from "@/data/demo";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — NOX OS" },
      {
        name: "description",
        content: "Every transaction across bar, door, VIP and online, with live hourly revenue.",
      },
      { property: "og:title", content: "Sales — NOX OS" },
      { property: "og:description", content: "Live transactions across bar, door, VIP and online." },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const [query, setQuery] = useState("");
  const rows = sales.filter(
    (s) =>
      s.cashier.toLowerCase().includes(query.toLowerCase()) ||
      s.channel.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <AppShell title="Sales" description="Live transaction stream for tonight's operation.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross sales" value={currency(58400)} delta={18.4} icon={DollarSign} />
        <StatCard label="Card volume" value={currency(41200)} delta={22.1} icon={CreditCard} hint="70.5% of total" />
        <StatCard label="Cash volume" value={currency(9800)} delta={-6.2} icon={Wallet} hint="16.8% of total" />
        <StatCard label="Transactions" value="1,482" delta={9.4} icon={Receipt} />
      </div>

      <Panel className="mt-6" title="Revenue by hour" subtitle="Bar, door and VIP combined">
        <AreaTrend
          data={salesPerHour}
          xKey="hour"
          keys={[{ key: "sales", color: "var(--color-chart-1)" }]}
          height={260}
        />
      </Panel>

      <Panel
        className="mt-6"
        title="Recent transactions"
        subtitle={`${rows.length} of ${sales.length}`}
        actions={
          <Input
            className="h-9 w-56"
            placeholder="Filter by cashier or channel…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id} className="row-hover">
                <TableCell className="font-mono text-xs">{s.time}</TableCell>
                <TableCell>
                  <Pill tone={s.channel === "VIP" ? "primary" : "muted"}>{s.channel}</Pill>
                </TableCell>
                <TableCell>{s.items}</TableCell>
                <TableCell className="text-sm">{s.method}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.cashier}</TableCell>
                <TableCell className="text-right font-medium">{currency(s.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
