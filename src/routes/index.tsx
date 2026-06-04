import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Flame, Utensils, Clock, Star, ArrowRight, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPKR, useCart } from "@/lib/cart";
import { toast } from "sonner";
import { useReveal, useCounter } from "@/hooks/use-reveal";
import hero from "@/assets/hero-bbq.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { add } = useCart();
  const { data: settings } = useQuery({
    queryKey: ["shop-settings-featured-limit"],
    queryFn: async () => {
      const { data } = await supabase.from("shop_settings").select("featured_limit").limit(1).maybeSingle();
      return data;
    },
  });
  const featuredLimit = (settings as { featured_limit?: number } | null)?.featured_limit ?? 6;
  const { data: featured } = useQuery({
    queryKey: ["featured", featuredLimit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id,name,description,price,image_url")
        .eq("featured", true)
        .eq("available", true)
        .limit(featuredLimit);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={hero}
            alt=""
            className="h-full w-full object-cover animate-kenburns"
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>
        <div className="container relative mx-auto grid min-h-[78vh] items-center px-4 py-20">
          <div className="max-w-2xl animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary animate-fade-in-up [animation-delay:0ms]">
              <Flame className="h-3.5 w-3.5" /> Char-grilled. Slow-cooked. Always fresh.
            </span>
            <h1 className="mt-5 text-5xl font-bold leading-tight tracking-tight md:text-7xl animate-fade-in-up [animation-delay:120ms]">
              The taste of <span className="text-primary">Lahore</span>,
              <br /> delivered to your door.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground animate-fade-in-up [animation-delay:240ms]">
              From smoky seekh kababs to slow-simmered karahi — Kabab Jee brings authentic Pakistani BBQ to your table.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-fade-in-up [animation-delay:360ms]">
              <Link to="/menu"><Button size="lg" className="btn-glow">Order Now <ArrowRight className="ml-1 h-4 w-4" /></Button></Link>
              <Link to="/reservations"><Button size="lg" variant="outline" className="btn-glow">Book a Table</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* Stats */}
      <StatsSection />

      {/* Featured */}
      <FeaturedSection featured={featured ?? []} onAdd={add} />

      {/* Testimonials */}
      <TestimonialsSection />
    </div>
  );
}

function FeaturesSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const items = [
    { icon: Flame, t: "Authentic Recipes", d: "Family recipes passed down three generations." },
    { icon: Clock, t: "Fast Delivery", d: "Hot from the tandoor to your door in 30–45 minutes." },
    { icon: Star, t: "Premium Ingredients", d: "Halal-certified meat, fresh herbs, hand-ground spices." },
  ];
  return (
    <section ref={ref} className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-3">
      {items.map((f, i) => (
        <Card
          key={f.t}
          className={`border-border/60 hover-premium reveal ${visible ? "is-visible" : ""}`}
          style={{ transitionDelay: `${i * 120}ms` }}
        >
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <div className="rounded-lg bg-primary/10 p-3 text-primary"><f.icon className="h-5 w-5" /></div>
            <h3 className="text-lg font-semibold">{f.t}</h3>
            <p className="text-sm text-muted-foreground">{f.d}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function Stat({ target, suffix, label }: { target: number; suffix?: string; label: string }) {
  const { ref, value } = useCounter(target);
  return (
    <div className="text-center">
      <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
        <span ref={ref}>{value.toLocaleString()}</span>{suffix}
      </div>
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section
      ref={ref}
      className={`container mx-auto grid grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4 reveal ${visible ? "is-visible" : ""}`}
    >
      <Stat target={25} suffix="+" label="Years of flavor" />
      <Stat target={120} suffix="+" label="Signature dishes" />
      <Stat target={48000} suffix="+" label="Happy customers" />
      <Stat target={30} suffix=" min" label="Avg. delivery" />
    </section>
  );
}

function FeaturedSection({
  featured,
  onAdd,
}: {
  featured: Array<{ id: string; name: string; description: string | null; price: number | string; image_url: string | null }>;
  onAdd: (item: { id: string; name: string; price: number; image_url: string | null }) => void;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <section ref={ref} className="container mx-auto px-4 pb-20">
      <div className={`mb-8 flex items-end justify-between reveal ${visible ? "is-visible" : ""}`}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Signature Dishes</h2>
          <p className="mt-1 text-muted-foreground">Our chefs' most-loved plates.</p>
        </div>
        <Link to="/menu" className="text-sm font-medium text-primary hover:underline inline-flex">
          View full menu →
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((m, i) => (
          <Card
            key={m.id}
            className={`overflow-hidden border-border/60 hover-premium reveal ${visible ? "is-visible" : ""}`}
            style={{ transitionDelay: `${i * 90}ms` }}
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
                <span className="text-primary font-bold">{formatPKR(Number(m.price))}</span>
              </div>
              {m.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>}
              <Button
                size="sm"
                className="mt-4 w-full btn-glow"
                onClick={() => {
                  onAdd({ id: m.id, name: m.name, price: Number(m.price), image_url: m.image_url });
                  toast.success(`${m.name} added to cart`);
                }}
              >
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  { name: "Ayesha K.", text: "The seekh kababs are unreal — smoky, juicy, perfectly spiced. My new favorite spot." },
  { name: "Bilal R.", text: "Karahi tasted exactly like the old Lahore street stalls. Delivery was hot and fast." },
  { name: "Sana M.", text: "Biryani so aromatic the whole house turned around. Portions are generous too." },
  { name: "Hamza T.", text: "Booked a table for a family dinner — service was warm, food was a 10/10." },
];

function TestimonialsSection() {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <section ref={ref} className="border-t border-border/60 bg-muted/30">
      <div className={`container mx-auto px-4 py-20 reveal ${visible ? "is-visible" : ""}`}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">What our guests say</h2>
          <p className="mt-2 text-muted-foreground">Real reviews from real flavor seekers.</p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{ transform: `translate3d(-${idx * 100}%, 0, 0)` }}
          >
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="w-full shrink-0 px-4">
                <Card className="border-border/60">
                  <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                    <Quote className="h-6 w-6 text-primary" />
                    <blockquote className="text-lg leading-relaxed text-foreground/90">
                      "{t.text}"
                    </blockquote>
                    <figcaption className="text-sm font-semibold text-muted-foreground">— {t.name}</figcaption>
                  </CardContent>
                </Card>
              </figure>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                aria-label={`Show testimonial ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
