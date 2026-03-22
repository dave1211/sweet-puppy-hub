import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShopifyProductByHandle } from "@/hooks/useShopifyProducts";
import { useCartStore } from "@/stores/cartStore";
import { useMemo, useState } from "react";

export default function MerchProduct() {
  const { handle } = useParams();
  const { data: product, isLoading } = useShopifyProductByHandle(handle);
  const addItem = useCartStore((state) => state.addItem);
  const isCartLoading = useCartStore((state) => state.isLoading);

  const variants = product?.variants.edges || [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    if (!product) return null;
    if (selectedVariantId) {
      return variants.find((entry) => entry.node.id === selectedVariantId)?.node || null;
    }
    return variants[0]?.node || null;
  }, [product, selectedVariantId, variants]);

  if (isLoading) {
    return <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!product) {
    return <p className="py-16 text-center text-muted-foreground font-mono">Product not found.</p>;
  }

  const hero = product.images.edges[0]?.node;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link to="/merch" className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to merch
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          {hero ? <img src={hero.url} alt={hero.altText || product.title} className="w-full aspect-square object-cover" /> : null}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-mono font-bold text-foreground">{product.title}</h1>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description || "Premium Tanner merch."}</p>
          <p className="text-xl font-mono font-black text-primary">
            {selectedVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode}{" "}
            {Number(selectedVariant?.price.amount || product.priceRange.minVariantPrice.amount).toFixed(2)}
          </p>

          {variants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-mono text-muted-foreground">Variants</p>
              <div className="flex gap-2 flex-wrap">
                {variants.map((entry) => (
                  <button
                    key={entry.node.id}
                    onClick={() => setSelectedVariantId(entry.node.id)}
                    className={`px-3 py-1.5 rounded-md border text-xs font-mono ${
                      (selectedVariantId || variants[0]?.node.id) === entry.node.id
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {entry.node.title}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <Button
            onClick={async () => {
              if (!selectedVariant) return;
              await addItem({
                product,
                variantId: selectedVariant.id,
                variantTitle: selectedVariant.title,
                price: selectedVariant.price,
                quantity: 1,
                selectedOptions: selectedVariant.selectedOptions || [],
              });
            }}
            disabled={!selectedVariant || isCartLoading}
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
