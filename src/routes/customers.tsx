import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Cake, Crown, Users } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Input } from "@/components/ui/input";
import { currency, customers } from "@/data/demo";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — NOX OS" },
      { name: "description", content: "Guest profiles with visit history, lifetime spend, birthdays and VIP status." },
      { property: "og:title", content: "Customers — NOX OS" },
      { property: "og:description", content: "Guest profiles, spend history and VIP status." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customers[0]!.id);
  const rows = customers.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));
  const selected = customers.find((c) => c.id === selectedId)!;

  return (
    <AppShell title="Customers" description="The people who make the room.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total guests" value="4,182" delta={8.6} icon={Users} />
        <StatCard label="VIP members" value={String(customers.filter((c) => c.tier === "VIP").length * 8)} icon={Crown} />
        <StatCard label="Avg lifetime spend" value={currency(1840)} delta={5.2} icon={Users} />
        <StatCard label="Birthdays this week" value="3" icon={Cake} hint="send comps" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel
          title="Guest list"
          subtitle={`${rows.length} customers`}
          actions={
            <Input
              className="h-9 w-52"
              placeholder="Search guests…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          }
        >
          <ul className="divide-y divide-border">
            {rows.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setSelectedId(c.id)}
                  className="row-hover flex w-full items-center gap-4 px-2 py-3 text-left"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-xs font-semibold text-primary">
                    {c.name.split(" ").map((p) => p[0]).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.email}</span>
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">{c.visits} visits</span>
                  <span className="w-20 text-right text-sm font-medium">{currency(c.spent)}</span>
                  <Pill tone={c.tier === "VIP" ? "primary" : c.tier === "New" ? "success" : "muted"}>
                    {c.tier}
                  </Pill>
                </button>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Profile" subtitle={selected.name}>
          <div className="flex items-center gap-3">
            <span className="grid size-14 place-items-center rounded-2xl bg-primary/15 font-display text-lg font-bold text-primary">
              {selected.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <div>
              <p className="font-semibold">{selected.name}</p>
              <p className="text-xs text-muted-foreground">{selected.phone}</p>
            </div>
          </div>
          <dl className="mt-6 space-y-3 text-sm">
            {[
              ["Lifetime spend", currency(selected.spent)],
              ["Visits", String(selected.visits)],
              ["Last visit", selected.lastVisit],
              ["Birthday", selected.birthday],
              ["Tier", selected.tier],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-6 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground">Notes</p>
            <p className="mt-1 text-sm">{selected.notes || "No notes yet for this guest."}</p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
