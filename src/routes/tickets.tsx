import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { QrCode, Search, Ticket as TicketIcon } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currency } from "@/data/demo";
import { useTickets } from "@/contexts/tickets-context";
import type { TicketStatus } from "@/types/nox";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "Tickets — NOX OS" },
      {
        name: "description",
        content: "Every ticket sold: tiers, QR codes, check-in status and refunds in one place.",
      },
      { property: "og:title", content: "Tickets — NOX OS" },
      { property: "og:description", content: "Ticket tiers, QR codes and check-in status." },
    ],
  }),
  component: TicketsPage,
});

const tone: Record<TicketStatus, "success" | "primary" | "muted" | "danger"> = {
  valid: "primary",
  "checked-in": "success",
  used: "muted",
  refunded: "danger",
};

function TicketsPage() {
  const { tickets: rows, checkIn } = useTickets();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = rows.filter(
    (t) =>
      (tab === "all" || t.status === tab) &&
      (t.holder.toLowerCase().includes(query.toLowerCase()) ||
        t.code.toLowerCase().includes(query.toLowerCase())),
  );

  const revenue = rows.reduce((s, t) => s + t.price, 0);
  const checkedIn = rows.filter((t) => t.status === "checked-in").length;
  const vipCount = rows.filter((t) => t.tier === "VIP" || t.tier === "Backstage").length;

  return (
    <AppShell
      title="Tickets"
      description="Sold tickets, tiers and door validation status."
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.success("Ticket list exported as CSV.")}
        >
          Export list
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tickets issued" value={String(rows.length)} icon={TicketIcon} />
        <StatCard label="Checked in" value={String(checkedIn)} icon={QrCode} hint="tonight" />
        <StatCard label="VIP tickets" value={String(vipCount)} icon={TicketIcon} />
        <StatCard label="Ticket revenue" value={currency(revenue)} icon={TicketIcon} />
      </div>

      <Panel
        className="mt-6"
        title="Ticket registry"
        subtitle={`${filtered.length} results`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="valid">Valid</TabsTrigger>
                <TabsTrigger value="checked-in">Checked in</TabsTrigger>
                <TabsTrigger value="used">Used</TabsTrigger>
                <TabsTrigger value="refunded">Refunded</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-52 pl-9"
                placeholder="Name or QR code…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>QR code</TableHead>
              <TableHead>Holder</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Purchased</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id} className="row-hover">
                <TableCell>
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <QrCode className="size-4 text-primary" />
                    {t.code}
                  </span>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{t.holder}</p>
                  <p className="text-xs text-muted-foreground">{t.email}</p>
                </TableCell>
                <TableCell className="text-sm">{t.event}</TableCell>
                <TableCell>
                  <Pill tone={t.tier === "VIP" || t.tier === "Backstage" ? "primary" : "muted"}>
                    {t.tier}
                  </Pill>
                </TableCell>
                <TableCell>{t.price === 0 ? "Comp" : currency(t.price)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.purchasedAt}</TableCell>
                <TableCell>
                  <Pill tone={tone[t.status]}>{t.status}</Pill>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={t.status !== "valid"}
                    onClick={async () => {
                      const outcome = await checkIn(t.code, "Manual — Tickets");
                      if (outcome.outcome !== "invalid" && outcome.outcome !== "used") {
                        toast.success(`${t.holder} checked in.`);
                      } else {
                        toast.error(outcome.detail);
                      }
                    }}
                  >
                    Validate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </AppShell>
  );
}
