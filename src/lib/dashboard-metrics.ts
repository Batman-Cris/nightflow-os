import type { Sale } from "@/types/nox";

/** Local YYYY-MM-DD key for a date-ish value. */
export function dayKey(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isToday(value?: string | null): boolean {
  if (!value) return false;
  return dayKey(value) === dayKey(new Date());
}

/**
 * Buckets sales into hourly revenue. Uses `created_at` when present and falls
 * back to the `time` label ("HH:MM") for rows written before that column existed.
 * Only hours that actually contain sales are returned, in chronological order.
 */
export function hourlySales(sales: Sale[]): { hour: string; sales: number }[] {
  const buckets = new Map<number, number>();
  for (const s of sales) {
    let hour: number | null = null;
    if (s.createdAt) {
      const d = new Date(s.createdAt);
      if (!Number.isNaN(d.getTime())) hour = d.getHours();
    }
    if (hour === null) {
      const m = /^(\d{1,2}):/.exec(s.time ?? "");
      if (m && m[1] !== undefined) hour = Number(m[1]);
    }
    if (hour === null || Number.isNaN(hour)) continue;
    buckets.set(hour, (buckets.get(hour) ?? 0) + s.total);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([hour, total]) => ({ hour: `${String(hour).padStart(2, "0")}:00`, sales: Math.round(total) }));
}

/** The last `days` calendar days (oldest first) as {key, label}. */
export function recentDays(days = 7): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ key: dayKey(d), label: d.toLocaleDateString("en-US", { weekday: "short" }) });
  }
  return out;
}
