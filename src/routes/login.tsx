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
import { ROLE_LABELS } from "@/lib/permissions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — NOX OS" },
      {
        name: "description",
        content: "Iniciá sesión en NOX OS, el sistema operativo para locales nocturnos.",
      },
      { property: "og:title", content: "Iniciar sesión — NOX OS" },
      {
        property: "og:description",
        content: "Accedé al panel de tu local, la barra y el control de acceso.",
      },
    ],
  }),
  component: LoginPage,
});

const SIGNUP_ROLES: Role[] = [
  "owner",
  "manager",
  "supervisor",
  "cashier",
  "bartender",
  "doorman",
  "promoter",
  "waiter",
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
      // Supabase puede pedir confirmación por email según la configuración del proyecto —
      // si ya volvió una sesión activa, entramos directo; si no, avisamos que revise su correo.
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Cuenta creada — revisá tu email para confirmarla antes de iniciar sesión.");
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
            {mode === "signin" ? "Bienvenido de nuevo" : "Creá tu cuenta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Iniciá sesión para manejar la noche desde un solo lugar."
              : "Configurá tu cuenta de staff para este local."}
          </p>

          <div className="mt-8 grid gap-4">
            {mode === "signup" && (
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre completo</Label>
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
              <Label htmlFor="password">Contraseña</Label>
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
                <Label>Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIGNUP_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="mt-2 w-full" disabled={busy}>
              {busy ? "Un momento…" : mode === "signin" ? "Iniciar sesión" : "Crear cuenta"}
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
              ? "¿Local nuevo? Creá una cuenta de staff"
              : "¿Ya tenés cuenta? Iniciá sesión"}
          </button>
        </form>
      </div>
      <div className="relative hidden overflow-hidden border-l border-border bg-card lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,color-mix(in_oklab,var(--color-primary)_30%,transparent),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="font-display text-4xl font-bold leading-tight">
            El sistema operativo de la noche.
          </p>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Entradas, control de acceso, barra, stock y analítica — un solo espacio de trabajo,
            corriendo en tiempo real desde el primer invitado hasta el cierre.
          </p>
        </div>
      </div>
    </main>
  );
}
