import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Banknote, CreditCard, Minus, Plus, QrCode, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, Pill } from "@/components/nox/primitives";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { currency, posCategories, products } from "@/data/demo";

export const Route = createFileRoute("/pos")({
  head: () => ({
    meta: [
      { title: "POS — NOX OS" },
      {
        name: "description",
        content: "A bar-speed point of sale: big product cards, instant cart and four payment methods.",
      },
      { property: "og:title", content: "POS — NOX OS" },
      { property: "og:description", content: "Bar-speed point of sale for busy nights." },
    ],
  }),
  component: PosPage,
});

const methods = [
  { key: "Cash", icon: Banknote },
  { key: "Card", icon: CreditCard },
  { key: "Transfer", icon: CreditCard },
  { key: "QR", icon: QrCode },
] as const;

function PosPage() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({ p04: 2, p03: 1 });
  const [payOpen, setPayOpen] = useState(false);

  const visible = products.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => ({ product: products.find((p) => p.id === id)!, qty }))
        .filter((l) => l.product),
    [cart],
  );
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const tax = subtotal * 0.21;

  const add = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const remove = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) delete next[id];
      else next[id] = qty;
      return next;
    });

  return (
    <AppShell
      title="Point of sale"
      description="Bar 2 · Paula Nieves · shift started 21:00"
      actions={<Pill tone="success">Terminal connected</Pill>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 pl-9"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {posCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
                  category === c
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                className="surface-card group p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:glow-ring"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.category}
                  </span>
                  <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    <Plus className="size-4" />
                  </span>
                </div>
                <p className="mt-6 text-base font-semibold leading-tight">{p.name}</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary">
                  {currency(p.price)}
                </p>
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="mt-6">
              <EmptyState
                icon={Search}
                title="No products match"
                body="Try another category or clear the search field."
              />
            </div>
          )}
        </div>

        <aside className="surface-card sticky top-24 flex h-fit flex-col p-5">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart className="size-4" /> Current order
            </h2>
            {lines.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCart({})}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {lines.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Tap a product to start an order.
              </p>
            )}
            {lines.map((l) => (
              <div key={l.product.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{l.product.name}</p>
                  <p className="text-xs text-muted-foreground">{currency(l.product.price)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => remove(l.product.id)}>
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-5 text-center text-sm font-semibold">{l.qty}</span>
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => add(l.product.id)}>
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax (21%)</span>
              <span>{currency(tax)}</span>
            </div>
            <div className="flex justify-between pt-2 font-display text-xl font-bold">
              <span>Total</span>
              <span>{currency(subtotal + tax)}</span>
            </div>
          </div>

          <Button
            className="mt-5 h-11"
            disabled={lines.length === 0}
            onClick={() => setPayOpen(true)}
          >
            Charge {currency(subtotal + tax)}
          </Button>
        </aside>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take payment</DialogTitle>
            <DialogDescription>
              {lines.length} items · {currency(subtotal + tax)} due
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {methods.map((m) => (
              <button
                key={m.key}
                onClick={() => {
                  setPayOpen(false);
                  setCart({});
                  toast.success(`Payment of ${currency(subtotal + tax)} accepted via ${m.key}.`);
                }}
                className="flex flex-col items-center gap-2 rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
              >
                <m.icon className="size-6 text-primary" />
                <span className="text-sm font-medium">{m.key}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
