import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Crown, ScanLine, ShieldAlert, UserCheck, XCircle } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tickets } from "@/data/demo";

export const Route = createFileRoute("/access-control")({
  head: () => ({
    meta: [
      { title: "Access Control — NOX OS" },
      {
        name: "description",
        content: "Full-screen QR scanning for the door: instant valid, VIP, guest and duplicate results.",
      },
      { property: "og:title", content: "Access Control — NOX OS" },
      { property: "og:description", content: "Door scanning with instant validation results." },
    ],
  }),
  component: AccessControlPage,
});

type ScanResult = {
  kind: "valid" | "vip" | "guest" | "used" | "invalid";
  name: string;
  code: string;
  detail: string;
};

const outcomes: ScanResult[] = [
  { kind: "valid", name: "Sofia Marchetti", code: "NOX-3KD-14", detail: "General admission · Neon Cathedral" },
  { kind: "vip", name: "Valentina Cruz", code: "NOX-9AV-22", detail: "VIP · Table 1 · min spend $1,200" },
  { kind: "guest", name: "Aitana Rojas", code: "NOX-1PL-07", detail: "Guest list · Kiara Bosch +1" },
  { kind: "used", name: "Tomás Rivas", code: "NOX-7BR-19", detail: "Already scanned at 00:41 · Door 2" },
  { kind: "invalid", name: "Unknown code", code: "NOX-XXX-00", detail: "Ticket not found for tonight's event" },
];

const styles: Record<ScanResult["kind"], { ring: string; text: string; label: string; icon: typeof CheckCircle2 }> = {
  valid: { ring: "border-success/50 bg-success/10", text: "text-success", label: "Access granted", icon: CheckCircle2 },
  vip: { ring: "border-primary/50 bg-primary/10", text: "text-primary", label: "VIP guest", icon: Crown },
  guest: { ring: "border-chart-4/50 bg-chart-4/10", text: "text-chart-4", label: "Guest list", icon: UserCheck },
  used: { ring: "border-warning/50 bg-warning/10", text: "text-warning", label: "Already used", icon: ShieldAlert },
  invalid: { ring: "border-destructive/50 bg-destructive/10", text: "text-destructive", label: "Access denied", icon: XCircle },
};

function AccessControlPage() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [log, setLog] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(() => {
    setScanning(true);
    setResult(null);
    const pick = outcomes[Math.floor(Math.random() * outcomes.length)]!;
    window.setTimeout(() => {
      setScanning(false);
      setResult(pick);
      setLog((l) => [pick, ...l].slice(0, 8));
    }, 700);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        scan();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scan]);

  const style = result ? styles[result.kind] : null;
  const Icon = style?.icon;

  return (
    <AppShell
      title="Access control"
      description="Door scanner · press Space or tap to simulate a scan"
      actions={<Pill tone="success">Door 1 online</Pill>}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Scanned tonight" value="1,163" delta={7.4} icon={ScanLine} />
        <StatCard label="Granted" value="1,147" icon={CheckCircle2} hint="98.6% success" />
        <StatCard label="Duplicates" value="9" icon={ShieldAlert} hint="flagged at the door" />
        <StatCard label="Denied" value="7" icon={XCircle} hint="invalid codes" />
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
                  {scanning ? "Reading QR…" : "Ready to scan"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hold the guest's QR code up to the reader
                </p>
              </>
            )}

            {result && style && Icon && (
              <div key={result.code + log.length} className="animate-pop">
                <div className={cn("mx-auto grid size-32 place-items-center rounded-full", style.ring)}>
                  <Icon className={cn("size-16", style.text)} />
                </div>
                <p className={cn("mt-6 font-display text-3xl font-extrabold", style.text)}>
                  {style.label}
                </p>
                <p className="mt-2 text-lg font-semibold">{result.name}</p>
                <p className="text-sm text-muted-foreground">{result.detail}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{result.code}</p>
              </div>
            )}

            <Button size="lg" className="mt-10 h-12 px-8" onClick={scan} disabled={scanning}>
              {scanning ? "Scanning…" : "Scan next guest"}
            </Button>
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
                <li key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 row-hover">
                  <span className={cn("grid size-8 place-items-center rounded-lg", styles[l.kind].ring)}>
                    {(() => {
                      const I = styles[l.kind].icon;
                      return <I className={cn("size-4", styles[l.kind].text)} />;
                    })()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{styles[l.kind].label}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground">Recent valid tickets</p>
            <ul className="mt-3 space-y-2">
              {tickets.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center justify-between text-xs">
                  <span className="truncate">{t.holder}</span>
                  <span className="font-mono text-muted-foreground">{t.code}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
