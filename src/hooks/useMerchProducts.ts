import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MerchProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  in_stock: boolean;
  created_at: string;
}

export function useMerchProducts() {
  return useQuery({
    queryKey: ["merch-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("merch_products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as MerchProduct[];
    },
  });
}
