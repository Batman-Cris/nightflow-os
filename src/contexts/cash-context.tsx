import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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

const DEMO_ENTRIES: CashEntry[] = [
  {
    id: "c1",
    time: "21:05",
    type: "income",
    method: "Cash",
    amount: 300,
    note: "Opening float",
    user: "Franco Lema",
  },
  {
    id: "c2",
    time: "22:10",
    type: "sale",
    method: "Cash",
    amount: 88,
    note: "POS sale",
    user: "Rafa Molina",
  },
  {
    id: "c3",
    time: "23:40",
    type: "sale",
    method: "Card",
    amount: 220,
    note: "POS sale",
    user: "Lucía Prat",
  },
  {
    id: "c4",
    time: "00:15",
    type: "expense",
    method: "Cash",
    amount: -40,
    note: "Ice delivery",
    user: "Franco Lema",
  },
];

export function CashProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [openedAt, setOpenedAt] = useState<string | null>("21:00");
  const [openedBy, setOpenedBy] = useState<string | null>("Franco Lema");
  const [openingFloat, setOpeningFloat] = useState(300);
  const [entries, setEntries] = useState<CashEntry[]>(DEMO_ENTRIES);
  const [closedSessions, setClosedSessions] = useState<ClosedSession[]>([]);

  const openShift = useCallback((float: number, user: string) => {
    setIsOpen(true);
    setOpenedAt(nowLabel());
    setOpenedBy(user);
    setOpeningFloat(float);
    setEntries([
      {
        id: uid("c"),
        time: nowLabel(),
        type: "income",
        method: "Cash",
        amount: float,
        note: "Opening float",
        user,
      },
    ]);
  }, []);

  const addEntry = useCallback(
    (
      type: "income" | "expense",
      amount: number,
      method: CashMethod,
      note: string,
      user: string,
    ) => {
      setEntries((prev) => [
        {
          id: uid("c"),
          time: nowLabel(),
          type,
          method,
          amount: type === "expense" ? -Math.abs(amount) : Math.abs(amount),
          note,
          user,
        },
        ...prev,
      ]);
    },
    [],
  );

  const logSale = useCallback((amount: number, method: CashMethod, user: string) => {
    setEntries((prev) => [
      { id: uid("c"), time: nowLabel(), type: "sale", method, amount, note: "POS sale", user },
      ...prev,
    ]);
  }, []);

  const expectedCash = useMemo(
    () => entries.filter((e) => e.method === "Cash").reduce((s, e) => s + e.amount, 0),
    [entries],
  );

  const totalsByMethod = useMemo(() => {
    const totals: Record<CashMethod, number> = { Cash: 0, Card: 0, Transfer: 0, QR: 0 };
    for (const e of entries) totals[e.method] += e.amount;
    return totals;
  }, [entries]);

  const closeShift = useCallback(
    (countedCash: number, user: string) => {
      if (!isOpen || openedAt === null || openedBy === null) return;
      setClosedSessions((prev) => [
        {
          id: uid("cs"),
          openedAt,
          openedBy,
          closedAt: nowLabel(),
          closedBy: user,
          openingFloat,
          expectedCash,
          countedCash,
          difference: countedCash - expectedCash,
        },
        ...prev,
      ]);
      setIsOpen(false);
      setOpenedAt(null);
      setOpenedBy(null);
      setEntries([]);
    },
    [isOpen, openedAt, openedBy, openingFloat, expectedCash],
  );

  const value = useMemo<CashValue>(
    () => ({
      isOpen,
      openedAt,
      openedBy,
      openingFloat,
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
      isOpen,
      openedAt,
      openedBy,
      openingFloat,
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
