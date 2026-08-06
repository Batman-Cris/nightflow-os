import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "owner" | "manager" | "bartender" | "doorman" | "promoter";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  venue: string;
  initials: string;
};

const DEMO_USER: SessionUser = {
  id: "usr_001",
  name: "Alex Moreau",
  email: "alex@noxclub.io",
  role: "owner",
  venue: "NOX Club — Palermo",
  initials: "AM",
};

const STORAGE_KEY = "nox-os.session";

type AuthValue = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (name: string, email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "signed-out") {
        setUser(null);
      } else if (raw) {
        setUser(JSON.parse(raw) as SessionUser);
      } else {
        setUser(DEMO_USER);
      }
    } catch {
      setUser(DEMO_USER);
    }
    setLoading(false);
  }, []);

  const persist = useCallback((next: SessionUser | null) => {
    setUser(next);
    window.localStorage.setItem(STORAGE_KEY, next ? JSON.stringify(next) : "signed-out");
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      signIn: async (email: string) => {
        await new Promise((r) => setTimeout(r, 550));
        persist({ ...DEMO_USER, email });
      },
      signUp: async (name: string, email: string) => {
        await new Promise((r) => setTimeout(r, 650));
        const initials = name
          .split(" ")
          .map((p) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        persist({ ...DEMO_USER, name, email, initials: initials || "NX" });
      },
      requestPasswordReset: async () => {
        await new Promise((r) => setTimeout(r, 550));
      },
      signOut: () => persist(null),
    }),
    [user, loading, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
