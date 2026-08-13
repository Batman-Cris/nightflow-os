import type { Role } from "@/contexts/auth-context";

/**
 * Which routes each role can see. "*" means unrestricted.
 * This mirrors the original product spec: "Cada rol debe ver únicamente lo que necesita."
 */
export const PERMISSIONS: Record<Role, "*" | string[]> = {
  owner: "*",
  manager: "*",
  supervisor: [
    "/",
    "/events",
    "/access-control",
    "/pos",
    "/inventory",
    "/recipes",
    "/cash-register",
    "/sales",
    "/purchasing",
    "/reports",
  ],
  cashier: ["/", "/pos", "/sales", "/cash-register"],
  bartender: ["/pos"],
  doorman: ["/access-control"],
  promoter: ["/promoters", "/tickets"],
  waiter: ["/vip-tables"],
  staff: ["/"],
};

/** Where a role lands after login, and where they're sent if they hit a page they can't see. */
export const DEFAULT_ROUTE: Record<Role, string> = {
  owner: "/",
  manager: "/",
  supervisor: "/",
  cashier: "/pos",
  bartender: "/pos",
  doorman: "/access-control",
  promoter: "/promoters",
  waiter: "/vip-tables",
  staff: "/",
};

/** Nombre del rol tal como se muestra en la interfaz. */
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Dueño",
  manager: "Gerente",
  supervisor: "Supervisor",
  cashier: "Caja",
  bartender: "Barra",
  doorman: "Patovica",
  promoter: "RRPP",
  waiter: "Mozo",
  staff: "Staff",
};

export function canAccess(role: Role, pathname: string): boolean {
  const allowed = PERMISSIONS[role];
  if (allowed === "*") return true;
  // /settings y /products son pantallas de administración — solo los roles sin restricción
  // las ven, están ausentes a propósito de la lista de cada rol restringido de arriba.
  return allowed.includes(pathname);
}

/** Los roles que solo necesitan una pantalla usan el layout a pantalla completa, sin sidebar (ej. la puerta). */
export function isFullScreenRole(role: Role): boolean {
  return role === "doorman";
}
