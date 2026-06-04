import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { data, refetch } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [isOpen, setIsOpen] = useState(true);
  const [msg, setMsg] = useState("");
  const [maxParty, setMaxParty] = useState<number>(8);
  const [featuredLimit, setFeaturedLimit] = useState<number>(6);

  useEffect(() => {
    if (data) {
      setIsOpen(data.is_open);
      setMsg(data.closed_message ?? "");
      setMaxParty((data as { max_party_size?: number }).max_party_size ?? 8);
      setFeaturedLimit((data as { featured_limit?: number }).featured_limit ?? 6);
    }
  }, [data]);

  const save = async () => {
    if (!data) return;
    const { error } = await supabase
      .from("shop_settings")
      .update({ is_open: isOpen, closed_message: msg, max_party_size: maxParty, featured_limit: featuredLimit } as never)
      .eq("id", data.id);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    refetch();
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold">Shop Settings</h2>
      <Card className="mt-4">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Shop is {isOpen ? "Open" : "Closed"}</Label>
              <p className="text-xs text-muted-foreground">
                When closed, customers see your message and cannot place orders.
              </p>
            </div>
            <Switch checked={isOpen} onCheckedChange={setIsOpen} />
          </div>
          <div>
            <Label>Closed message</Label>
            <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Maximum party size</Label>
            <p className="text-xs text-muted-foreground">Largest group customers can request when booking a table.</p>
            <Input
              type="number"
              min={1}
              max={100}
              value={maxParty}
              onChange={(e) => setMaxParty(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-32"
            />
          </div>
          <div>
            <Label>Featured dishes limit</Label>
            <p className="text-xs text-muted-foreground">Maximum number of featured dishes shown on the home page.</p>
            <Input
              type="number"
              min={1}
              max={50}
              value={featuredLimit}
              onChange={(e) => setFeaturedLimit(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 w-32"
            />
          </div>
          <Button onClick={save}>Save changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}