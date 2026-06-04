import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/admin/tables")({
  component: AdminTables,
});

type RTable = { id: string; label: string; seats: number; status: string; notes: string | null };

const STATUSES = ["free", "booked", "reserved"] as const;

const colors: Record<string, string> = {
  free: "bg-green-500/10 text-green-500 border-green-500/30",
  booked: "bg-red-500/10 text-red-500 border-red-500/30",
  reserved: "bg-amber-500/10 text-amber-500 border-amber-500/30",
};

function AdminTables() {
  const { data: tables, refetch } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: async () => {
      const { data, error } = await supabase.from("restaurant_tables").select("*").order("label");
      if (error) throw error;
      return (data ?? []) as RTable[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ label: "", seats: 2 });

  const free = (tables ?? []).filter((t) => t.status === "free");
  const occupied = (tables ?? []).filter((t) => t.status !== "free");
  const totalSeatsFree = free.reduce((s, t) => s + t.seats, 0);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("restaurant_tables").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };
  const remove = async (id: string) => {
    if (!confirm("Remove this table?")) return;
    const { error } = await supabase.from("restaurant_tables").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };
  const add = async () => {
    if (!form.label.trim() || form.seats < 1) return toast.error("Label and seats required");
    const { error } = await supabase.from("restaurant_tables").insert({ label: form.label.trim(), seats: form.seats, status: "free" });
    if (error) return toast.error(error.message);
    toast.success("Table added");
    setOpen(false);
    setForm({ label: "", seats: 2 });
    refetch();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Tables & Seating</h2>
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Add table</Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="text-2xl font-bold">{tables?.length ?? 0}</div><div className="text-xs text-muted-foreground">Total tables</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-green-500">{free.length}</div><div className="text-xs text-muted-foreground">Free tables · {totalSeatsFree} seats</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-2xl font-bold text-red-500">{occupied.length}</div><div className="text-xs text-muted-foreground">Booked / reserved</div></CardContent></Card>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(tables ?? []).map((t) => (
          <Card key={t.id} className={`border ${colors[t.status]}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-semibold">{t.label}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" /> {t.seats} seats
                  </div>
                </div>
                <Badge variant="outline" className="uppercase">{t.status}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={t.status === s ? "default" : "outline"}
                    onClick={() => setStatus(t.id, s)}
                  >
                    {s}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add table</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Label</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Table 7" /></div>
            <div><Label>Seats</Label><Input type="number" min={1} value={form.seats} onChange={(e) => setForm({ ...form, seats: Number(e.target.value) })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={add}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}