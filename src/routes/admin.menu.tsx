import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { formatPKR } from "@/lib/cart";

export const Route = createFileRoute("/admin/menu")({
  component: AdminMenu,
});

type Item = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  available: boolean;
  featured: boolean;
};

function AdminMenu() {
  const { data: cats } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name,slug").order("display_order");
      return data ?? [];
    },
  });
  const { data: items, refetch } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id,name,description,price,image_url,category_id,available,featured")
        .order("name");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing({ id: "", name: "", description: "", price: 0, image_url: "", category_id: cats?.[0]?.id ?? null, available: true, featured: false });
    setOpen(true);
  };
  const openEdit = (it: Item) => { setEditing(it); setOpen(true); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim() || editing.price <= 0) return toast.error("Name and price required");
    const payload = {
      name: editing.name.trim(),
      description: editing.description || null,
      price: Number(editing.price),
      image_url: editing.image_url || null,
      category_id: editing.category_id,
      available: editing.available,
      featured: editing.featured,
    };
    const { error } = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing.id ? "Updated" : "Added");
    setOpen(false);
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refetch();
  };

  const toggle = async (id: string, field: "available" | "featured", value: boolean) => {
    const patch = field === "available" ? { available: value } : { featured: value };
    const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Menu Items</h2>
        <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add dish</Button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(items ?? []).map((it) => (
          <Card key={it.id}>
            <CardContent className="p-4">
              {it.image_url && (
                <img src={it.image_url} alt={it.name} className="mb-3 h-32 w-full rounded object-cover" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-sm text-primary">{formatPKR(Number(it.price))}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(it)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{it.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-2">
                  <Switch checked={it.available} onCheckedChange={(v) => toggle(it.id, "available", v)} />
                  Available
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={it.featured} onCheckedChange={(v) => toggle(it.id, "featured", v)} />
                  Featured
                </label>
                {!it.available && <Badge variant="secondary">Out of stock</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {(items ?? []).length === 0 && (
          <Card><CardContent className="p-6 text-center text-muted-foreground">No menu items yet.</CardContent></Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit dish" : "Add new dish"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Price (PKR)</Label>
                  <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
                </div>
                <div>
                  <Label>Category</Label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm"
                    value={editing.category_id ?? ""}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                  >
                    <option value="">— None —</option>
                    {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <Label>Image URL</Label>
                <Input value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.available} onCheckedChange={(v) => setEditing({ ...editing, available: v })} /> Available
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.featured} onCheckedChange={(v) => setEditing({ ...editing, featured: v })} /> Featured
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}