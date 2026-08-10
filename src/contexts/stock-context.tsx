import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { products as demoProducts, recipes as demoRecipes, sales as demoSales } from "@/data/demo";
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

const INITIAL_MOVEMENTS: StockMovement[] = [
  { id: "m1", time: "01:38", item: "Corona 355ml", type: "Sale", qty: -12, user: "Rafa Molina" },
  { id: "m2", time: "01:20", item: "Grey Goose Bottle", type: "Sale", qty: -1, user: "Lucía Prat" },
  { id: "m3", time: "00:55", item: "Red Bull", type: "Sale", qty: -18, user: "Sol Vergara" },
  { id: "m4", time: "00:32", item: "Moët & Chandon", type: "Sale", qty: -2, user: "Lucía Prat" },
  { id: "m5", time: "23:10", item: "Corona 355ml", type: "Restock", qty: 240, user: "Franco Lema" },
  {
    id: "m6",
    time: "22:44",
    item: "Absolut Vodka",
    type: "Breakage",
    qty: -1,
    user: "Franco Lema",
  },
  {
    id: "m7",
    time: "20:05",
    item: "Sparkling Water",
    type: "Restock",
    qty: 180,
    user: "Franco Lema",
  },
  { id: "m8", time: "19:40", item: "Truffle Fries", type: "Restock", qty: 60, user: "Cocina NOX" },
];

export type SaleLine = { productId: string; qty: number };

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
  /** Applies a completed POS sale: decrements ingredient/product stock, logs movements, bumps `sold`. Pure — safe to call once per checkout. */
  sell: (lines: SaleLine[], cashier: string) => SellResult;
  /** Logs a completed transaction for the Sales feed — call after a successful `sell()`. */
  recordSale: (sale: Omit<Sale, "id">) => void;
  addRecipe: (recipe: Omit<Recipe, "id">) => void;
};

const StockContext = createContext<StockValue | null>(null);

const nowLabel = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function StockProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [movements, setMovements] = useState<StockMovement[]>(INITIAL_MOVEMENTS);
  const [recipes, setRecipes] = useState<Recipe[]>(demoRecipes);
  const [sales, setSales] = useState<Sale[]>(demoSales);

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

  const sell = useCallback(
    (lines: SaleLine[], cashier: string): SellResult => {
      const time = nowLabel();
      // Pure simulation over a plain snapshot — no mutation of React state during the pass,
      // so this stays correct even if the updater were ever invoked more than once.
      const stockById = new Map(products.map((p) => [p.id, p.stock]));
      const soldById = new Map<string, number>();
      const newMovements: StockMovement[] = [];
      const blocked: string[] = [];
      const reasons: Record<string, string> = {};

      for (const line of lines) {
        if (line.qty <= 0) continue;
        const product = products.find((p) => p.id === line.productId);
        if (!product) continue;

        const recipe = recipeFor(product.id);

        if (recipe) {
          const shortage = recipe.ingredients.find((ing) => {
            const ingredient = products.find((p) => p.id === ing.productId);
            if (!ingredient || ingredient.minStock === 0) return false;
            const have = stockById.get(ing.productId) ?? 0;
            return have < ing.qty * line.qty;
          });
          if (shortage) {
            const ingredientName =
              products.find((p) => p.id === shortage.productId)?.name ?? "an ingredient";
            blocked.push(product.id);
            reasons[product.id] = `Not enough ${ingredientName} in stock`;
            continue;
          }
          for (const ing of recipe.ingredients) {
            const ingredient = products.find((p) => p.id === ing.productId);
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

      if (newMovements.length > 0 || soldById.size > 0) {
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            stock: stockById.has(p.id) ? Math.max(stockById.get(p.id)!, 0) : p.stock,
            sold: p.sold + (soldById.get(p.id) ?? 0),
          })),
        );
      }
      if (newMovements.length > 0) {
        setMovements((prev) => [...newMovements, ...prev]);
      }

      return { success: blocked.length === 0, blocked, reasons };
    },
    [products, recipeFor],
  );

  const addRecipe = useCallback((recipe: Omit<Recipe, "id">) => {
    setRecipes((prev) => [...prev, { ...recipe, id: uid("r") }]);
  }, []);

  const recordSale = useCallback((sale: Omit<Sale, "id">) => {
    setSales((prev) => [{ ...sale, id: uid("s") }, ...prev]);
  }, []);

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
    ],
  );

  return <StockContext.Provider value={value}>{children}</StockContext.Provider>;
}

export function useStock() {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock must be used inside StockProvider");
  return ctx;
}
