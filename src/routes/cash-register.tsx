import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownCircle, ArrowUpCircle, Lock, Unlock, Wallet } from "lucide-react";
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
import { useCash, type CashMethod } from "@/contexts/cash-context";

export const Route = createFileRoute("/cash-register")({
  head: () => ({
    meta: [
      { title: "Caja — NOX OS" },
      {
        name: "description",
        content:
          "Abrí la caja, mirala llenarse en vivo con las ventas de la barra, y cerrá con arqueo.",
      },
      { property: "og:title", content: "Caja — NOX OS" },
      { property: "og:description", content: "Ledger de caja en vivo con apertura y cierre." },
    ],
  }),
  component: CashRegisterPage,
});

const CASHIER = "Paula Nieves";

const METHOD_LABELS: Record<CashMethod, string> = {
  Cash: "Efectivo",
  Card: "Tarjeta",
  Transfer: "Transferencia",
  QR: "QR",
};

const TYPE_LABELS: Record<"sale" | "income" | "expense", string> = {
  sale: "Venta",
  income: "Ingreso",
  expense: "Egreso",
};

function CashRegisterPage() {
  const cash = useCash();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [entryDialog, setEntryDialog] = useState<"income" | "expense" | null>(null);

  if (!cash.isOpen) {
    return (
      <AppShell title="Caja" description="No hay ningún turno abierto ahora mismo.">
        <EmptyState
          icon={Unlock}
          title="La caja está cerrada"
          body="Abrí un nuevo turno con un monto inicial para empezar a registrar el efectivo de esta noche."
          action={
            <Button size="sm" onClick={() => setOpenDialog(true)}>
              Abrir caja
            </Button>
          }
        />
        {cash.closedSessions.length > 0 && (
          <Panel className="mt-6" title="Turnos anteriores" subtitle="Últimos cierres y su arqueo">
            <ClosedSessionsTable sessions={cash.closedSessions} />
          </Panel>
        )}
        <OpenShiftDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          onConfirm={(float) => {
            cash.openShift(float, CASHIER);
            setOpenDialog(false);
            toast.success(`Caja abierta con ${currency(float)} de fondo inicial.`);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Caja"
      description={`Abierta desde las ${cash.openedAt} · ${cash.openedBy}`}
      actions={
        <Button size="sm" variant="outline" onClick={() => setCloseDialog(true)}>
          <Lock className="mr-1.5 size-3.5" /> Cerrar caja
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fondo inicial" value={currency(cash.openingFloat)} icon={Wallet} />
        <StatCard
          label="Efectivo esperado en caja"
          value={currency(cash.expectedCash)}
          icon={Wallet}
        />
        <StatCard
          label="Tarjeta + Transferencia + QR"
          value={currency(
            cash.totalsByMethod.Card + cash.totalsByMethod.Transfer + cash.totalsByMethod.QR,
          )}
          icon={Wallet}
        />
        <StatCard label="Movimientos" value={String(cash.entries.length)} icon={Wallet} />
      </div>

      <Panel
        className="mt-6"
        title="Ledger en vivo"
        subtitle="Las ventas de la barra se cargan solas acá — agregá ingresos o egresos manuales si hace falta"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEntryDialog("income")}>
              <ArrowUpCircle className="mr-1.5 size-3.5" /> Ingreso
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEntryDialog("expense")}>
              <ArrowDownCircle className="mr-1.5 size-3.5" /> Egreso
            </Button>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cash.entries.map((e) => (
              <TableRow key={e.id} className="row-hover">
                <TableCell className="font-mono text-xs">{e.time}</TableCell>
                <TableCell>
                  <Pill
                    tone={
                      e.type === "expense" ? "danger" : e.type === "sale" ? "primary" : "success"
                    }
                  >
                    {TYPE_LABELS[e.type]}
                  </Pill>
                </TableCell>
                <TableCell className="text-sm">{METHOD_LABELS[e.method]}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.note}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.user}</TableCell>
                <TableCell
                  className={`text-right font-medium ${e.amount < 0 ? "text-destructive" : ""}`}
                >
                  {e.amount < 0 ? "-" : "+"}
                  {currency(Math.abs(e.amount))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      {cash.closedSessions.length > 0 && (
        <Panel className="mt-6" title="Turnos anteriores" subtitle="Últimos cierres y su arqueo">
          <ClosedSessionsTable sessions={cash.closedSessions} />
        </Panel>
      )}

      <EntryDialog
        type={entryDialog}
        onOpenChange={(open) => !open && setEntryDialog(null)}
        onConfirm={(amount, method, note) => {
          if (!entryDialog) return;
          cash.addEntry(entryDialog, amount, method, note, CASHIER);
          setEntryDialog(null);
          toast.success(`${entryDialog === "income" ? "Ingreso" : "Egreso"} registrado.`);
        }}
      />
      <CloseShiftDialog
        open={closeDialog}
        onOpenChange={setCloseDialog}
        expected={cash.expectedCash}
        onConfirm={(counted) => {
          cash.closeShift(counted, CASHIER);
          setCloseDialog(false);
          const diff = counted - cash.expectedCash;
          if (diff === 0) toast.success("Caja cerrada — coincide exacto.");
          else
            toast.warning(
              `Caja cerrada — ${diff > 0 ? "sobra" : "falta"} ${currency(Math.abs(diff))}.`,
            );
        }}
      />
    </AppShell>
  );
}

function ClosedSessionsTable({
  sessions,
}: {
  sessions: ReturnType<typeof useCash>["closedSessions"];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Abierta</TableHead>
          <TableHead>Cerrada</TableHead>
          <TableHead>Por</TableHead>
          <TableHead className="text-right">Esperado</TableHead>
          <TableHead className="text-right">Contado</TableHead>
          <TableHead className="text-right">Diferencia</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((s) => (
          <TableRow key={s.id} className="row-hover">
            <TableCell className="text-sm">{s.openedAt}</TableCell>
            <TableCell className="text-sm">{s.closedAt}</TableCell>
            <TableCell className="text-sm text-muted-foreground">{s.closedBy}</TableCell>
            <TableCell className="text-right text-sm">{currency(s.expectedCash)}</TableCell>
            <TableCell className="text-right text-sm">{currency(s.countedCash)}</TableCell>
            <TableCell className="text-right">
              <Pill
                tone={
                  s.difference === 0
                    ? "success"
                    : Math.abs(s.difference) <= 5
                      ? "warning"
                      : "danger"
                }
              >
                {s.difference === 0
                  ? "Exacto"
                  : `${s.difference > 0 ? "+" : ""}${currency(s.difference)}`}
              </Pill>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function OpenShiftDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (float: number) => void;
}) {
  const [float, setFloat] = useState("300");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir caja</DialogTitle>
          <DialogDescription>
            Ingresá el fondo inicial en efectivo para este turno.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Fondo inicial</Label>
          <Input
            className="mt-1.5"
            inputMode="decimal"
            value={float}
            onChange={(e) => setFloat(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={Number(float) < 0 || float === ""}
            onClick={() => onConfirm(Number(float))}
          >
            Abrir caja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EntryDialog({
  type,
  onOpenChange,
  onConfirm,
}: {
  type: "income" | "expense" | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, method: CashMethod, note: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const method: CashMethod = "Cash";

  return (
    <Dialog
      open={type !== null}
      onOpenChange={(next) => {
        if (!next) {
          setAmount("");
          setNote("");
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "expense" ? "Registrar un egreso" : "Registrar un ingreso"}
          </DialogTitle>
          <DialogDescription>
            {type === "expense"
              ? "Efectivo que sale de la caja — repartos, propinas, gastos chicos, etc."
              : "Efectivo que entra a la caja fuera de una venta de la barra."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Monto</Label>
            <Input
              className="mt-1.5"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Nota</Label>
            <Input
              className="mt-1.5"
              placeholder="ej. Reparto de hielo"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={Number(amount) <= 0 || note.trim() === ""}
            onClick={() => onConfirm(Number(amount), method, note.trim())}
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseShiftDialog({
  open,
  onOpenChange,
  expected,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expected: number;
  onConfirm: (counted: number) => void;
}) {
  const [counted, setCounted] = useState("");
  const diff = counted === "" ? null : Number(counted) - expected;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setCounted("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar caja — arqueo ciego</DialogTitle>
          <DialogDescription>
            Contá el efectivo de la caja sin mirar el total esperado, y después ingresalo abajo.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Efectivo contado</Label>
          <Input
            className="mt-1.5"
            inputMode="decimal"
            value={counted}
            onChange={(e) => setCounted(e.target.value)}
          />
          {diff !== null && (
            <p
              className={`mt-2 text-xs font-medium ${
                diff === 0
                  ? "text-success"
                  : Math.abs(diff) <= 5
                    ? "text-warning"
                    : "text-destructive"
              }`}
            >
              {diff === 0
                ? "Coincide exacto con lo esperado."
                : `${diff > 0 ? "Sobra" : "Falta"} ${currency(Math.abs(diff))}.`}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={counted === "" || Number(counted) < 0}
            onClick={() => onConfirm(Number(counted))}
          >
            Cerrar caja
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
