import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Boxes, PackageCheck, TrendingDown } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency } from "@/data/demo";
import { useStock } from "@/contexts/stock-context";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — NOX OS" },
      {
        name: "description",
        content:
          "Stock levels, minimums, suppliers and movement history with automatic low-stock alerts.",
      },
      { property: "og:title", content: "Inventory — NOX OS" },
      { property: "og:description", content: "Stock levels, suppliers and low-stock alerts." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { products, movements } = useStock();
  const [query, setQuery] = useState("");
  const rows = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.supplier.toLowerCase().includes(query.toLowerCase()),
  );
  const critical = products.filter((p) => p.minStock > 0 && p.stock < p.minStock);
  const stockValue = products.reduce((s, p) => s + Math.min(p.stock, 400) * p.cost, 0);

  return (
    <AppShell
      title="Inventory"
      description="Everything behind the bar, counted and watched."
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/purchasing">Create purchase order</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="SKUs tracked" value={String(products.length)} icon={Boxes} />
        <StatCard
          label="Stock value"
          value={currency(stockValue)}
          delta={-4.1}
          icon={PackageCheck}
        />
        <StatCard
          label="Below minimum"
          value={String(critical.length)}
          icon={AlertTriangle}
          hint="reorder now"
        />
        <StatCard label="Waste this week" value={currency(320)} delta={-11.5} icon={TrendingDown} />
      </div>

      {critical.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4">
          <AlertTriangle className="size-4 text-warning" />
          <p className="text-sm">
            <span className="font-semibold">{critical.length} items</span> are below minimum stock:{" "}
            {critical.map((c) => c.name).join(", ")}.
          </p>
        </div>
      )}

      <Panel
        className="mt-6"
        title="Stock levels"
        subtitle={`${rows.length} products`}
        actions={
          <Input
            className="h-9 w-56"
            placeholder="Search product or supplier…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => {
              const low = p.minStock > 0 && p.stock < p.minStock;
              const margin = Math.round(((p.price - p.cost) / p.price) * 100);
              return (
                <TableRow key={p.id} className="row-hover">
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.supplier}</TableCell>
                  <TableCell className="w-44">
                    {p.minStock === 0 ? (
                      <Pill tone="muted">Made to order</Pill>
                    ) : (
                      <>
                        <Progress
                          value={Math.min((p.stock / (p.minStock * 2)) * 100, 100)}
                          className="h-1.5"
                        />
                        <span
                          className={
                            low
                              ? "mt-1 block text-[11px] font-medium text-warning"
                              : "mt-1 block text-[11px] text-muted-foreground"
                          }
                        >
                          {p.stock} in stock · min {p.minStock}
                        </span>
                      </>
                    )}
                  </TableCell>
                  <TableCell>{currency(p.cost)}</TableCell>
                  <TableCell>{currency(p.price)}</TableCell>
                  <TableCell>
                    <Pill tone={margin > 70 ? "success" : "muted"}>{margin}%</Pill>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Panel>

      <Panel className="mt-6" title="Stock movements" subtitle="Tonight">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((m) => (
              <TableRow key={m.id} className="row-hover">
                <TableCell className="font-mono text-xs">{m.time}</TableCell>
                <TableCell className="font-medium">{m.item}</TableCell>
                <TableCell>
                  <Pill
                    tone={
                      m.type === "Restock"
                        ? "success"
                        : m.type === "Breakage"
                          ? "danger"
                          : m.type === "Recipe"
                            ? "primary"
                            : "muted"
                    }
                  >
                    {m.type}
                  </Pill>
                </TableCell>
                <TableCell className={m.qty > 0 ? "text-success" : "text-muted-foreground"}>
                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.user}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
