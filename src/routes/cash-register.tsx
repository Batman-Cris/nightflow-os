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
      { title: "Cash Register — NOX OS" },
      {
        name: "description",
        content: "Open the till, watch it fill live from POS sales, and close with a blind count.",
      },
      { property: "og:title", content: "Cash Register — NOX OS" },
      { property: "og:description", content: "Live cash ledger with open/close reconciliation." },
    ],
  }),
  component: CashRegisterPage,
});

const CASHIER = "Paula Nieves";

function CashRegisterPage() {
  const cash = useCash();
  const [openDialog, setOpenDialog] = useState(false);
  const [closeDialog, setCloseDialog] = useState(false);
  const [entryDialog, setEntryDialog] = useState<"income" | "expense" | null>(null);

  if (!cash.isOpen) {
    return (
      <AppShell title="Cash Register" description="No shift is currently open.">
        <EmptyState
          icon={Unlock}
          title="The register is closed"
          body="Open a new shift with a starting float to begin tracking cash for tonight."
          action={
            <Button size="sm" onClick={() => setOpenDialog(true)}>
              Open register
            </Button>
          }
        />
        {cash.closedSessions.length > 0 && (
          <Panel
            className="mt-6"
            title="Past sessions"
            subtitle="Last closes and their reconciliation"
          >
            <ClosedSessionsTable sessions={cash.closedSessions} />
          </Panel>
        )}
        <OpenShiftDialog
          open={openDialog}
          onOpenChange={setOpenDialog}
          onConfirm={(float) => {
            cash.openShift(float, CASHIER);
            setOpenDialog(false);
            toast.success(`Register opened with ${currency(float)} float.`);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Cash Register"
      description={`Open since ${cash.openedAt} · ${cash.openedBy}`}
      actions={
        <Button size="sm" variant="outline" onClick={() => setCloseDialog(true)}>
          <Lock className="mr-1.5 size-3.5" /> Close register
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Opening float" value={currency(cash.openingFloat)} icon={Wallet} />
        <StatCard
          label="Cash in drawer (expected)"
          value={currency(cash.expectedCash)}
          icon={Wallet}
        />
        <StatCard
          label="Card + Transfer + QR"
          value={currency(
            cash.totalsByMethod.Card + cash.totalsByMethod.Transfer + cash.totalsByMethod.QR,
          )}
          icon={Wallet}
        />
        <StatCard label="Ledger entries" value={String(cash.entries.length)} icon={Wallet} />
      </div>

      <Panel
        className="mt-6"
        title="Live ledger"
        subtitle="POS sales post here automatically — add manual income or expenses as needed"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEntryDialog("income")}>
              <ArrowUpCircle className="mr-1.5 size-3.5" /> Income
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEntryDialog("expense")}>
              <ArrowDownCircle className="mr-1.5 size-3.5" /> Expense
            </Button>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Note</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Amount</TableHead>
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
                    {e.type}
                  </Pill>
                </TableCell>
                <TableCell className="text-sm">{e.method}</TableCell>
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
        <Panel
          className="mt-6"
          title="Past sessions"
          subtitle="Last closes and their reconciliation"
        >
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
          toast.success(`${entryDialog === "income" ? "Income" : "Expense"} logged.`);
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
          if (diff === 0) toast.success("Register closed — drawer matched exactly.");
          else
            toast.warning(
              `Register closed — ${diff > 0 ? "over" : "short"} by ${currency(Math.abs(diff))}.`,
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
          <TableHead>Opened</TableHead>
          <TableHead>Closed</TableHead>
          <TableHead>By</TableHead>
          <TableHead className="text-right">Expected</TableHead>
          <TableHead className="text-right">Counted</TableHead>
          <TableHead className="text-right">Difference</TableHead>
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
                  ? "Exact"
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
          <DialogTitle>Open register</DialogTitle>
          <DialogDescription>Enter the starting cash float for this shift.</DialogDescription>
        </DialogHeader>
        <div>
          <Label>Opening float</Label>
          <Input
            className="mt-1.5"
            inputMode="decimal"
            value={float}
            onChange={(e) => setFloat(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={Number(float) < 0 || float === ""}
            onClick={() => onConfirm(Number(float))}
          >
            Open register
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
          <DialogTitle>{type === "expense" ? "Log an expense" : "Log income"}</DialogTitle>
          <DialogDescription>
            {type === "expense"
              ? "Cash paid out of the drawer — deliveries, tips, petty cash, etc."
              : "Cash added to the drawer outside of a POS sale."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Amount</Label>
            <Input
              className="mt-1.5"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label>Note</Label>
            <Input
              className="mt-1.5"
              placeholder="e.g. Ice delivery"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={Number(amount) <= 0 || note.trim() === ""}
            onClick={() => onConfirm(Number(amount), method, note.trim())}
          >
            Save
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
          <DialogTitle>Close register — blind count</DialogTitle>
          <DialogDescription>
            Count the cash in the drawer without looking at the expected total, then enter it below.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Counted cash</Label>
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
                ? "Matches expected exactly."
                : `${diff > 0 ? "Over" : "Short"} by ${currency(Math.abs(diff))}.`}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={counted === "" || Number(counted) < 0}
            onClick={() => onConfirm(Number(counted))}
          >
            Close register
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
