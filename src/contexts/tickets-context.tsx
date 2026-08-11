import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Ticket } from "@/types/nox";

export type CheckInOutcome = "valid" | "vip" | "guest" | "used" | "invalid";

export type CheckInResult = {
  outcome: CheckInOutcome;
  ticket: Ticket | null;
  detail: string;
};

type TicketsValue = {
  tickets: Ticket[];
  findByCode: (code: string) => Ticket | undefined;
  /** Scans a code at the door: validates status, marks a valid ticket as checked-in, logs the result either way. */
  checkIn: (code: string, door: string) => Promise<CheckInResult>;
};

const TicketsContext = createContext<TicketsValue | null>(null);

const logError = (label: string, error: unknown) => {
  if (error) console.error(`[tickets] ${label}`, error);
};

const nowLabel = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase.from("tickets").select("*").order("id");
  logError("tickets", error);
  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    holder: r.holder,
    email: r.email,
    event: r.event,
    tier: r.tier as Ticket["tier"],
    price: Number(r.price),
    purchasedAt: r.purchased_at,
    status: r.status as Ticket["status"],
  }));
}

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const ticketsRef = useRef(tickets);
  ticketsRef.current = tickets;

  const reload = useCallback(async () => setTickets(await fetchTickets()), []);

  useEffect(() => {
    void reload();
    const channel = supabase
      .channel("nox-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
        void reload();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  const findByCode = useCallback(
    (code: string) => ticketsRef.current.find((t) => t.code.toLowerCase() === code.toLowerCase()),
    [],
  );

  const checkIn = useCallback(
    async (code: string, door: string): Promise<CheckInResult> => {
      const ticket = findByCode(code.trim());

      if (!ticket) {
        return { outcome: "invalid", ticket: null, detail: "Ticket not found for tonight's event" };
      }

      if (ticket.status === "checked-in" || ticket.status === "used") {
        return {
          outcome: "used",
          ticket,
          detail: `Already scanned earlier tonight`,
        };
      }

      if (ticket.status === "refunded") {
        return { outcome: "invalid", ticket, detail: "This ticket was refunded" };
      }

      // status === "valid" — grant access.
      const time = nowLabel();
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "checked-in" } : t)),
      );
      const { error } = await supabase
        .from("tickets")
        .update({ status: "checked-in", checked_in_at: time, checked_in_door: door })
        .eq("id", ticket.id)
        .eq("status", "valid");
      logError("check in", error);
      void reload();

      const outcome: CheckInOutcome =
        ticket.tier === "VIP" || ticket.tier === "Backstage"
          ? "vip"
          : ticket.tier === "Guest List"
            ? "guest"
            : "valid";

      return {
        outcome,
        ticket,
        detail: `${ticket.tier} · ${ticket.event}`,
      };
    },
    [findByCode, reload],
  );

  const value = useMemo<TicketsValue>(
    () => ({ tickets, findByCode, checkIn }),
    [tickets, findByCode, checkIn],
  );

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>;
}

export function useTickets() {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error("useTickets must be used inside TicketsProvider");
  return ctx;
}
