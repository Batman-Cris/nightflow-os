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

export function canAccess(role: Role, pathname: string): boolean {
  const allowed = PERMISSIONS[role];
  if (allowed === "*") return true;
  // /settings and /products are power-user screens — only unrestricted roles see them,
  // they're intentionally absent from every restricted role's list above.
  return allowed.includes(pathname);
}

/** Roles that only ever need one screen get the full-width, no-sidebar layout (e.g. the door). */
export function isFullScreenRole(role: Role): boolean {
  return role === "doorman";
}
