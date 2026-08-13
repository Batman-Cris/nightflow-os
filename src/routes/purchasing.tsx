import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ClipboardList, Send, Truck, PackageCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency } from "@/data/demo";
import { useStock, type PurchaseOrderLine } from "@/contexts/stock-context";

export const Route = createFileRoute("/purchasing")({
  head: () => ({
    meta: [
      { title: "Compras — NOX OS" },
      {
        name: "description",
        content:
          "Generá órdenes de compra a partir de sugerencias de stock bajo y reponé el stock apenas llegan.",
      },
      { property: "og:title", content: "Compras — NOX OS" },
      {
        property: "og:description",
        content: "Órdenes a proveedores que reponen stock real al recibirlas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PurchasingPage,
});

const STATUS_LABELS: Record<string, string> = {
  draft: "borrador",
  sent: "enviada",
  received: "recibida",
};

type DraftLine = { productId: string; name: string; qty: string; unitCost: string };

function PurchasingPage() {
  const { products, purchaseOrders, createPurchaseOrder, sendPurchaseOrder, receivePurchaseOrder } =
    useStock();
  const [supplier, setSupplier] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);

  const suppliers = useMemo(() => {
    const map = new Map<string, typeof products>();
    for (const p of products) {
      map.set(p.supplier, [...(map.get(p.supplier) ?? []), p]);
    }
    return [...map.entries()]
      .map(([name, items]) => ({
        name,
        items,
        low: items.filter((p) => p.minStock > 0 && p.stock < p.minStock),
      }))
      .sort((a, b) => b.low.length - a.low.length || a.name.localeCompare(b.name));
  }, [products]);

  const openOrderFor = (name: string) => {
    const group = suppliers.find((s) => s.name === name);
    if (!group) return;
    const targets = group.low.length > 0 ? group.low : group.items;
    setLines(
      targets.map((p) => ({
        productId: p.id,
        name: p.name,
        qty: String(Math.max(p.minStock * 2 - p.stock, p.minStock || 12)),
        unitCost: String(p.cost),
      })),
    );
    setSupplier(name);
  };

  const draftTotal = lines.reduce(
    (s, l) => s + (Number(l.qty) || 0) * (Number(l.unitCost) || 0),
    0,
  );

  const saveDraft = () => {
    if (!supplier) return;
    const payload: PurchaseOrderLine[] = lines
      .map((l) => ({
        productId: l.productId,
        qty: Number(l.qty) || 0,
        unitCost: Number(l.unitCost) || 0,
      }))
      .filter((l) => l.qty > 0);
    if (payload.length === 0) {
      toast.error("Agregá al menos una línea con cantidad.");
      return;
    }
    const order = createPurchaseOrder(supplier, payload);
    setSupplier(null);
    toast.success(`${order.reference} guardada como borrador para ${supplier}.`);
  };

  const orderTotal = (l: PurchaseOrderLine[]) => l.reduce((s, x) => s + x.qty * x.unitCost, 0);
  const nameOf = (id: string) => products.find((p) => p.id === id)?.name ?? id;

  const open = purchaseOrders.filter((o) => o.status !== "received");
  const incomingUnits = open.reduce((s, o) => s + o.lines.reduce((n, l) => n + l.qty, 0), 0);
  const lowTotal = products.filter((p) => p.minStock > 0 && p.stock < p.minStock).length;

  return (
    <AppShell
      title="Compras"
      description="Compras → Stock: recibir una orden repone el estante de verdad."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Proveedores" value={String(suppliers.length)} icon={Truck} />
        <StatCard label="Órdenes abiertas" value={String(open.length)} icon={ClipboardList} />
        <StatCard label="Unidades en camino" value={String(incomingUnits)} icon={PackageCheck} />
        <StatCard
          label="Bajo el mínimo"
          value={String(lowTotal)}
          icon={AlertTriangle}
          hint="reponer ahora"
        />
      </div>

      <Panel
        className="mt-6"
        title="Proveedores"
        subtitle="Agrupados por proveedor de cada producto"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proveedor</TableHead>
              <TableHead>Productos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((s) => (
              <TableRow key={s.name} className="row-hover">
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {s.items.length} productos
                </TableCell>
                <TableCell>
                  {s.low.length > 0 ? (
                    <Pill tone="warning">{s.low.length} bajo el mínimo</Pill>
                  ) : (
                    <Pill tone="success">Stockeado</Pill>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => openOrderFor(s.name)}>
                    Generar orden
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <Panel
        className="mt-6"
        title="Órdenes de compra"
        subtitle={`${purchaseOrders.length} en total`}
      >
        {purchaseOrders.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Todavía no hay órdenes de compra"
            body="Generá una orden desde un proveedor de arriba para empezar."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referencia</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((o) => (
                <TableRow key={o.id} className="row-hover">
                  <TableCell className="font-mono text-xs">{o.reference}</TableCell>
                  <TableCell className="font-medium">{o.supplier}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.lines.length} líneas ·{" "}
                    {o.lines.map((l) => `${nameOf(l.productId)} ×${l.qty}`).join(", ")}
                  </TableCell>
                  <TableCell>{currency(orderTotal(o.lines))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.receivedAt ?? o.createdAt}
                  </TableCell>
                  <TableCell>
                    <Pill
                      tone={
                        o.status === "received"
                          ? "success"
                          : o.status === "sent"
                            ? "primary"
                            : "muted"
                      }
                    >
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Pill>
                  </TableCell>
                  <TableCell className="text-right">
                    {o.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          sendPurchaseOrder(o.id);
                          toast.success(`${o.reference} enviada a ${o.supplier}.`);
                        }}
                      >
                        <Send className="mr-1.5 size-3.5" /> Enviar
                      </Button>
                    )}
                    {o.status === "sent" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          receivePurchaseOrder(o.id);
                          toast.success(`${o.reference} recibida — stock actualizado.`);
                        }}
                      >
                        <PackageCheck className="mr-1.5 size-3.5" /> Marcar recibida
                      </Button>
                    )}
                    {o.status === "received" && (
                      <span className="text-xs text-muted-foreground">Stock actualizado</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Panel>

      <Dialog open={supplier !== null} onOpenChange={(v) => !v && setSupplier(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva orden · {supplier}</DialogTitle>
            <DialogDescription>
              Las cantidades vienen precargadas según lo que está bajo el mínimo. Ajustá lo que haga
              falta antes de guardar el borrador.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            {lines.map((l, i) => (
              <div key={l.productId} className="grid grid-cols-[1fr_90px_110px] items-end gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Producto</Label>
                  <p className="mt-1 text-sm font-medium">{l.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cant.</Label>
                  <Input
                    className="mt-1 h-9"
                    inputMode="numeric"
                    value={l.qty}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((x, xi) => (xi === i ? { ...x, qty: e.target.value } : x)),
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Costo unit.</Label>
                  <Input
                    className="mt-1 h-9"
                    inputMode="decimal"
                    value={l.unitCost}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((x, xi) => (xi === i ? { ...x, unitCost: e.target.value } : x)),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="items-center justify-between sm:justify-between">
            <span className="text-sm text-muted-foreground">
              Total <span className="font-semibold text-foreground">{currency(draftTotal)}</span>
            </span>
            <Button onClick={saveDraft}>Guardar borrador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
