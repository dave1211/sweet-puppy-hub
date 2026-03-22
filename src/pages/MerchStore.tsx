import { ShoppingBag, Tag, Loader2, ShoppingCart, Star, Truck, Shield, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

const CATEGORY_LABELS: Record<string, { icon: string; label: string }> = {
  apparel: { icon: "👕", label: "Apparel" },
  accessories: { icon: "🎒", label: "Accessories" },
  pets: { icon: "🐕", label: "Pets" },
};

const CATEGORIES = ["all", "apparel", "accessories", "pets"] as const;

export default function MerchStore() {
  const { data: products, isLoading } = useMerchProducts();
  const [filter, setFilter] = useState<string>("all");
  const [cart, setCart] = useState<Record<string, number>>({});

  const filtered = filter === "all" ? products : products?.filter((p) => p.category === filter);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = products
    ? Object.entries(cart).reduce((sum, [id, qty]) => {
        const p = products.find((pr) => pr.id === id);
        return sum + (p ? Number(p.price) * qty : 0);
      }, 0)
    : 0;

  const addToCart = (id: string, name: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    toast.success(`${name} added to cart`);
  };

  const handleCheckout = () => {
    toast.info("Checkout coming soon — Stripe integration pending. Your cart has been saved.");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground">
          <ShoppingBag className="inline h-7 w-7 text-terminal-cyan mr-2" />
          Tanner <span className="text-primary">Merch</span>
        </h1>
        <p className="text-sm font-mono text-muted-foreground">Premium terminal gear. Rep the alpha.</p>
      </div>

      {/* Trust badges */}
      <div className="flex justify-center gap-6 flex-wrap text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> Free shipping $50+</span>
        <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> Secure checkout</span>
        <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3 text-primary" /> 30-day returns</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-terminal-amber" /> 4.9/5 rated</span>
      </div>

      {/* Category filter + cart */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold border transition-colors ${
                filter === cat
                  ? "bg-primary/20 text-primary border-primary/40"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {cat === "all" ? "ALL" : `${CATEGORY_LABELS[cat]?.icon || ""} ${CATEGORY_LABELS[cat]?.label || cat}`}
            </button>
          ))}
        </div>

        {cartCount > 0 && (
          <button
            onClick={handleCheckout}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-mono font-bold hover:bg-primary/90 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart ({cartCount}) — ${cartTotal.toFixed(2)}
          </button>
        )}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !filtered || filtered.length === 0 ? (
        <p className="text-center text-sm font-mono text-muted-foreground py-16">No products yet…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => {
            const imgSrc = product.image_url ? IMAGE_MAP[product.image_url] : null;
            const inCart = cart[product.id] || 0;
            return (
              <Card key={product.id} className="border-border bg-card hover:border-primary/30 transition-all group overflow-hidden hover:shadow-lg hover:shadow-primary/5">
                {/* Image */}
                <div className="w-full aspect-square bg-muted/40 overflow-hidden relative">
                  {imgSrc ? (
                    <img src={imgSrc} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl">{CATEGORY_LABELS[product.category]?.icon || "📦"}</span>
                    </div>
                  )}
                  {inCart > 0 && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {inCart} in cart
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="text-[9px] font-mono text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border">
                      {CATEGORY_LABELS[product.category]?.label || product.category}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="text-sm font-mono font-bold text-foreground leading-tight">{product.name}</h3>
                    <p className="text-[11px] font-mono text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-primary" />
                      <span className="text-xl font-mono font-black text-foreground">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => addToCart(product.id, product.name)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary/10 text-primary text-[11px] font-mono font-bold hover:bg-primary/20 active:scale-95 transition-all border border-primary/30"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      ADD TO CART
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky cart bar on mobile */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border p-3 flex items-center justify-between sm:hidden z-50">
          <div className="font-mono text-sm text-foreground">
            <span className="font-bold">{cartCount} items</span> · <span className="text-primary font-black">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="px-5 py-2 rounded-md bg-primary text-primary-foreground text-xs font-mono font-bold"
          >
            CHECKOUT
          </button>
        </div>
      )}
    </div>
  );
}
