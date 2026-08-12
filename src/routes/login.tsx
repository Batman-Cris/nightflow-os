import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type Role } from "@/contexts/auth-context";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — NOX OS" },
      {
        name: "description",
        content: "Sign in to NOX OS, the operating system for nightlife venues.",
      },
      { property: "og:title", content: "Sign in — NOX OS" },
      { property: "og:description", content: "Access your venue dashboard, POS and door control." },
    ],
  }),
  component: LoginPage,
});

const ROLES: { value: Role; label: string }[] = [
  { value: "owner", label: "Owner" },
  { value: "manager", label: "Manager" },
  { value: "cashier", label: "Cashier" },
  { value: "bartender", label: "Bartender" },
  { value: "doorman", label: "Doorman" },
  { value: "promoter", label: "Promoter" },
  { value: "waiter", label: "Waiter" },
  { value: "supervisor", label: "Supervisor" },
];

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const result =
      mode === "signin" ? await signIn(email, password) : await signUp(name, email, password, role);

    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (mode === "signup") {
      setError(null);
      // Supabase may require email confirmation depending on project settings —
      // if a session came back immediately, go straight in; otherwise tell the user to check email.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Account created — check your email to confirm before signing in.");
        setMode("signin");
        return;
      }
    }

    navigate({ to: "/" });
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <form className="w-full max-w-sm" onSubmit={handleSubmit}>
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Moon className="size-5" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to run tonight from one place."
              : "Set up your staff account for this venue."}
          </p>

          <div className="mt-8 grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-2 w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </div>

          <button
            type="button"
            className="mt-6 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
          >
            {mode === "signin"
              ? "New venue? Create a staff account"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,color-mix(in_oklab,var(--color-primary)_30%,transparent),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="font-display text-4xl font-bold leading-tight">
            The operating system for nightlife.
          </p>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Tickets, door access, POS, inventory and analytics — one workspace, running in real time
            from the first guest to last call.
          </p>
        </div>
      </div>
    </main>
  );
}
