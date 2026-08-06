import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { BarTrend } from "@/components/nox/charts";
import { currency, popularProducts, products } from "@/data/demo";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — NOX OS" },
      { name: "description", content: "Your full menu: pricing, margins and units sold per product." },
      { property: "og:title", content: "Products — NOX OS" },
      { property: "og:description", content: "Menu pricing, margins and best sellers." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const revenue = products.reduce((s, p) => s + p.sold * p.price, 0);
  return (
    <AppShell title="Products" description="Your menu, priced for margin.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active products" value={String(products.length)} icon={Package} />
        <StatCard label="Menu revenue" value={currency(revenue)} delta={13.9} icon={Package} />
        <StatCard label="Best seller" value="Corona" icon={Package} hint="744 units" />
        <StatCard label="Avg margin" value="79%" delta={2.3} icon={Package} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Catalogue" subtitle="Sorted by units sold">
          <div className="grid gap-4 sm:grid-cols-2">
            {[...products]
              .sort((a, b) => b.sold - a.sold)
              .map((p) => (
                <div key={p.id} className="rounded-xl border border-border p-4 row-hover">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{p.name}</p>
                    <Pill tone="muted">{p.category}</Pill>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <span className="font-display text-xl font-bold text-primary">
                      {currency(p.price)}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.sold} sold</span>
                  </div>
                </div>
              ))}
          </div>
        </Panel>
        <Panel title="Top sellers" subtitle="Units sold tonight">
          <BarTrend data={popularProducts} xKey="name" dataKey="value" horizontal height={320} />
        </Panel>
      </div>
    </AppShell>
  );
}
