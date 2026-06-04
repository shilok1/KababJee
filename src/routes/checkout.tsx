import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPKR, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CreditCard, Banknote } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Kabab Jee" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", customer_email: "", customer_whatsapp: "", delivery_address: "", notes: "",
    payment_method: "cod" as "cod" | "card",
    card_number: "", card_expiry: "", card_cvc: "",
  });
  const deliveryFee = items.length > 0 ? 150 : 0;
  const total = subtotal + deliveryFee;

  useEffect(() => { if (!loading && !user) nav({ to: "/login", search: { redirect: "/checkout" } }); }, [loading, user, nav]);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data) setForm((f) => ({ ...f, customer_name: data.full_name ?? "", customer_phone: data.phone ?? "", customer_email: f.customer_email || (user.email ?? ""), delivery_address: data.address ?? "" }));
      });
    }
  }, [user]);

  if (items.length === 0) return <div className="container mx-auto px-4 py-24 text-center">Your cart is empty.</div>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.customer_name.trim().length < 2) return toast.error("Enter your full name");
    if (!/^[+\d][\d\s\-()]{6,19}$/.test(form.customer_phone.trim())) return toast.error("Enter a valid phone number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email.trim())) return toast.error("Enter a valid email address");
    if (!/^[+\d][\d\s\-()]{6,19}$/.test(form.customer_whatsapp.trim())) return toast.error("Enter a valid WhatsApp number");
    if (form.delivery_address.trim().length < 5) return toast.error("Enter a delivery address");
    if (form.payment_method === "card") {
      if (!/^\d{13,19}$/.test(form.card_number.replace(/\s/g, ""))) return toast.error("Enter a valid card number");
      if (!/^\d{2}\/\d{2}$/.test(form.card_expiry)) return toast.error("Expiry must be MM/YY");
      if (!/^\d{3,4}$/.test(form.card_cvc)) return toast.error("Invalid CVC");
    }
    void placeOrder();
  };

  const placeOrder = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const { data: order, error } = await supabase.from("orders").insert({
        user_id: user.id,
        customer_name: form.customer_name, customer_phone: form.customer_phone,
        customer_email: form.customer_email, customer_whatsapp: form.customer_whatsapp,
        delivery_address: form.delivery_address, notes: form.notes || null,
        subtotal, delivery_fee: deliveryFee, total,
        payment_method: form.payment_method,
        // Card payments are not really processed yet — keep them unpaid until a
        // real payment provider confirms server-side.
        payment_status: "unpaid",
        status: "pending",
      }).select().single();
      if (error) throw error;
      const lineItems = items.map((i) => ({
        order_id: order.id, menu_item_id: i.id, item_name: i.name,
        unit_price: i.price, quantity: i.quantity, line_total: i.price * i.quantity,
      }));
      const { error: liErr } = await supabase.from("order_items").insert(lineItems);
      if (liErr) throw liErr;
      await supabase.from("profiles").update({
        full_name: form.customer_name, phone: form.customer_phone, address: form.delivery_address,
      }).eq("id", user.id);
      clear();
      toast.success("Order placed!");
      nav({ to: "/account" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not place order");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-[1fr_360px]">
      <form onSubmit={onSubmit} className="space-y-6 animate-fade-in-up">
        <h1 className="text-3xl font-bold">Checkout</h1>
        <Card className="hover-lift animate-fade-in-up [animation-delay:80ms]"><CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Delivery Details</h2>
          <div><Label>Full name</Label><Input required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
          <div><Label>Phone</Label><Input required value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></div>
          <div><Label>Email</Label><Input type="email" required value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} /></div>
          <div><Label>WhatsApp number</Label><Input required placeholder="e.g. +92 300 1234567" value={form.customer_whatsapp} onChange={(e) => setForm({ ...form, customer_whatsapp: e.target.value })} /></div>
          <div><Label>Delivery address</Label><Textarea required rows={3} value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} /></div>
          <div><Label>Order notes (optional)</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </CardContent></Card>
        <Card className="hover-lift animate-fade-in-up [animation-delay:160ms]"><CardContent className="space-y-4 p-6">
          <h2 className="font-semibold">Payment Method</h2>
          <RadioGroup value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v as "cod" | "card" })} className="space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <RadioGroupItem value="cod" id="cod" /><Banknote className="h-5 w-5 text-primary" />
              <div><div className="font-medium">Cash on Delivery</div><div className="text-xs text-muted-foreground">Pay with cash when your order arrives.</div></div>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/60 p-4 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
              <RadioGroupItem value="card" id="card" /><CreditCard className="h-5 w-5 text-primary" />
              <div><div className="font-medium">Credit / Debit Card</div><div className="text-xs text-muted-foreground">Visa, Mastercard accepted.</div></div>
            </label>
          </RadioGroup>
          {form.payment_method === "card" && (
            <div className="space-y-3 rounded-lg border border-border/60 p-4">
              <div><Label>Card number</Label><Input inputMode="numeric" placeholder="1234 5678 9012 3456" value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Expiry (MM/YY)</Label><Input placeholder="08/27" value={form.card_expiry} onChange={(e) => setForm({ ...form, card_expiry: e.target.value })} /></div>
                <div><Label>CVC</Label><Input inputMode="numeric" placeholder="123" value={form.card_cvc} onChange={(e) => setForm({ ...form, card_cvc: e.target.value })} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Demo mode — no real charge is made. Connect a payment provider to accept live payments.</p>
            </div>
          )}
        </CardContent></Card>
        <Button type="submit" size="lg" disabled={submitting} className="w-full transition-transform hover:scale-[1.01] active:scale-[0.99]">{submitting ? "Placing order..." : `Place order — ${formatPKR(total)}`}</Button>
      </form>
      <Card className="h-fit animate-fade-in-up [animation-delay:120ms]"><CardContent className="p-6">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <div className="mt-4 space-y-2 text-sm">
          {items.map((i) => (<div key={i.id} className="flex justify-between"><span>{i.quantity}× {i.name}</span><span>{formatPKR(i.price * i.quantity)}</span></div>))}
          <div className="border-t border-border/60 pt-2" />
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatPKR(subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatPKR(deliveryFee)}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Total</span><span className="text-primary">{formatPKR(total)}</span></div>
        </div>
      </CardContent></Card>
    </div>
  );
}