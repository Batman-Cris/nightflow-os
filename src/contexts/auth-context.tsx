import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type Role =
  | "owner"
  | "manager"
  | "cashier"
  | "bartender"
  | "doorman"
  | "promoter"
  | "waiter"
  | "supervisor"
  | "staff";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  venue: string;
  initials: string;
};

type AuthValue = {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    name: string,
    email: string,
    password: string,
    role: Role,
  ) => Promise<{ error: string | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

async function loadProfile(session: Session): Promise<SessionUser> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .maybeSingle();

  if (error) console.error("[auth] load profile", error);

  if (!data) {
    // Profile row is created by a DB trigger on signup; this is a defensive fallback
    // in case it hasn't landed yet (e.g. right after signup, before the trigger commits).
    const email = session.user.email ?? "";
    return {
      id: session.user.id,
      name: email.split("@")[0] ?? "Guest",
      email,
      role: "staff",
      venue: "NOX Club — Palermo",
      initials: email.slice(0, 2).toUpperCase() || "NX",
    };
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as Role,
    venue: data.venue,
    initials: data.initials,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session) {
        setUser(await loadProfile(data.session));
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) {
        void loadProfile(session).then((u) => active && setUser(u));
      } else {
        setUser(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string, role: Role) => {
    const initials =
      name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "NX";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, initials, venue: "NOX Club — Palermo" },
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, loading, signIn, signUp, requestPasswordReset, signOut }),
    [user, loading, signIn, signUp, requestPasswordReset, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
