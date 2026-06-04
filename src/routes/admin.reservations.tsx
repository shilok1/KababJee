import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Calendar, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservations,
});

const STATUSES = ["pending", "confirmed", "seated", "cancelled", "no_show"] as const;

function AdminReservations() {
  const { data: reservations, refetch } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reservations").update({ status: status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Reservation ${status}`);
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this reservation?")) return;
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reservation deleted");
    refetch();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Reservations</h2>
      <div className="mt-4 space-y-3">
        {(reservations ?? []).map((r, idx) => (
          <Card key={r.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="min-w-0">
                <div className="font-medium">
                  <span className="mr-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">#{idx + 1}</span>
                  {r.customer_name} · {r.customer_phone}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(r.reservation_at).toLocaleString()}</span>
                  <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{r.party_size}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Booked: {new Date(r.created_at).toLocaleString()}</span>
                  <span>#{r.id.slice(0, 8)}</span>
                </div>
                {r.special_requests && (
                  <div className="mt-1 max-w-xl break-words text-xs text-muted-foreground">{r.special_requests}</div>
                )}
                <div className="mt-2"><Badge variant="secondary">{r.status}</Badge></div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                  value={r.status}
                  onChange={(e) => updateStatus(r.id, e.target.value)}
                >
                  {STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                <button onClick={() => remove(r.id)} className="rounded-md border border-border px-2 py-1 text-sm text-destructive hover:bg-destructive/10">Delete</button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(reservations ?? []).length === 0 && (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No reservations yet.</CardContent></Card>
        )}
      </div>
    </div>
  );
}