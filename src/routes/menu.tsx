import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Utensils, Leaf, Drumstick } from "lucide-react";
import { formatPKR, useCart } from "@/lib/cart";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/menu")({
  head: () => ({
    meta: [
      { title: "Menu — Kabab Jee" },
      { name: "description", content: "Browse our full menu of BBQ, karahi, biryani, breads and beverages." },
      { property: "og:title", content: "Menu — Kabab Jee" },
      { property: "og:description", content: "Order char-grilled kababs, karahi, biryani and more." },
    ],
  }),
  component: MenuPage,
});

function MenuPage() {
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [foodFilter, setFoodFilter] = useState<"all" | "veg" | "non_veg">("all");
  const { add } = useCart();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: items } = useQuery({
    queryKey: ["menu-items", activeCat, foodFilter],
    queryFn: async () => {
      let q = supabase.from("menu_items").select("*, categories!inner(food_type)").eq("available", true);
      if (activeCat !== "all") q = q.eq("category_id", activeCat);
      if (foodFilter !== "all") q = q.eq("categories.food_type", foodFilter);
      const { data, error } = await q.order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const vegCats = (categories ?? []).filter((c: any) => c.food_type === "veg");
  const nonVegCats = (categories ?? []).filter((c: any) => c.food_type === "non_veg");
  const showVeg = foodFilter === "all" || foodFilter === "veg";
  const showNonVeg = foodFilter === "all" || foodFilter === "non_veg";

  const CatRow = ({ list }: { list: any[] }) => (
    <div className="-mx-1 overflow-x-auto pb-2 [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
      <div className="flex gap-2 px-1 snap-x snap-mandatory">
        {list.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={activeCat === c.id ? "default" : "outline"}
            onClick={() => setActiveCat((p) => (p === c.id ? "all" : c.id))}
            className="shrink-0 snap-start rounded-full"
          >
            {c.name}
          </Button>
        ))}
        {list.length === 0 && (
          <span className="px-2 py-1 text-sm text-muted-foreground">No categories</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full px-4 md:px-8 py-12">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Our Menu</h1>
      <p className="mt-2 text-muted-foreground">Fresh from the tandoor and the karahi pan.</p>

      <div className="mt-8 flex items-start gap-3">
        <button
          onClick={() => { setFoodFilter("all"); setActiveCat("all"); }}
          className={cn(
            "flex h-[92px] min-w-[100px] flex-col items-center justify-center gap-1 rounded-xl border px-5 text-sm font-semibold transition-all",
            foodFilter === "all"
              ? "border-primary bg-primary text-primary-foreground shadow"
              : "border-border bg-muted/40 text-foreground hover:bg-muted"
          )}
        >
          <Utensils className="h-4 w-4" />
          <span className="leading-none">All</span>
        </button>
        <div className="flex flex-col gap-2">
          {([
            { k: "veg", label: "Veg", icon: Leaf },
            { k: "non_veg", label: "Non-Veg", icon: Drumstick },
          ] as const).map(({ k, label, icon: Icon }) => (
            <button
              key={k}
              onClick={() => { setFoodFilter(k); setActiveCat("all"); }}
              className={cn(
                "inline-flex min-w-[110px] items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
                foodFilter === k
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "border-border bg-muted/40 text-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            showVeg ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 rounded-xl border border-secondary/30 bg-secondary/10 p-3">
              <div className="flex items-center gap-1.5 shrink-0 text-sm font-semibold text-secondary-foreground">
                <Leaf className="h-4 w-4 text-secondary" />
                Veg
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="min-w-0 flex-1">
                <CatRow list={vegCats} />
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            showNonVeg ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-3">
              <div className="flex items-center gap-1.5 shrink-0 text-sm font-semibold">
                <Drumstick className="h-4 w-4 text-primary" />
                Non-Veg
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="min-w-0 flex-1">
                <CatRow list={nonVegCats} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 min-[900px]:grid-cols-4">
        {(items ?? []).map((m, i) => (
          <Card
            key={m.id}
            className="overflow-hidden border-border/60 hover-premium animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i, 11) * 60}ms` }}
          >
            <div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 to-secondary/15">
              {m.image_url ? (
                <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <Utensils className="h-12 w-12 text-primary/60" />
              )}
            </div>
            <CardContent className="p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold">{m.name}</h3>
                <span className="font-bold text-primary">{formatPKR(Number(m.price))}</span>
              </div>
              {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
              <Button size="sm" className="mt-4 w-full btn-glow" onClick={() => { add({ id: m.id, name: m.name, price: Number(m.price), image_url: m.image_url }); toast.success(`${m.name} added to cart`); }}>
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
        {items?.length === 0 && <p className="col-span-full py-12 text-center text-muted-foreground">No items in this category yet.</p>}
      </div>
    </div>
  );
}