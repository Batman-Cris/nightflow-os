import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — NOX OS" },
      { name: "description", content: "Sign in to NOX OS, the operating system for nightlife venues." },
      { property: "og:title", content: "Sign in — NOX OS" },
      { property: "og:description", content: "Access your venue dashboard, POS and door control." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@noxos.app");
  const [password, setPassword] = useState("nightlife");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-16">
        <form
          className="w-full max-w-sm"
          onSubmit={(e) => {
            e.preventDefault();
            signIn(email);
            navigate({ to: "/" });
          }}
        >
          <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Moon className="size-5" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to run tonight from one place.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="mt-2 w-full">
              Sign in
            </Button>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Demo environment — any credentials open the full workspace.
          </p>
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
