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
import { currency } from "@/data/demo";
import { hourlySales } from "@/lib/dashboard-metrics";
import { useStock } from "@/contexts/stock-context";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Ventas — NOX OS" },
      {
        name: "description",
        content: "Cada transacción de barra, puerta, VIP y online, con ingresos por hora en vivo.",
      },
      { property: "og:title", content: "Ventas — NOX OS" },
      {
        property: "og:description",
        content: "Transacciones en vivo de barra, puerta, VIP y online.",
      },
    ],
  }),
  component: SalesPage,
});

const CHANNEL_LABELS: Record<string, string> = {
  POS: "Barra",
  Online: "Online",
  Door: "Puerta",
  VIP: "VIP",
};

const METHOD_LABELS: Record<string, string> = {
  Cash: "Efectivo",
  Card: "Tarjeta",
  Transfer: "Transferencia",
  QR: "QR",
};

function SalesPage() {
  const { sales } = useStock();
  const [query, setQuery] = useState("");
  const rows = sales.filter(
    (s) =>
      s.cashier.toLowerCase().includes(query.toLowerCase()) ||
      s.channel.toLowerCase().includes(query.toLowerCase()),
  );

  const hourly = hourlySales(sales);

  const gross = sales.reduce((s, sale) => s + sale.total, 0);
  const cardVolume = sales
    .filter((s) => s.method === "Card" || s.method === "Transfer")
    .reduce((s, sale) => s + sale.total, 0);
  const cashVolume = sales
    .filter((s) => s.method === "Cash")
    .reduce((s, sale) => s + sale.total, 0);
  const pct = (n: number) => (gross > 0 ? `${((n / gross) * 100).toFixed(1)}% del total` : "");

  return (
    <AppShell
      title="Ventas"
      description="Flujo de transacciones en vivo de la operación de esta noche."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas totales" value={currency(gross)} delta={18.4} icon={DollarSign} />
        <StatCard
          label="Volumen con tarjeta"
          value={currency(cardVolume)}
          delta={22.1}
          icon={CreditCard}
          hint={pct(cardVolume)}
        />
        <StatCard
          label="Volumen en efectivo"
          value={currency(cashVolume)}
          delta={-6.2}
          icon={Wallet}
          hint={pct(cashVolume)}
        />
        <StatCard label="Transacciones" value={String(sales.length)} delta={9.4} icon={Receipt} />
      </div>

      <Panel className="mt-6" title="Ingresos por hora" subtitle="Barra, puerta y VIP combinados">
        <AreaTrend
          data={hourly}
          xKey="hour"
          keys={[{ key: "sales", color: "var(--color-chart-1)" }]}
          height={260}
        />
      </Panel>

      <Panel
        className="mt-6"
        title="Transacciones recientes"
        subtitle={`${rows.length} de ${sales.length}`}
        actions={
          <Input
            className="h-9 w-56"
            placeholder="Filtrar por cajero o canal…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Cajero</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id} className="row-hover">
                <TableCell className="font-mono text-xs">{s.time}</TableCell>
                <TableCell>
                  <Pill tone={s.channel === "VIP" ? "primary" : "muted"}>
                    {CHANNEL_LABELS[s.channel] ?? s.channel}
                  </Pill>
                </TableCell>
                <TableCell>{s.items}</TableCell>
                <TableCell className="text-sm">{METHOD_LABELS[s.method] ?? s.method}</TableCell>
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
