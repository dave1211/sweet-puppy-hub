import { ShoppingBag, Tag, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMerchProducts } from "@/hooks/useMerchProducts";
import { toast } from "sonner";
import { useState } from "react";

// Static image imports
import tshirtTerminal from "@/assets/merch/tshirt-terminal.png";
import hoodieBlack from "@/assets/merch/hoodie-black.png";
import hoodieNavy from "@/assets/merch/hoodie-navy.png";
import hoodieGreen from "@/assets/merch/hoodie-green.png";
import capBlack from "@/assets/merch/cap-black.png";
import glovesTech from "@/assets/merch/gloves-tech.png";
import cupQuote1 from "@/assets/merch/cup-quote1.png";
import cupQuote2 from "@/assets/merch/cup-quote2.png";
import tracksuitPants from "@/assets/merch/tracksuit-pants.png";
import dogLead from "@/assets/merch/dog-lead.png";
import dogHarness from "@/assets/merch/dog-harness.png";
import dogBowl from "@/assets/merch/dog-bowl.png";
import dogSocks from "@/assets/merch/dog-socks.png";
import dogCollar from "@/assets/merch/dog-collar.png";
import stickerPack from "@/assets/merch/sticker-pack.png";

const IMAGE_MAP: Record<string, string> = {
  "/merch/tshirt-terminal.png": tshirtTerminal,
  "/merch/hoodie-black.png": hoodieBlack,
  "/merch/hoodie-navy.png": hoodieNavy,
  "/merch/hoodie-green.png": hoodieGreen,
  "/merch/cap-black.png": capBlack,
  "/merch/gloves-tech.png": glovesTech,
  "/merch/cup-quote1.png": cupQuote1,
  "/merch/cup-quote2.png": cupQuote2,
  "/merch/tracksuit-pants.png": tracksuitPants,
  "/merch/dog-lead.png": dogLead,
  "/merch/dog-harness.png": dogHarness,
  "/merch/dog-bowl.png": dogBowl,
  "/merch/dog-socks.png": dogSocks,
  "/merch/dog-collar.png": dogCollar,
  "/merch/sticker-pack.png": stickerPack,
};

const CATEGORY_ICONS: Record<string, string> = {
  apparel: "👕",
  accessories: "🎒",
  pets: "🐕",
};

const CATEGORIES = ["all", "apparel", "accessories", "pets"] as const;

export default function MerchStore() {
  const { data: products, isLoading } = useMerchProducts();
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? products : products?.filter((p) => p.category === filter);

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

      {/* Category filter */}
      <div className="flex justify-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold border transition-colors ${
              filter === cat
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {cat === "all" ? "ALL" : `${CATEGORY_ICONS[cat] || ""} ${cat.toUpperCase()}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !filtered || filtered.length === 0 ? (
        <p className="text-center text-sm font-mono text-muted-foreground py-12">No products yet…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => {
            const imgSrc = product.image_url ? IMAGE_MAP[product.image_url] : null;
            return (
              <Card key={product.id} className="border-border bg-card hover:border-primary/30 transition-colors group overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="w-full h-44 rounded-md bg-muted/60 border border-border flex items-center justify-center mb-3 overflow-hidden">
                    {imgSrc ? (
                      <img src={imgSrc} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">{CATEGORY_ICONS[product.category] || "📦"}</span>
                    )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
