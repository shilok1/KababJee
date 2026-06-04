import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/cart";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/")({
  component: AdminOrders,
});

function AdminOrders() {
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: orders, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: detail } = useQuery({
    queryKey: ["admin-order-items", openId],
    enabled: !!openId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", openId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as never }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order ${status}`);
    refetch();
  };

  const current = orders?.find((o) => o.id === openId) ?? null;

  return (
    <div>
      <h2 className="text-xl font-semibold">Recent Orders</h2>
      <div className="mt-4 space-y-3">
        {(orders ?? []).map((o) => (
          <Card key={o.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="font-medium">{o.customer_name} · {o.customer_phone}</div>
                <div className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString()}</div>
                <div className="mt-1 flex gap-2">
                  <Badge variant="secondary">{o.status}</Badge>
                  <Badge variant="outline">{o.payment_method.toUpperCase()} · {o.payment_status}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-primary">{formatPKR(Number(o.total))}</span>
                <select
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                >
                  {["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Button size="sm" variant="outline" onClick={() => setOpenId(o.id)}>
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(orders ?? []).length === 0 && (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No orders yet.</CardContent></Card>
        )}
      </div>

      <Dialog open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              {current && <>#{current.id.slice(0, 8)} · {new Date(current.created_at).toLocaleString()}</>}
            </DialogDescription>
          </DialogHeader>
          {current && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Info label="Customer" value={current.customer_name} />
                <Info label="Phone" value={current.customer_phone} />
                <Info label="Delivery Address" value={current.delivery_address} className="sm:col-span-2" />
                {current.notes && <Info label="Notes" value={current.notes} className="sm:col-span-2" />}
                <Info label="Status" value={current.status} />
                <Info label="Payment" value={`${current.payment_method.toUpperCase()} · ${current.payment_status}`} />
                <Info label="User ID" value={current.user_id ?? "Guest"} />
                <Info label="Updated" value={new Date(current.updated_at).toLocaleString()} />
              </div>

              <div>
                <div className="mb-2 font-medium">Items</div>
                <div className="overflow-hidden rounded-md border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Unit</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail ?? []).map((it) => (
                        <tr key={it.id} className="border-t border-border">
                          <td className="px-3 py-2">{it.item_name}</td>
                          <td className="px-3 py-2 text-right">{it.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatPKR(Number(it.unit_price))}</td>
                          <td className="px-3 py-2 text-right">{formatPKR(Number(it.line_total))}</td>
                        </tr>
                      ))}
                      {(detail ?? []).length === 0 && (
                        <tr><td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">Loading…</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ml-auto w-full max-w-xs space-y-1 rounded-md border border-border p-3">
                <Row label="Subtotal" value={formatPKR(Number(current.subtotal))} />
                <Row label="Delivery Fee" value={formatPKR(Number(current.delivery_fee))} />
                <Row label="Total" value={formatPKR(Number(current.total))} bold />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="break-words">{value}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-primary" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}