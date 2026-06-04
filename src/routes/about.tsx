import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Kabab Jee" },
      { name: "description", content: "The story behind Kabab Jee — three generations of authentic Pakistani BBQ." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
        <Flame className="h-3.5 w-3.5" /> Our Story
      </div>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">Three generations of Pakistani BBQ</h1>
      <p className="mt-6 text-lg text-muted-foreground">
        KababJee Hyderabad started as a small charcoal grill in 1972. Today, we bring the same family recipes —
        slow-marinated meats, hand-ground spices, and that unmistakable smoky char — straight to your table in Hyderabad.
      </p>
      <p className="mt-4 text-muted-foreground">
        Every kabab is hand-skewered, every karahi is cooked to order in a heavy iron pan, and every biryani is layered
        with saffron rice and tender meat. We use only halal-certified ingredients and source our spices fresh weekly.
      </p>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div><div className="text-3xl font-bold text-primary">50+</div><div className="text-sm text-muted-foreground">Years of tradition</div></div>
        <div><div className="text-3xl font-bold text-primary">120k</div><div className="text-sm text-muted-foreground">Happy customers</div></div>
        <div><div className="text-3xl font-bold text-primary">100%</div><div className="text-sm text-muted-foreground">Halal certified</div></div>
      </div>
    </div>
  );
}