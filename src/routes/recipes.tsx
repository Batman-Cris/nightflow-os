import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FlaskConical, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { EmptyState, Panel, Pill, StatCard } from "@/components/nox/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { currency } from "@/data/demo";
import { useStock } from "@/contexts/stock-context";
import { cn } from "@/lib/utils";
import type { RecipeIngredient } from "@/types/nox";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Recetas — NOX OS" },
      {
        name: "description",
        content:
          "Definí qué lleva cada trago para que cada venta en la barra descuente el ingrediente real.",
      },
      { property: "og:title", content: "Recetas — NOX OS" },
      {
        property: "og:description",
        content: "Recetas que descuentan stock de ingredientes al vender.",
      },
    ],
  }),
  component: RecipesPage,
});

function RecipesPage() {
  const { products, recipes, movements, addRecipe } = useStock();
  const [open, setOpen] = useState(false);

  const finishedProducts = products.filter((p) => p.category !== "Ingredientes");
  const ingredientProducts = products.filter((p) => p.category === "Ingredientes");
  const productsWithoutRecipe = finishedProducts.filter(
    (p) => !recipes.some((r) => r.productId === p.id),
  );
  const recipeSalesTonight = movements.filter((m) => m.type === "Recipe").length;

  const rows = useMemo(
    () =>
      recipes.map((r) => {
        const product = products.find((p) => p.id === r.productId);
        const cost = r.ingredients.reduce((s, ing) => {
          const ingredient = products.find((p) => p.id === ing.productId);
          return s + (ingredient?.cost ?? 0) * ing.qty;
        }, 0);
        const price = product?.price ?? 0;
        const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
        return { recipe: r, product, cost, margin };
      }),
    [recipes, products],
  );

  const avgMargin = rows.length ? rows.reduce((s, r) => s + r.margin, 0) / rows.length : 0;

  return (
    <AppShell
      title="Recetas"
      description="Recetas → Stock: cada trago vendido descuenta sus ingredientes reales automáticamente."
      actions={
        <Button
          size="sm"
          onClick={() => setOpen(true)}
          disabled={productsWithoutRecipe.length === 0}
        >
          <Plus className="mr-1.5 size-4" /> Nueva receta
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Recetas definidas" value={String(recipes.length)} icon={FlaskConical} />
        <StatCard
          label="Ingredientes cargados"
          value={String(ingredientProducts.length)}
          icon={FlaskConical}
        />
        <StatCard label="Margen promedio" value={`${avgMargin.toFixed(0)}%`} icon={FlaskConical} />
        <StatCard
          label="Descuentos por receta esta noche"
          value={String(recipeSalesTonight)}
          icon={FlaskConical}
          hint="movimientos de ingredientes registrados"
        />
      </div>

      <Panel
        className="mt-6"
        title="Recetas de la carta"
        subtitle="El costo y el margen se calculan en vivo según el costo de los ingredientes"
      >
        {rows.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="Todavía no hay recetas"
            body="Creá tu primera receta para empezar a descontar ingredientes reales en cada venta."
            action={
              <Button size="sm" onClick={() => setOpen(true)}>
                <Plus className="mr-1.5 size-4" /> Nueva receta
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {rows.map(({ recipe, product, cost, margin }) => (
              <div key={recipe.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{product?.name ?? "Producto desconocido"}</p>
                    <p className="text-xs text-muted-foreground">
                      Se vende a {currency(product?.price ?? 0)}
                    </p>
                  </div>
                  <Pill tone={margin >= 70 ? "success" : margin >= 40 ? "warning" : "danger"}>
                    {margin.toFixed(0)}% margen
                  </Pill>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {recipe.ingredients.map((ing) => {
                    const ingredient = products.find((p) => p.id === ing.productId);
                    const servingsLeft =
                      ingredient && ingredient.minStock > 0
                        ? Math.floor(ingredient.stock / ing.qty)
                        : null;
                    return (
                      <li
                        key={ing.productId}
                        className="flex items-center justify-between text-sm text-muted-foreground"
                      >
                        <span>
                          {ing.qty}
                          {ing.unit} {ingredient?.name ?? ing.productId}
                        </span>
                        {servingsLeft !== null && (
                          <span
                            className={cn(
                              "text-xs",
                              servingsLeft <= 15 && "font-medium text-warning",
                            )}
                          >
                            {servingsLeft} tragos restantes
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  Costo de ingredientes: {currency(cost)} por trago
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <NewRecipeDialog
        open={open}
        onOpenChange={setOpen}
        candidates={productsWithoutRecipe}
        ingredients={ingredientProducts}
        onSave={(recipe) => {
          addRecipe(recipe);
          toast.success("Receta guardada — de ahora en más descuenta stock solo en cada venta.");
          setOpen(false);
        }}
      />
    </AppShell>
  );
}

function NewRecipeDialog({
  open,
  onOpenChange,
  candidates,
  ingredients,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: { id: string; name: string }[];
  ingredients: { id: string; name: string }[];
  onSave: (recipe: { productId: string; ingredients: RecipeIngredient[] }) => void;
}) {
  const [productId, setProductId] = useState("");
  const [rows, setRows] = useState<{ productId: string; qty: string; unit: string }[]>([
    { productId: "", qty: "", unit: "ml" },
  ]);

  const reset = () => {
    setProductId("");
    setRows([{ productId: "", qty: "", unit: "ml" }]);
  };

  const canSave =
    productId !== "" &&
    rows.every((r) => r.productId !== "" && Number(r.qty) > 0) &&
    rows.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva receta</DialogTitle>
          <DialogDescription>
            Elegí el producto final y cada ingrediente que consume. Una venta en la barra de este
            producto va a descontar todo esto automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Producto final</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Elegí un producto…" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ingredientes</Label>
            {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={row.productId}
                  onValueChange={(v) =>
                    setRows((prev) =>
                      prev.map((r, idx) => (idx === i ? { ...r, productId: v } : r)),
                    )
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Ingrediente…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id}>
                        {ing.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="w-20"
                  placeholder="Cant."
                  inputMode="decimal"
                  value={row.qty}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, idx) => (idx === i ? { ...r, qty: e.target.value } : r)),
                    )
                  }
                />
                <Input
                  className="w-16"
                  placeholder="unidad"
                  value={row.unit}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  disabled={rows.length === 1}
                  onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, { productId: "", qty: "", unit: "ml" }])}
            >
              <Plus className="mr-1.5 size-3.5" /> Agregar ingrediente
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!canSave}
            onClick={() =>
              onSave({
                productId,
                ingredients: rows.map((r) => ({
                  productId: r.productId,
                  qty: Number(r.qty),
                  unit: r.unit || "u",
                })),
              })
            }
          >
            Guardar receta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
