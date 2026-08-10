import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  ScanLine,
  Receipt,
  ShoppingCart,
  Boxes,
  Package,
  FlaskConical,
  Wallet,
  Users,
  IdCard,
  Megaphone,
  Crown,
  FileBarChart,
  TrendingUp,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
  group: "Operations" | "Commerce" | "People" | "Insights";
  badge?: string;
};

export const navItems: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, group: "Operations" },
  { label: "Events", to: "/events", icon: CalendarDays, group: "Operations", badge: "6" },
  { label: "Tickets", to: "/tickets", icon: Ticket, group: "Operations" },
  { label: "Access Control", to: "/access-control", icon: ScanLine, group: "Operations" },
  { label: "Sales", to: "/sales", icon: Receipt, group: "Commerce" },
  { label: "POS", to: "/pos", icon: ShoppingCart, group: "Commerce" },
  { label: "Inventory", to: "/inventory", icon: Boxes, group: "Commerce", badge: "3" },
  { label: "Recipes", to: "/recipes", icon: FlaskConical, group: "Commerce" },
  { label: "Products", to: "/products", icon: Package, group: "Commerce" },
  { label: "Cash Register", to: "/cash-register", icon: Wallet, group: "Commerce" },
  { label: "Customers", to: "/customers", icon: Users, group: "People" },
  { label: "Employees", to: "/employees", icon: IdCard, group: "People" },
  { label: "Promoters", to: "/promoters", icon: Megaphone, group: "People" },
  { label: "VIP Tables", to: "/vip-tables", icon: Crown, group: "People" },
  { label: "Reports", to: "/reports", icon: FileBarChart, group: "Insights" },
  { label: "Analytics", to: "/analytics", icon: TrendingUp, group: "Insights" },
  { label: "Settings", to: "/settings", icon: Settings, group: "Insights" },
];

export const navGroups = ["Operations", "Commerce", "People", "Insights"] as const;
