import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/cart";
import { Search, Users as UsersIcon, Mail, Phone, MapPin, Calendar } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  orders_count: number;
  total_spent: number;
};

function AdminUsers() {
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.trim().toLowerCase();
    if (!s) return data;
    return data.filter((u) =>
      [u.email, u.full_name, u.phone].some((v) => (v ?? "").toLowerCase().includes(s)),
    );
  }, [data, q]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Registered users</h2>
          {data && <Badge variant="secondary">{data.length}</Badge>}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email or phone"
            className="pl-9"
          />
        </div>
      </div>

      {isLoading && <div className="text-sm text-muted-foreground">Loading users…</div>}
      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load users"}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-md border border-border/60 p-8 text-center text-sm text-muted-foreground">
          No users match your search.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((u) => (
          <Card key={u.id} className="hover-lift">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{u.full_name || "Unnamed user"}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{u.email ?? "—"}</span>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {u.orders_count} order{u.orders_count === 1 ? "" : "s"}
                </Badge>
              </div>

              <div className="grid gap-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{u.phone || "No phone"}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="line-clamp-2">{u.address || "No address"}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>Joined {new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-2 text-xs">
                <span className="text-muted-foreground">
                  {u.last_sign_in_at
                    ? `Last seen ${new Date(u.last_sign_in_at).toLocaleDateString()}`
                    : "Never signed in"}
                </span>
                <span className="font-semibold text-primary">{formatPKR(Number(u.total_spent) || 0)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
