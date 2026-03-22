import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SHOPIFY_ADMIN_URL } from "@/lib/shopify";
import { useShopifyProducts } from "@/hooks/useShopifyProducts";

const extractNumericId = (gid: string) => gid.split("/").pop() || "";

export default function MerchAdmin() {
  const { data: products, isLoading } = useShopifyProducts();

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-mono font-bold">Merch Admin</h1>
          <p className="text-xs text-muted-foreground font-mono">Manage your live catalog in Shopify admin.</p>
        </div>

        <Button asChild>
          <a href={SHOPIFY_ADMIN_URL} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" /> Open Shopify Admin
          </a>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !products?.length ? (
        <p className="text-sm font-mono text-muted-foreground py-16 text-center">No products found.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const image = product.node.images.edges[0]?.node;
            const productId = extractNumericId(product.node.id);
            return (
              <Card key={product.node.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="w-full aspect-square rounded-md bg-muted/40 overflow-hidden">
                    {image ? <img src={image.url} alt={image.altText || product.node.title} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div>
                    <h2 className="text-sm font-mono font-bold line-clamp-2">{product.node.title}</h2>
                    <p className="text-xs text-muted-foreground">{product.node.productType || "Uncategorized"}</p>
                    <p className="text-xs font-mono text-primary mt-1">
                      {product.node.priceRange.minVariantPrice.currencyCode} {Number(product.node.priceRange.minVariantPrice.amount).toFixed(2)}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={`${SHOPIFY_ADMIN_URL}/products/${productId}`} target="_blank" rel="noreferrer">
                      Manage Product
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
