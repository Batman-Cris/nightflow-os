import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  ScanLine,
  Receipt,
  ShoppingCart,
  Boxes,
  Truck,
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
  group: "Operación" | "Comercial" | "Personas" | "Analítica";
  badge?: string;
};

export const navItems: NavItem[] = [
  { label: "Inicio", to: "/", icon: LayoutDashboard, group: "Operación" },
  { label: "Eventos", to: "/events", icon: CalendarDays, group: "Operación", badge: "6" },
  { label: "Entradas", to: "/tickets", icon: Ticket, group: "Operación" },
  { label: "Control de acceso", to: "/access-control", icon: ScanLine, group: "Operación" },
  { label: "Ventas", to: "/sales", icon: Receipt, group: "Comercial" },
  { label: "Barra", to: "/pos", icon: ShoppingCart, group: "Comercial" },
  { label: "Stock", to: "/inventory", icon: Boxes, group: "Comercial", badge: "3" },
  { label: "Recetas", to: "/recipes", icon: FlaskConical, group: "Comercial" },
  { label: "Productos", to: "/products", icon: Package, group: "Comercial" },
  { label: "Compras", to: "/purchasing", icon: Truck, group: "Comercial" },
  { label: "Caja", to: "/cash-register", icon: Wallet, group: "Comercial" },
  { label: "Clientes", to: "/customers", icon: Users, group: "Personas" },
  { label: "Empleados", to: "/employees", icon: IdCard, group: "Personas" },
  { label: "RRPP", to: "/promoters", icon: Megaphone, group: "Personas" },
  { label: "Mesas VIP", to: "/vip-tables", icon: Crown, group: "Personas" },
  { label: "Reportes", to: "/reports", icon: FileBarChart, group: "Analítica" },
  { label: "Analítica", to: "/analytics", icon: TrendingUp, group: "Analítica" },
  { label: "Configuración", to: "/settings", icon: Settings, group: "Analítica" },
];

export const navGroups = ["Operación", "Comercial", "Personas", "Analítica"] as const;
