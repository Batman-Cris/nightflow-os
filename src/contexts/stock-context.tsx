import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Product, Recipe, Sale } from "@/types/nox";

export type MovementType = "Sale" | "Recipe" | "Restock" | "Breakage";

export type StockMovement = {
  id: string;
  time: string;
  item: string;
  type: MovementType;
  qty: number;
  user: string;
};

export type SaleLine = { productId: string; qty: number };

export type PurchaseOrderStatus = "draft" | "sent" | "received";

export type PurchaseOrderLine = {
  productId: string;
  qty: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  reference: string;
  supplier: string;
  status: PurchaseOrderStatus;
  createdAt: string;
  receivedAt?: string;
  lines: PurchaseOrderLine[];
};

export type SellResult = {
  success: boolean;
  /** Finished-product ids that couldn't be sold because a required ingredient/stock ran out. */
  blocked: string[];
  /** Human-readable reason per blocked product id, for toasts. */
  reasons: Record<string, string>;
};

type StockValue = {
  products: Product[];
  movements: StockMovement[];
  recipes: Recipe[];
  sales: Sale[];
  /** Recipe for a finished product, if one is defined. */
  recipeFor: (productId: string) => Recipe | undefined;
  /** How many more units/servings of a product can be sold right now (accounts for recipe ingredients). */
  availableStock: (productId: string) => number;
  canFulfill: (productId: string, qty?: number) => boolean;
  /** Applies a completed POS sale: decrements ingredient/product stock, logs movements, bumps `sold`. */
  sell: (lines: SaleLine[], cashier: string) => SellResult;
  /** Logs a completed transaction for the Sales feed — call after a successful `sell()`. */
  recordSale: (sale: Omit<Sale, "id">) => void;
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
  purchaseOrders: PurchaseOrder[];
  /** Creates a draft purchase order for a supplier. */
  createPurchaseOrder: (supplier: string, lines: PurchaseOrderLine[]) => PurchaseOrder;
  /** Moves a draft order to "sent". */
  sendPurchaseOrder: (orderId: string) => void;
  /** Marks a sent order received: real stock goes up and each line is logged as a Restock movement. */
  receivePurchaseOrder: (orderId: string, user?: string) => void;
};

const StockContext = createContext<StockValue | null>(null);

const nowLabel = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const logError = (label: string, error: unknown) => {
  if (error) console.error(`[stock] ${label}`, error);
};

async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("id");
  logError("products", error);
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    supplier: r.supplier,
    cost: Number(r.cost),
    price: Number(r.price),
    stock: r.stock,
    minStock: r.min_stock,
    sold: r.sold,
  }));
}

async function fetchMovements(): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  logError("stock_movements", error);
  return (data ?? []).map((r) => ({
    id: r.id,
    time: r.time,
    item: r.item,
    type: r.type as MovementType,
    qty: r.qty,
    user: r.user,
  }));
}

async function fetchSales(): Promise<Sale[]> {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  logError("sales", error);
  return (data ?? []).map((r) => ({
    id: r.id,
    time: r.time,
    channel: r.channel as Sale["channel"],
    items: r.items,
    total: Number(r.total),
    method: r.method as Sale["method"],
    cashier: r.cashier,
  }));
}

async function fetchRecipes(): Promise<Recipe[]> {
  const [{ data: rows, error }, { data: ing, error: ingError }] = await Promise.all([
    supabase.from("recipes").select("*"),
    supabase.from("recipe_ingredients").select("*"),
  ]);
  logError("recipes", error);
  logError("recipe_ingredients", ingError);
  return (rows ?? []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    ingredients: (ing ?? [])
      .filter((i) => i.recipe_id === r.id)
      .map((i) => ({ productId: i.product_id, qty: Number(i.qty), unit: i.unit })),
  }));
}

async function fetchPurchaseOrders(): Promise<PurchaseOrder[]> {
  const [{ data: rows, error }, { data: lines, error: linesError }] = await Promise.all([
    supabase.from("purchase_orders").select("*"),
    supabase.from("purchase_order_lines").select("*"),
  ]);
  logError("purchase_orders", error);
  logError("purchase_order_lines", linesError);
  return (rows ?? [])
    .map((o) => ({
      id: o.id,
      reference: o.reference,
      supplier: o.supplier,
      status: o.status as PurchaseOrderStatus,
      createdAt: o.created_at,
      ...(o.received_at ? { receivedAt: o.received_at } : {}),
      lines: (lines ?? [])
        .filter((l) => l.order_id === o.id)
        .map((l) => ({ productId: l.product_id, qty: l.qty, unitCost: Number(l.unit_cost) })),
    }))
    .sort((a, b) => b.reference.localeCompare(a.reference));
}

export function StockProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const reloadProducts = useCallback(async () => setProducts(await fetchProducts()), []);
  const reloadMovements = useCallback(async () => setMovements(await fetchMovements()), []);
  const reloadSales = useCallback(async () => setSales(await fetchSales()), []);
  const reloadRecipes = useCallback(async () => setRecipes(await fetchRecipes()), []);
  const reloadOrders = useCallback(async () => setPurchaseOrders(await fetchPurchaseOrders()), []);

  useEffect(() => {
    void reloadProducts();
    void reloadMovements();
    void reloadSales();
    void reloadRecipes();
    void reloadOrders();

    const channel = supabase
      .channel("nox-stock")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void reloadProducts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_movements" }, () => {
        void reloadMovements();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        void reloadSales();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "recipes" }, () => {
        void reloadRecipes();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "recipe_ingredients" }, () => {
        void reloadRecipes();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "purchase_orders" }, () => {
        void reloadOrders();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "purchase_order_lines" },
        () => {
          void reloadOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [reloadProducts, reloadMovements, reloadSales, reloadRecipes, reloadOrders]);

  const recipeFor = useCallback(
    (productId: string) => recipes.find((r) => r.productId === productId),
    [recipes],
  );

  const availableStock = useCallback(
    (productId: string) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return 0;

      const recipe = recipeFor(productId);
      if (recipe) {
        if (recipe.ingredients.length === 0) return Number.POSITIVE_INFINITY;
        return Math.min(
          ...recipe.ingredients.map((ing) => {
            const ingredient = products.find((p) => p.id === ing.productId);
            if (!ingredient || ingredient.minStock === 0) return Number.POSITIVE_INFINITY;
            return Math.floor(ingredient.stock / ing.qty);
          }),
        );
      }

      // Untracked, non-recipe items (minStock 0, no recipe defined yet) are treated as unlimited.
      if (product.minStock === 0) return Number.POSITIVE_INFINITY;
      return Math.max(product.stock, 0);
    },
    [products, recipeFor],
  );

  const canFulfill = useCallback(
    (productId: string, qty = 1) => availableStock(productId) >= qty,
    [availableStock],
  );

  const productsRef = useRef(products);
  productsRef.current = products;

  const sell = useCallback(
    (lines: SaleLine[], cashier: string): SellResult => {
      const snapshot = productsRef.current;
      const time = nowLabel();
      const stockById = new Map(snapshot.map((p) => [p.id, p.stock]));
      const soldById = new Map<string, number>();
      const newMovements: StockMovement[] = [];
      const blocked: string[] = [];
      const reasons: Record<string, string> = {};

      for (const line of lines) {
        if (line.qty <= 0) continue;
        const product = snapshot.find((p) => p.id === line.productId);
        if (!product) continue;

        const recipe = recipeFor(product.id);

        if (recipe) {
          const shortage = recipe.ingredients.find((ing) => {
            const ingredient = snapshot.find((p) => p.id === ing.productId);
            if (!ingredient || ingredient.minStock === 0) return false;
            const have = stockById.get(ing.productId) ?? 0;
            return have < ing.qty * line.qty;
          });
          if (shortage) {
            const ingredientName =
              snapshot.find((p) => p.id === shortage.productId)?.name ?? "an ingredient";
            blocked.push(product.id);
            reasons[product.id] = `Not enough ${ingredientName} in stock`;
            continue;
          }
          for (const ing of recipe.ingredients) {
            const ingredient = snapshot.find((p) => p.id === ing.productId);
            if (!ingredient || ingredient.minStock === 0) continue;
            const used = ing.qty * line.qty;
            stockById.set(ing.productId, (stockById.get(ing.productId) ?? 0) - used);
            newMovements.push({
              id: uid(`m_${ing.productId}`),
              time,
              item: ingredient.name,
              type: "Recipe",
              qty: -used,
              user: cashier,
            });
          }
        } else if (product.minStock > 0) {
          const have = stockById.get(product.id) ?? 0;
          if (have < line.qty) {
            blocked.push(product.id);
            reasons[product.id] = "Not enough stock";
            continue;
          }
          stockById.set(product.id, have - line.qty);
          newMovements.push({
            id: uid(`m_${product.id}`),
            time,
            item: product.name,
            type: "Sale",
            qty: -line.qty,
            user: cashier,
          });
        }

        soldById.set(product.id, (soldById.get(product.id) ?? 0) + line.qty);
      }

      const touched = snapshot.filter((p) => soldById.has(p.id) || stockById.get(p.id) !== p.stock);
      const nextById = new Map(
        touched.map((p) => [
          p.id,
          {
            stock: Math.max(stockById.get(p.id) ?? p.stock, 0),
            sold: p.sold + (soldById.get(p.id) ?? 0),
          },
        ]),
      );

      if (touched.length > 0) {
        // Optimistic local update; realtime + refetch reconcile with the database.
        setProducts((prev) =>
          prev.map((p) => (nextById.has(p.id) ? { ...p, ...nextById.get(p.id)! } : p)),
        );
      }
      if (newMovements.length > 0) setMovements((prev) => [...newMovements, ...prev]);

      void (async () => {
        for (const [id, next] of nextById) {
          const { error } = await supabase.from("products").update(next).eq("id", id);
          logError("update product", error);
        }
        if (newMovements.length > 0) {
          const { error } = await supabase.from("stock_movements").insert(
            newMovements.map((m) => ({
              id: m.id,
              time: m.time,
              item: m.item,
              type: m.type,
              qty: m.qty,
              user: m.user,
            })),
          );
          logError("insert movements", error);
        }
        await reloadProducts();
        await reloadMovements();
      })();

      return { success: blocked.length === 0, blocked, reasons };
    },
    [recipeFor, reloadProducts, reloadMovements],
  );

  const addRecipe = useCallback(
    (recipe: Omit<Recipe, "id">) => {
      const id = uid("r");
      setRecipes((prev) => [...prev, { ...recipe, id }]);
      void (async () => {
        const { error } = await supabase
          .from("recipes")
          .insert({ id, product_id: recipe.productId });
        logError("insert recipe", error);
        if (recipe.ingredients.length > 0) {
          const { error: ingError } = await supabase.from("recipe_ingredients").insert(
            recipe.ingredients.map((i) => ({
              recipe_id: id,
              product_id: i.productId,
              qty: i.qty,
              unit: i.unit,
            })),
          );
          logError("insert recipe ingredients", ingError);
        }
        await reloadRecipes();
      })();
    },
    [reloadRecipes],
  );

  const createPurchaseOrder = useCallback(
    (supplier: string, lines: PurchaseOrderLine[]) => {
      const order: PurchaseOrder = {
        id: uid("po"),
        reference: `PO-${Math.floor(1100 + Math.random() * 800)}`,
        supplier,
        status: "draft",
        createdAt: `Today ${nowLabel()}`,
        lines: lines.filter((l) => l.qty > 0),
      };
      setPurchaseOrders((prev) => [order, ...prev]);
      void (async () => {
        const { error } = await supabase.from("purchase_orders").insert({
          id: order.id,
          reference: order.reference,
          supplier: order.supplier,
          status: order.status,
          created_at: order.createdAt,
        });
        logError("insert purchase order", error);
        if (order.lines.length > 0) {
          const { error: linesError } = await supabase.from("purchase_order_lines").insert(
            order.lines.map((l) => ({
              order_id: order.id,
              product_id: l.productId,
              qty: l.qty,
              unit_cost: l.unitCost,
            })),
          );
          logError("insert purchase order lines", linesError);
        }
        await reloadOrders();
      })();
      return order;
    },
    [reloadOrders],
  );

  const sendPurchaseOrder = useCallback(
    (orderId: string) => {
      setPurchaseOrders((prev) =>
        prev.map((o) => (o.id === orderId && o.status === "draft" ? { ...o, status: "sent" } : o)),
      );
      void (async () => {
        const { error } = await supabase
          .from("purchase_orders")
          .update({ status: "sent" })
          .eq("id", orderId)
          .eq("status", "draft");
        logError("send purchase order", error);
        await reloadOrders();
      })();
    },
    [reloadOrders],
  );

  const ordersRef = useRef(purchaseOrders);
  ordersRef.current = purchaseOrders;

  const receivePurchaseOrder = useCallback(
    (orderId: string, user = "Franco Lema") => {
      const order = ordersRef.current.find((o) => o.id === orderId);
      if (!order || order.status !== "sent") return;
      const snapshot = productsRef.current;
      const time = nowLabel();
      const receivedAt = `Today ${time}`;

      const received = new Map(order.lines.map((l) => [l.productId, l.qty]));
      const restocks: StockMovement[] = order.lines.map((line) => ({
        id: uid(`m_${line.productId}`),
        time,
        item: snapshot.find((p) => p.id === line.productId)?.name ?? line.productId,
        type: "Restock",
        qty: line.qty,
        user,
      }));

      setProducts((prev) =>
        prev.map((p) =>
          received.has(p.id) ? { ...p, stock: p.stock + (received.get(p.id) ?? 0) } : p,
        ),
      );
      setMovements((prev) => [...restocks, ...prev]);
      setPurchaseOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "received", receivedAt } : o)),
      );

      void (async () => {
        for (const line of order.lines) {
          const current = snapshot.find((p) => p.id === line.productId);
          if (!current) continue;
          const { error } = await supabase
            .from("products")
            .update({ stock: current.stock + line.qty })
            .eq("id", line.productId);
          logError("restock product", error);
        }
        const { error: movementError } = await supabase.from("stock_movements").insert(
          restocks.map((m) => ({
            id: m.id,
            time: m.time,
            item: m.item,
            type: m.type,
            qty: m.qty,
            user: m.user,
          })),
        );
        logError("insert restock movements", movementError);
        const { error: orderError } = await supabase
          .from("purchase_orders")
          .update({ status: "received", received_at: receivedAt })
          .eq("id", orderId);
        logError("receive purchase order", orderError);
        await reloadProducts();
        await reloadMovements();
        await reloadOrders();
      })();
    },
    [reloadProducts, reloadMovements, reloadOrders],
  );

  const recordSale = useCallback(
    (sale: Omit<Sale, "id">) => {
      const id = uid("s");
      setSales((prev) => [{ ...sale, id }, ...prev]);
      void (async () => {
        const { error } = await supabase.from("sales").insert({ id, ...sale });
        logError("insert sale", error);
        await reloadSales();
      })();
    },
    [reloadSales],
  );

  const value = useMemo<StockValue>(
    () => ({
      products,
      movements,
      recipes,
      sales,
      recipeFor,
      availableStock,
      canFulfill,
      sell,
      recordSale,
      addRecipe,
      purchaseOrders,
      createPurchaseOrder,
      sendPurchaseOrder,
      receivePurchaseOrder,
    }),
    [
      products,
      movements,
      recipes,
      sales,
      recipeFor,
      availableStock,
      canFulfill,
      sell,
      recordSale,
      addRecipe,
      purchaseOrders,
      createPurchaseOrder,
      sendPurchaseOrder,
      receivePurchaseOrder,
    ],
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock must be used inside StockProvider");
  return ctx;
}
