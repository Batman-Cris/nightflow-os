import { useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Crown, ScanLine, ShieldAlert, UserCheck, XCircle } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTickets, type CheckInOutcome, type CheckInResult } from "@/contexts/tickets-context";

export const Route = createFileRoute("/access-control")({
  head: () => ({
    meta: [
      { title: "Access Control — NOX OS" },
      {
        name: "description",
        content:
          "Scan real ticket codes at the door: instant valid, VIP, guest and duplicate results.",
      },
      { property: "og:title", content: "Access Control — NOX OS" },
      { property: "og:description", content: "Door scanning against real ticket data." },
    ],
  }),
  component: AccessControlPage,
});

const styles: Record<
  CheckInOutcome,
  { ring: string; text: string; label: string; icon: typeof CheckCircle2 }
> = {
  valid: {
    ring: "border-success/50 bg-success/10",
    text: "text-success",
    label: "Access granted",
    icon: CheckCircle2,
  },
  vip: {
    ring: "border-primary/50 bg-primary/10",
    text: "text-primary",
    label: "VIP guest",
    icon: Crown,
  },
  guest: {
    ring: "border-chart-4/50 bg-chart-4/10",
    text: "text-chart-4",
    label: "Guest list",
    icon: UserCheck,
  },
  used: {
    ring: "border-warning/50 bg-warning/10",
    text: "text-warning",
    label: "Already used",
    icon: ShieldAlert,
  },
  invalid: {
    ring: "border-destructive/50 bg-destructive/10",
    text: "text-destructive",
    label: "Access denied",
    icon: XCircle,
  },
};

const DOOR = "Door 1";

function AccessControlPage() {
  const { tickets, checkIn } = useTickets();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [log, setLog] = useState<CheckInResult[]>([]);
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(
    async (rawCode: string) => {
      if (!rawCode.trim() || scanning) return;
      setScanning(true);
      setResult(null);
      const outcome = await checkIn(rawCode, DOOR);
      window.setTimeout(() => {
        setScanning(false);
        setResult(outcome);
        setLog((l) => [outcome, ...l].slice(0, 8));
        setCode("");
      }, 500);
    },
    [checkIn, scanning],
  );

  const style = result ? styles[result.outcome] : null;
  const Icon = style?.icon;

  const grantedTonight = tickets.filter((t) => t.status === "checked-in").length;
  const usedOrRefunded = tickets.filter(
    (t) => t.status === "used" || t.status === "refunded",
  ).length;
  const stillValid = tickets.filter((t) => t.status === "valid").length;

  return (
    <AppShell
      title="Access control"
      description="Door scanner · type or paste a ticket code and press Enter"
      actions={<Pill tone="success">{DOOR} online</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tickets tonight" value={String(tickets.length)} icon={ScanLine} />
        <StatCard label="Checked in" value={String(grantedTonight)} icon={CheckCircle2} />
        <StatCard label="Still to arrive" value={String(stillValid)} icon={UserCheck} />
        <StatCard
          label="Used / refunded"
          value={String(usedOrRefunded)}
          icon={XCircle}
          hint="not admittable"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div
            className={cn(
              "surface-card relative flex min-h-[440px] flex-col items-center justify-center overflow-hidden p-10 text-center transition-colors duration-300",
              style?.ring,
            )}
          >
            <div className="pointer-events-none absolute inset-0 opacity-40">
              {scanning && (
                <div className="absolute inset-x-0 h-24 animate-scanline bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
              )}
            </div>

            {!result && (
              <>
                <div
                  className={cn(
                    "grid size-40 place-items-center rounded-3xl border-2 border-dashed border-primary/40 text-primary",
                    scanning && "animate-pulse",
                  )}
                >
                  <ScanLine className="size-16" />
                </div>
                <p className="mt-6 font-display text-xl font-bold">
                  {scanning ? "Checking ticket…" : "Ready to scan"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the code from the guest's QR ticket below
                </p>
              </>
            )}

            {result && style && Icon && (
              <div key={(result.ticket?.code ?? "invalid") + log.length} className="animate-pop">
                <div
                  className={cn("mx-auto grid size-32 place-items-center rounded-full", style.ring)}
                >
                  <Icon className={cn("size-16", style.text)} />
                </div>
                <p className={cn("mt-6 font-display text-3xl font-extrabold", style.text)}>
                  {style.label}
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {result.ticket?.holder ?? "Unknown code"}
                </p>
                <p className="text-sm text-muted-foreground">{result.detail}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {result.ticket?.code ?? code}
                </p>
              </div>
            )}

            <form
              className="mt-10 flex w-full max-w-sm gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void scan(code);
              }}
            >
              <Input
                autoFocus
                placeholder="NOX-XXXX-XX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-12 text-center font-mono"
                disabled={scanning}
              />
              <Button
                size="lg"
                className="h-12 px-6"
                type="submit"
                disabled={scanning || !code.trim()}
              >
                {scanning ? "Checking…" : "Scan"}
              </Button>
            </form>
          </div>
        </div>

        <Panel title="Scan log" subtitle="Most recent first">
          {log.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No scans yet in this session.
            </p>
          ) : (
            <ul className="space-y-3">
              {log.map((l, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 row-hover"
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg",
                      styles[l.outcome].ring,
                    )}
                  >
                    {(() => {
                      const I = styles[l.outcome].icon;
                      return <I className={cn("size-4", styles[l.outcome].text)} />;
                    })()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {l.ticket?.holder ?? "Unknown code"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {styles[l.outcome].label}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Try a real code — still valid
            </p>
            <ul className="mt-3 space-y-2">
              {tickets
                .filter((t) => t.status === "valid")
                .slice(0, 4)
                .map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-xs">
                    <span className="truncate">{t.holder}</span>
                    <button
                      className="font-mono text-muted-foreground hover:text-foreground"
                      onClick={() => setCode(t.code)}
                      type="button"
                    >
                      {t.code}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
