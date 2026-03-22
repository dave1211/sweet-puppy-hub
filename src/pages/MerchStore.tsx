import { ShoppingBag, Tag, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMerchProducts } from "@/hooks/useMerchProducts";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, string> = {
  apparel: "👕",
  accessories: "🎒",
};

export default function MerchStore() {
  const { data: products, isLoading } = useMerchProducts();

  const handleBuy = (name: string) => {
    toast.info(`Checkout for "${name}" coming soon — Stripe integration pending`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground">
          <ShoppingBag className="inline h-7 w-7 text-terminal-cyan mr-2" />
          Merch <span className="text-primary">Store</span>
        </h1>
        <p className="text-sm font-mono text-muted-foreground">Rep the terminal. Look like alpha.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !products || products.length === 0 ? (
        <p className="text-center text-sm font-mono text-muted-foreground py-12">No products yet…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="border-border bg-card hover:border-primary/30 transition-colors group">
              <CardHeader className="pb-2">
                <div className="w-full h-36 rounded-md bg-muted/60 border border-border flex items-center justify-center mb-3">
                  <span className="text-4xl">{CATEGORY_ICONS[product.category] || "📦"}</span>
                </div>
                <CardTitle className="text-sm font-mono flex items-center justify-between">
                  <span>{product.name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{product.category}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[11px] font-mono text-muted-foreground mb-3">{product.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3 text-primary" />
                    <span className="text-lg font-mono font-black text-foreground">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => handleBuy(product.name)}
                    className="px-4 py-1.5 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-bold hover:bg-primary/20 transition-colors border border-primary/30"
                  >
                    BUY NOW
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
