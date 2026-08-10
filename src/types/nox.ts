export type EventStatus = "live" | "scheduled" | "sold-out" | "draft" | "finished";

export type NoxEvent = {
  id: string;
  name: string;
  date: string;
  genre: string;
  artist: string;
  room: string;
  capacity: number;
  attendance: number;
  ticketsSold: number;
  revenue: number;
  status: EventStatus;
};

export type TicketStatus = "valid" | "checked-in" | "used" | "refunded";
export type TicketTier = "General" | "Early Bird" | "VIP" | "Guest List" | "Backstage";

export type Ticket = {
  id: string;
  code: string;
  holder: string;
  email: string;
  event: string;
  tier: TicketTier;
  price: number;
  purchasedAt: string;
  status: TicketStatus;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  supplier: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  sold: number;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthday: string;
  visits: number;
  spent: number;
  tier: "VIP" | "Regular" | "New";
  lastVisit: string;
  notes: string;
};

export type Employee = {
  id: string;
  name: string;
  role: string;
  shift: string;
  status: "on-shift" | "off" | "break";
  attendance: number;
  hourly: number;
  email: string;
};

export type Promoter = {
  id: string;
  name: string;
  code: string;
  guests: number;
  ticketsSold: number;
  revenue: number;
  commission: number;
  tier: "Platinum" | "Gold" | "Silver";
};

export type VipTable = {
  id: string;
  name: string;
  zone: string;
  seats: number;
  minSpend: number;
  host: string | null;
  status: "reserved" | "open" | "occupied" | "closed";
  spend: number;
};

export type Sale = {
  id: string;
  time: string;
  channel: "POS" | "Online" | "Door" | "VIP";
  items: number;
  total: number;
  method: "Cash" | "Card" | "Transfer" | "QR";
  cashier: string;
};

export type RecipeIngredient = {
  /** id of the raw-stock Product consumed by this ingredient line */
  productId: string;
  /** quantity consumed per one unit of the finished product sold (same unit as the ingredient's stock) */
  qty: number;
  unit: string;
};

export type Recipe = {
  id: string;
  /** id of the finished, sellable Product this recipe produces (e.g. the cocktail) */
  productId: string;
  ingredients: RecipeIngredient[];
};
