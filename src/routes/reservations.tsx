import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle2, XCircle, Clock, CalendarDays, UtensilsCrossed, Sparkles, ShieldCheck, MapPin, Phone, Info, Mail, MessageCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export const Route = createFileRoute("/reservations")({
  head: () => ({ meta: [{ title: "Book a Table — Kabab Jee" }] }),
  component: ReservationsPage,
});

function ReservationsPage() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fmtDay = (d: Date) =>
    d.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  const toYmd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dayOptions = [
    { value: toYmd(today), label: `Today — ${fmtDay(today)}` },
    { value: toYmd(tomorrow), label: `Tomorrow — ${fmtDay(tomorrow)}` },
  ];

  // Build 30-min time slots from 12:00 to 23:30 — consistent across all browsers.
  const timeSlots = (() => {
    const slots: { value: string; label: string }[] = [];
    for (let h = 7; h <= 23; h++) {
      for (const m of [0, 30]) {
        if (h === 23 && m === 30) continue; // up to 23:00 (11 PM)
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        const value = `${hh}:${mm}`;
        const hour12 = ((h + 11) % 12) + 1;
        const ampm = h < 12 ? "AM" : "PM";
        slots.push({ value, label: `${hour12}:${mm} ${ampm}` });
      }
    }
    return slots;
  })();

  const { data: tables } = useQuery({
    queryKey: ["public-tables"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_tables")
        .select("id,label,seats,status");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: shopSettings } = useQuery({
    queryKey: ["public-shop-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as { max_party_size?: number } | null;
    },
  });
  const maxPartySize = shopSettings?.max_party_size ?? 8;

  const stats = (() => {
    const list = tables ?? [];
    const by = (s: string) => list.filter((t) => t.status === s);
    const seatsOf = (s: string) => by(s).reduce((sum, t) => sum + (t.seats || 0), 0);
    return {
      total: list.length,
      free: by("free").length,
      booked: by("booked").length,
      reserved: by("reserved").length,
      freeSeats: seatsOf("free"),
      bookedSeats: seatsOf("booked"),
      reservedSeats: seatsOf("reserved"),
    };
  })();

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_whatsapp: "",
    reservation_day: toYmd(today),
    reservation_time: "",
    party_size: 2,
    special_requests: "",
    table_id: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const freeTables = (tables ?? []).filter((t) => t.status === "free").sort((a, b) => a.seats - b.seats);
  const chosenTable = freeTables.find((t) => t.id === form.table_id);
  const largestFreeSeats = freeTables.reduce((m, t) => Math.max(m, t.seats), 0);
  const isLargeParty = form.party_size > largestFreeSeats;
  const combinedAt = form.reservation_day && form.reservation_time ? new Date(`${form.reservation_day}T${form.reservation_time}`) : null;
  const prettyDate = combinedAt && !isNaN(combinedAt.getTime()) ? combinedAt.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;

  // If party size increases above currently selected table seats, clear the selection.
  useEffect(() => {
    if (form.table_id) {
      const selected = freeTables.find((t) => t.id === form.table_id);
      if (selected && selected.seats < form.party_size) {
        setForm((prev) => ({ ...prev, table_id: "" }));
      }
    }
  }, [form.party_size, freeTables, form.table_id]);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: "/reservations" } });
  }, [loading, user, nav]);

  // Pakistani mobile: 03XX-XXXXXXX (11 digits starting with 03) or +923XXXXXXXXX
  const isValidPkPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits.startsWith("92") && digits.length === 12) return /^923\d{9}$/.test(digits);
    return /^03\d{9}$/.test(digits);
  };
  const isValidEmail = (raw: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isValidPkPhone(form.customer_phone)) return toast.error("Enter a valid Pakistani mobile (e.g. 03XX-XXXXXXX)");
    if (!isValidPkPhone(form.customer_whatsapp)) return toast.error("Enter a valid Pakistani WhatsApp number (e.g. 03XX-XXXXXXX)");
    if (!isValidEmail(form.customer_email)) return toast.error("Enter a valid email address");
    if (!form.reservation_time) return toast.error("Please pick a time");
    if (!combinedAt || isNaN(combinedAt.getTime())) return toast.error("Please pick a valid date & time");
    const maxAt = new Date(tomorrow); maxAt.setHours(23, 59, 59, 999);
    if (combinedAt < new Date()) return toast.error("Please pick a future time");
    if (combinedAt > maxAt) return toast.error("Reservations can only be booked for today or tomorrow");
    if (!isLargeParty && !form.table_id) return toast.error("Please choose a table");
    void submitReservation();
  };

  const submitReservation = async () => {
    if (!user) return;
    setSubmitting(true);
    const chosen = freeTables.find((t) => t.id === form.table_id);
    const tableNote = chosen
      ? `Table: ${chosen.label} (${chosen.seats} seats)`
      : isLargeParty
      ? `Large party (${form.party_size}) — seating to be arranged`
      : "";
    const contactNote = `Email: ${form.customer_email} — WhatsApp: ${form.customer_whatsapp}`;
    const notes = [tableNote, contactNote, form.special_requests].filter(Boolean).join(" — ");
    const { error } = await supabase.from("reservations").insert({
      user_id: user.id,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      reservation_at: combinedAt!.toISOString(),
      party_size: Number(form.party_size),
      special_requests: notes || null,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Reservation requested! We'll confirm shortly.");
    setForm({ customer_name: "", customer_phone: "", customer_email: "", customer_whatsapp: "", reservation_day: toYmd(today), reservation_time: "", party_size: 2, special_requests: "", table_id: "" });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-accent/10 to-transparent" />
        <div className="absolute inset-0 opacity-[0.04] bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22><circle cx=%221%22 cy=%221%22 r=%221%22 fill=%22%23000%22/></svg>')]" />
        <div className="container relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Reserve your table
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            An evening of <span className="text-primary italic">slow-cooked</span> kababs
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted-foreground">
            Pick a time, choose your table, and we'll have the grill ready. We'll confirm your booking shortly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 border border-border/60"><CheckCircle2 className="h-3.5 w-3.5 text-secondary" /> {stats.free} free tables</div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 border border-border/60"><Users className="h-3.5 w-3.5" /> {stats.freeSeats} seats open</div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-card/70 px-3 py-1.5 border border-border/60"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Instant confirmation</div>
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-6xl px-4 py-10 lg:py-14">
        <Alert className="mb-6 border-primary/30 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>Please provide valid contact details</AlertTitle>
          <AlertDescription>
            Enter a valid <strong>email</strong>, <strong>cell number</strong>, and <strong>WhatsApp number</strong>. After we receive your reservation, our team will contact you to confirm and walk you through the booking policy.
          </AlertDescription>
        </Alert>
        <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* LEFT: form */}
          <div className="space-y-6">
            {/* Guest */}
            <Section icon={<Users className="h-4 w-4" />} step={1} title="Who's joining?" desc="We'll text you a reminder before your booking.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name">
                  <Input required placeholder="e.g. Ayesha Khan" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </Field>
                <Field label="Cell number (Pakistan)">
                  <Input
                    required
                    inputMode="tel"
                    placeholder="03XX-XXXXXXX"
                    value={form.customer_phone}
                    onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                    aria-invalid={form.customer_phone.length > 0 && !isValidPkPhone(form.customer_phone)}
                  />
                  {form.customer_phone.length > 0 && !isValidPkPhone(form.customer_phone) && (
                    <p className="text-[11px] text-destructive">Use a Pakistani format like 03XX-XXXXXXX.</p>
                  )}
                </Field>
                <Field label="Email">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      required
                      type="email"
                      placeholder="you@example.com"
                      className="pl-8"
                      value={form.customer_email}
                      onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
                      aria-invalid={form.customer_email.length > 0 && !isValidEmail(form.customer_email)}
                    />
                  </div>
                </Field>
                <Field label="WhatsApp number (Pakistan)">
                  <div className="relative">
                    <MessageCircle className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      required
                      inputMode="tel"
                      placeholder="03XX-XXXXXXX"
                      className="pl-8"
                      value={form.customer_whatsapp}
                      onChange={(e) => setForm({ ...form, customer_whatsapp: e.target.value })}
                      aria-invalid={form.customer_whatsapp.length > 0 && !isValidPkPhone(form.customer_whatsapp)}
                    />
                  </div>
                  {form.customer_whatsapp.length > 0 && !isValidPkPhone(form.customer_whatsapp) && (
                    <p className="text-[11px] text-destructive">Use a Pakistani format like 03XX-XXXXXXX.</p>
                  )}
                </Field>
              </div>
            </Section>

            {/* When */}
            <Section icon={<CalendarDays className="h-4 w-4" />} step={2} title="When & how many?" desc="Bookings open for today or tomorrow only.">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Day">
                  <select
                    required
                    value={form.reservation_day}
                    onChange={(e) => setForm({ ...form, reservation_day: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {dayOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Month & year are set automatically.</p>
                </Field>
                <Field label="Time">
                  <select
                    required
                    value={form.reservation_time}
                    onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>Select time</option>
                    {timeSlots.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Party size">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, party_size: Math.max(1, form.party_size - 1) })}>−</Button>
                    <Input type="number" min={1} max={maxPartySize} required value={form.party_size} onChange={(e) => setForm({ ...form, party_size: Math.min(maxPartySize, Math.max(1, Number(e.target.value) || 1)) })} className="text-center" />
                    <Button type="button" variant="outline" size="icon" onClick={() => setForm({ ...form, party_size: Math.min(maxPartySize, form.party_size + 1) })}>+</Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Up to {maxPartySize} guests. For larger groups, please call us.</p>
                </Field>
              </div>
            </Section>

            {/* Table */}
            <Section icon={<UtensilsCrossed className="h-4 w-4" />} step={3} title="Pick your table" desc={`${stats.free} of ${stats.total} tables are available right now.`}>
              {freeTables.length === 0 && !isLargeParty ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No free tables right now. Please try a different time or contact us.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {isLargeParty && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, table_id: "" })}
                      className={`group relative col-span-2 sm:col-span-3 rounded-xl border p-4 text-left ${!form.table_id ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30" : "border-primary/40 bg-primary/5 hover:border-primary"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary">More than {largestFreeSeats} people — combined seating</span>
                        {!form.table_id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" /> Party of {form.party_size} — our team will arrange tables and confirm by phone/WhatsApp.
                      </div>
                    </button>
                  )}
                  {freeTables.map((t) => {
                    const active = form.table_id === t.id;
                    const fits = t.seats >= form.party_size;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={!fits}
                        onClick={() => fits && setForm({ ...form, table_id: t.id })}
                        className={`group relative rounded-xl border p-3 text-left ${active ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30" : fits ? "border-border bg-card hover:border-primary/50 hover:bg-primary/5" : "border-border/50 bg-muted/40 opacity-50 cursor-not-allowed"}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${!fits ? "line-through" : ""}`}>{t.label}</span>
                          {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" /> {t.seats} seats
                        </div>
                        {!fits && (
                          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-destructive">
                            Too small
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-secondary" /> Free {stats.free}</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> Booked {stats.booked}</span>
                <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" /> Reserved {stats.reserved}</span>
              </div>
            </Section>

            {/* Notes */}
            <Section icon={<Sparkles className="h-4 w-4" />} step={4} title="Anything special?" desc="Birthday, allergies, seating preference — let us know.">
              <Textarea rows={3} placeholder="Optional notes for the team…" value={form.special_requests} onChange={(e) => setForm({ ...form, special_requests: e.target.value })} />
            </Section>
          </div>

          {/* RIGHT: sticky summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg">
              <div className="bg-gradient-to-br from-primary to-primary/70 p-5 text-primary-foreground">
                <div className="text-xs font-medium uppercase tracking-wider opacity-80">Your booking</div>
                <div className="mt-1 text-lg font-semibold">{prettyDate ?? "Pick a date & time"}</div>
                <div className="mt-0.5 text-sm opacity-90">
                  {form.party_size} {form.party_size === 1 ? "guest" : "guests"}
                  {chosenTable ? ` • ${chosenTable.label}` : ""}
                </div>
              </div>
              <div className="space-y-4 p-5">
                <SummaryRow label="Guest" value={form.customer_name || "—"} />
                <SummaryRow label="Phone" value={form.customer_phone || "—"} icon={<Phone className="h-3.5 w-3.5" />} />
                <SummaryRow label="Table" value={chosenTable ? `${chosenTable.label} • ${chosenTable.seats} seats` : "Not selected"} icon={<MapPin className="h-3.5 w-3.5" />} />

                <Button type="submit" size="lg" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Confirm reservation"}
                </Button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Free cancellation up to 2 hours before your booking.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground lg:grid-cols-1 lg:text-left">
              <div className="rounded-lg border border-border/60 bg-card/60 p-3 lg:flex lg:items-center lg:gap-2">
                <ShieldCheck className="mx-auto h-4 w-4 text-secondary lg:mx-0" />
                <span className="mt-1 block lg:mt-0">Secure booking</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/60 p-3 lg:flex lg:items-center lg:gap-2">
                <Clock className="mx-auto h-4 w-4 text-primary lg:mx-0" />
                <span className="mt-1 block lg:mt-0">Held 15 min past time</span>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/60 p-3 lg:flex lg:items-center lg:gap-2">
                <XCircle className="mx-auto h-4 w-4 text-destructive lg:mx-0" />
                <span className="mt-1 block lg:mt-0">No-show may cancel booking</span>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Section({ icon, step, title, desc, children }: { icon: React.ReactNode; step: number; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-content-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Step {step}</span>
          </div>
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">{icon}{label}</span>
      <span className="truncate font-medium text-right">{value}</span>
    </div>
  );
}