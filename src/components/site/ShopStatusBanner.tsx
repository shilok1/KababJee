import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

export default function ShopStatusBanner() {
  const { data } = useQuery({
    queryKey: ["shop-settings-public"],
    queryFn: async () => {
      const { data } = await supabase.from("shop_settings").select("is_open,closed_message").limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 30_000,
  });
  if (!data || data.is_open) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground">
      <AlertCircle className="h-4 w-4" />
      {data.closed_message || "We are currently closed."}
    </div>
  );
}