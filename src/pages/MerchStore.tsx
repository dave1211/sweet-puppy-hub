import { Loader2, Plus, Minus, Tag, Star, Truck, Shield, RotateCcw, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/components/merch/CartDrawer";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";
import { useCartStore } from "@/stores/cartStore";
import tannerLogo from "@/assets/tanner-logo.png";

const DEFAULT_FILTER = "all";

export default function MerchStore() {
  const { data: products, isLoading } = useShopifyProducts();
  const [filter, setFilter] = useState(DEFAULT_FILTER);
  const [selectedVariantByProduct, setSelectedVariantByProduct] = useState<Record<string, string>>({});

  const { items, addItem, updateQuantity, isLoading: cartLoading } = useCartStore();

  const categories = useMemo(() => {
    const unique = Array.from(new Set((products || []).map((entry) => (entry.node.productType || "Other").toLowerCase())));
    return [DEFAULT_FILTER, ...unique];
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (filter === DEFAULT_FILTER) return products;
    return products.filter((entry) => (entry.node.productType || "Other").toLowerCase() === filter);
  }, [products, filter]);

  const getVariantQty = (variantId: string) => items.find((item) => item.variantId === variantId)?.quantity || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20 sm:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground inline-flex items-center gap-2">
            <img src={tannerLogo} alt="Tanner logo" className="h-7 w-7 rounded-sm object-cover" loading="lazy" />
            Tanner <span className="text-primary">Merch</span>
          </h1>
          <p className="text-sm font-mono text-muted-foreground">Live products from your connected Shopify catalog.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to="/merch/admin">
              <Settings className="h-4 w-4 mr-2" /> Admin
            </Link>
          </Button>
          <CartDrawer />
        </div>
      </div>

      <div className="flex justify-center gap-6 flex-wrap text-[10px] font-mono text-muted-foreground">
        <span className="flex items-center gap-1"><Truck className="h-3 w-3 text-primary" /> Free shipping $50+</span>
        <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> Secure checkout</span>
        <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3 text-primary" /> 30-day returns</span>
        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-terminal-amber" /> 4.9/5 rated</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setFilter(category)}
            className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold border transition-colors ${
              filter === category
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-muted/50 text-muted-foreground border-border hover:border-primary/30"
            }`}
          >
            {category === DEFAULT_FILTER ? "ALL" : category.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm font-mono text-muted-foreground py-16">No products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((product) => {
            const hero = product.node.images.edges[0]?.node;
            const variants = product.node.variants.edges;
            const selectedVariantId = selectedVariantByProduct[product.node.id] || variants[0]?.node.id;
            const selectedVariant = variants.find((entry) => entry.node.id === selectedVariantId)?.node || variants[0]?.node;
            const qty = selectedVariant ? getVariantQty(selectedVariant.id) : 0;

            return (
              <Card key={product.node.id} className="border-border bg-card hover:border-primary/30 transition-all group overflow-hidden hover:shadow-lg hover:shadow-primary/5">
                <Link to={`/merch/${product.node.handle}`} className="block w-full aspect-square bg-muted/40 overflow-hidden relative">
                  {hero ? (
                    <img src={hero.url} alt={hero.altText || product.node.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  ) : null}
                </Link>

                <CardContent className="p-4 space-y-3">
                  <div>
                    <Link to={`/merch/${product.node.handle}`} className="text-sm font-mono font-bold text-foreground leading-tight hover:text-primary transition-colors line-clamp-2">
                      {product.node.title}
                    </Link>
                    <p className="text-[11px] font-mono text-muted-foreground mt-1 line-clamp-2">
                      {product.node.description || "Premium Tanner merch."}
                    </p>
                  </div>

                  {variants.length > 1 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono text-muted-foreground">Variant:</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {variants.map((entry) => (
                          <button
                            key={entry.node.id}
                            onClick={() => setSelectedVariantByProduct((prev) => ({ ...prev, [product.node.id]: entry.node.id }))}
                            className={`px-2.5 h-8 rounded text-[10px] font-mono font-bold border transition-all ${
                              selectedVariantId === entry.node.id
                                ? "bg-primary/20 text-primary border-primary/50 ring-1 ring-primary/30"
                                : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                            }`}
                          >
                            {entry.node.selectedOptions.map((option) => option.value).join("/") || entry.node.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3 text-primary" />
                      <span className="text-lg font-mono font-black text-foreground">
                        {selectedVariant?.price.currencyCode || product.node.priceRange.minVariantPrice.currencyCode} {Number(selectedVariant?.price.amount || product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                      </span>
                    </div>

                    {qty > 0 && selectedVariant ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateQuantity(selectedVariant.id, qty - 1)} className="w-8 h-8 rounded-md bg-muted/50 text-muted-foreground hover:bg-destructive/20 hover:text-destructive border border-border flex items-center justify-center transition-colors">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-mono font-bold text-foreground">{qty}</span>
                        <button onClick={() => updateQuantity(selectedVariant.id, qty + 1)} className="w-8 h-8 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 flex items-center justify-center transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!selectedVariant) return;
                          await addItem({
                            product: product.node,
                            variantId: selectedVariant.id,
                            variantTitle: selectedVariant.title,
                            price: selectedVariant.price,
                            quantity: 1,
                            selectedOptions: selectedVariant.selectedOptions || [],
                          });
                        }}
                        disabled={!selectedVariant || !selectedVariant.availableForSale || cartLoading}
                        className="px-4 py-2 rounded-md bg-primary/10 text-primary text-[11px] font-mono font-bold hover:bg-primary/20 active:scale-95 transition-all border border-primary/30 disabled:opacity-40"
                      >
                        {selectedVariant?.availableForSale ? "ADD TO CART" : "OUT OF STOCK"}
                      </button>
                    )}
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
