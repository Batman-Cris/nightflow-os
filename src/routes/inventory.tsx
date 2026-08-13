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
import { useStock, type MovementType } from "@/contexts/stock-context";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Stock — NOX OS" },
      {
        name: "description",
        content:
          "Niveles de stock, mínimos, proveedores e historial de movimientos con alertas automáticas.",
      },
      { property: "og:title", content: "Stock — NOX OS" },
      { property: "og:description", content: "Niveles de stock, proveedores y alertas." },
    ],
  }),
  component: InventoryPage,
});

const MOVEMENT_LABELS: Record<MovementType, string> = {
  Sale: "Venta",
  Recipe: "Receta",
  Restock: "Reposición",
  Breakage: "Rotura",
};

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
      title="Stock"
      description="Todo lo que hay detrás de la barra, contado y vigilado."
      actions={
        <Button size="sm" variant="outline" asChild>
          <Link to="/purchasing">Generar orden de compra</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Productos cargados" value={String(products.length)} icon={Boxes} />
        <StatCard
          label="Valor del stock"
          value={currency(stockValue)}
          delta={-4.1}
          icon={PackageCheck}
        />
        <StatCard
          label="Bajo el mínimo"
          value={String(critical.length)}
          icon={AlertTriangle}
          hint="reponer ahora"
        />
        <StatCard
          label="Merma esta semana"
          value={currency(320)}
          delta={-11.5}
          icon={TrendingDown}
        />
      </div>

      {critical.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4">
          <AlertTriangle className="size-4 text-warning" />
          <p className="text-sm">
            <span className="font-semibold">{critical.length} productos</span> están bajo el stock
            mínimo: {critical.map((c) => c.name).join(", ")}.
          </p>
        </div>
      )}

      <Panel
        className="mt-6"
        title="Niveles de stock"
        subtitle={`${rows.length} productos`}
        actions={
          <Input
            className="h-9 w-56"
            placeholder="Buscar producto o proveedor…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Margen</TableHead>
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
                      <Pill tone="muted">Por pedido</Pill>
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
                          {p.stock} en stock · mín {p.minStock}
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

      <Panel className="mt-6" title="Movimientos de stock" subtitle="Esta noche">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Usuario</TableHead>
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
                    {MOVEMENT_LABELS[m.type]}
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
