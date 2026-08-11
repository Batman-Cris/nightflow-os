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

export type CashMethod = "Cash" | "Card" | "Transfer" | "QR";
export type CashEntryType = "sale" | "income" | "expense";

export type CashEntry = {
  id: string;
  time: string;
  type: CashEntryType;
  method: CashMethod;
  /** Positive for money in, negative for money out. */
  amount: number;
  note: string;
  user: string;
};

export type ClosedSession = {
  id: string;
  openedAt: string;
  openedBy: string;
  closedAt: string;
  closedBy: string;
  openingFloat: number;
  expectedCash: number;
  countedCash: number;
  difference: number;
};

type CashValue = {
  isOpen: boolean;
  openedAt: string | null;
  openedBy: string | null;
  openingFloat: number;
  entries: CashEntry[];
  closedSessions: ClosedSession[];
  /** Cash-in-drawer expected right now: opening float + all cash-method entries. */
  expectedCash: number;
  totalsByMethod: Record<CashMethod, number>;
  openShift: (openingFloat: number, user: string) => void;
  addEntry: (
    type: "income" | "expense",
    amount: number,
    method: CashMethod,
    note: string,
    user: string,
  ) => void;
  /** Called right after a successful POS checkout to log it on the ledger automatically. */
  logSale: (amount: number, method: CashMethod, user: string) => void;
  closeShift: (countedCash: number, user: string) => void;
};

const CashContext = createContext<CashValue | null>(null);

const nowLabel = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const logError = (label: string, error: unknown) => {
  if (error) console.error(`[cash] ${label}`, error);
};

type SessionRow = {
  id: string;
  opened_at: string | null;
  opened_by: string | null;
  opening_float: number;
  closed_at: string | null;
  closed_by: string | null;
  counted_cash: number | null;
  status: string;
};

type State = {
  sessions: SessionRow[];
  entries: (CashEntry & { sessionId: string })[];
};

async function fetchState(): Promise<State> {
  const [{ data: sessions, error }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from("cash_sessions").select("*").order("created_at", { ascending: false }),
    supabase.from("cash_entries").select("*").order("created_at", { ascending: false }),
  ]);
  logError("cash_sessions", error);
  logError("cash_entries", entriesError);
  return {
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      opened_at: s.opened_at,
      opened_by: s.opened_by,
      opening_float: Number(s.opening_float),
      closed_at: s.closed_at,
      closed_by: s.closed_by,
      counted_cash: s.counted_cash === null ? null : Number(s.counted_cash),
      status: s.status,
    })),
    entries: (entries ?? []).map((e) => ({
      id: e.id,
      sessionId: e.session_id,
      time: e.time,
      type: e.type as CashEntryType,
      method: e.method as CashMethod,
      amount: Number(e.amount),
      note: e.note ?? "",
      user: e.user,
    })),
  };
}

export function CashProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ sessions: [], entries: [] });

  const reload = useCallback(async () => setState(await fetchState()), []);

  useEffect(() => {
    void reload();
    const channel = supabase
      .channel("nox-cash")
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_sessions" }, () => {
        void reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cash_entries" }, () => {
        void reload();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reload]);

  const openSession = useMemo(
    () => state.sessions.find((s) => s.status === "open") ?? null,
    [state.sessions],
  );

  const entries = useMemo<CashEntry[]>(
    () =>
      openSession
        ? state.entries
            .filter((e) => e.sessionId === openSession.id)
            .map(({ sessionId: _sessionId, ...e }) => e)
        : [],
    [state.entries, openSession],
  );

  const expectedCash = useMemo(
    () => entries.filter((e) => e.method === "Cash").reduce((s, e) => s + e.amount, 0),
    [entries],
  );

  const totalsByMethod = useMemo(() => {
    const totals: Record<CashMethod, number> = { Cash: 0, Card: 0, Transfer: 0, QR: 0 };
    for (const e of entries) totals[e.method] += e.amount;
    return totals;
  }, [entries]);

  const closedSessions = useMemo<ClosedSession[]>(
    () =>
      state.sessions
        .filter((s) => s.status === "closed")
        .map((s) => {
          const sessionEntries = state.entries.filter((e) => e.sessionId === s.id);
          const expected = sessionEntries
            .filter((e) => e.method === "Cash")
            .reduce((sum, e) => sum + e.amount, 0);
          const counted = s.counted_cash ?? 0;
          return {
            id: s.id,
            openedAt: s.opened_at ?? "",
            openedBy: s.opened_by ?? "",
            closedAt: s.closed_at ?? "",
            closedBy: s.closed_by ?? "",
            openingFloat: s.opening_float,
            expectedCash: expected,
            countedCash: counted,
            difference: counted - expected,
          };
        }),
    [state.sessions, state.entries],
  );

  const sessionRef = useRef(openSession);
  sessionRef.current = openSession;
  const expectedRef = useRef(expectedCash);
  expectedRef.current = expectedCash;

  const openShift = useCallback(
    (float: number, user: string) => {
      void (async () => {
        const id = uid("cs");
        const time = nowLabel();
        const { error } = await supabase.from("cash_sessions").insert({
          id,
          opened_at: time,
          opened_by: user,
          opening_float: float,
          status: "open",
        });
        logError("open shift", error);
        const { error: entryError } = await supabase.from("cash_entries").insert({
          id: uid("c"),
          session_id: id,
          time,
          type: "income",
          method: "Cash",
          amount: float,
          note: "Opening float",
          user,
        });
        logError("opening float entry", entryError);
        await reload();
      })();
    },
    [reload],
  );

  const insertEntry = useCallback(
    (entry: Omit<CashEntry, "id">) => {
      const session = sessionRef.current;
      if (!session) return;
      const row = { ...entry, id: uid("c") };
      setState((prev) => ({
        ...prev,
        entries: [{ ...row, sessionId: session.id }, ...prev.entries],
      }));
      void (async () => {
        const { error } = await supabase.from("cash_entries").insert({
          id: row.id,
          session_id: session.id,
          time: row.time,
          type: row.type,
          method: row.method,
          amount: row.amount,
          note: row.note,
          user: row.user,
        });
        logError("insert entry", error);
        await reload();
      })();
    },
    [reload],
  );

  const addEntry = useCallback(
    (
      type: "income" | "expense",
      amount: number,
      method: CashMethod,
      note: string,
      user: string,
    ) => {
      insertEntry({
        time: nowLabel(),
        type,
        method,
        amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
        note,
        user,
      });
    },
    [insertEntry],
  );

  const logSale = useCallback(
    (amount: number, method: CashMethod, user: string) => {
      insertEntry({ time: nowLabel(), type: "sale", method, amount, note: "POS sale", user });
    },
    [insertEntry],
  );

  const closeShift = useCallback(
    (countedCash: number, user: string) => {
      const session = sessionRef.current;
      if (!session) return;
      void (async () => {
        const { error } = await supabase
          .from("cash_sessions")
          .update({
            status: "closed",
            closed_at: nowLabel(),
            closed_by: user,
            counted_cash: countedCash,
          })
          .eq("id", session.id);
        logError("close shift", error);
        await reload();
      })();
    },
    [reload],
  );

  const value = useMemo<CashValue>(
    () => ({
      isOpen: openSession !== null,
      openedAt: openSession?.opened_at ?? null,
      openedBy: openSession?.opened_by ?? null,
      openingFloat: openSession?.opening_float ?? 0,
      entries,
      closedSessions,
      expectedCash,
      totalsByMethod,
      openShift,
      addEntry,
      logSale,
      closeShift,
    }),
    [
      openSession,
      entries,
      closedSessions,
      expectedCash,
      totalsByMethod,
      openShift,
      addEntry,
      logSale,
      closeShift,
    ],
  );

  return <CashContext.Provider value={value}>{children}</CashContext.Provider>;
}

export function useCash() {
  const ctx = useContext(CashContext);
  if (!ctx) throw new Error("useCash must be used inside CashProvider");
  return ctx;
}
