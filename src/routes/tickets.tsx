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
import type { TicketStatus, TicketTier } from "@/types/nox";

export const Route = createFileRoute("/tickets")({
  head: () => ({
    meta: [
      { title: "Entradas — NOX OS" },
      {
        name: "description",
        content:
          "Cada entrada vendida: tipo, código QR, estado de ingreso y reembolsos en un solo lugar.",
      },
      { property: "og:title", content: "Entradas — NOX OS" },
      { property: "og:description", content: "Tipos de entrada, códigos QR y estado de ingreso." },
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

const STATUS_LABELS: Record<TicketStatus, string> = {
  valid: "Válida",
  "checked-in": "Ingresó",
  used: "Usada",
  refunded: "Reembolsada",
};

const TIER_LABELS: Record<TicketTier, string> = {
  General: "General",
  "Early Bird": "Preventa",
  VIP: "VIP",
  "Guest List": "Lista de invitados",
  Backstage: "Backstage",
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
      title="Entradas"
      description="Entradas vendidas, tipos y estado de validación en la puerta."
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => toast.success("Lista de entradas exportada como CSV.")}
        >
          Exportar lista
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Entradas emitidas" value={String(rows.length)} icon={TicketIcon} />
        <StatCard label="Ya ingresaron" value={String(checkedIn)} icon={QrCode} hint="esta noche" />
        <StatCard label="Entradas VIP" value={String(vipCount)} icon={TicketIcon} />
        <StatCard label="Recaudación" value={currency(revenue)} icon={TicketIcon} />
      </div>

      <Panel
        className="mt-6"
        title="Registro de entradas"
        subtitle={`${filtered.length} resultados`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="valid">Válidas</TabsTrigger>
                <TabsTrigger value="checked-in">Ingresaron</TabsTrigger>
                <TabsTrigger value="used">Usadas</TabsTrigger>
                <TabsTrigger value="refunded">Reembolsadas</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 w-52 pl-9"
                placeholder="Nombre o código QR…"
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
              <TableHead>Código QR</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Precio</TableHead>
              <TableHead>Comprada</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ingreso</TableHead>
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
                    {TIER_LABELS[t.tier]}
                  </Pill>
                </TableCell>
                <TableCell>{t.price === 0 ? "Cortesía" : currency(t.price)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.purchasedAt}</TableCell>
                <TableCell>
                  <Pill tone={tone[t.status]}>{STATUS_LABELS[t.status]}</Pill>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={t.status !== "valid"}
                    onClick={async () => {
                      const outcome = await checkIn(t.code, "Manual — Entradas");
                      if (outcome.outcome !== "invalid" && outcome.outcome !== "used") {
                        toast.success(`${t.holder} ingresó.`);
                      } else {
                        toast.error(outcome.detail);
                      }
                    }}
                  >
                    Validar
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
