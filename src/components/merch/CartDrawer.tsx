import { useEffect, useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCartStore } from "@/stores/cartStore";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { items, isLoading, isSyncing, updateQuantity, removeItem, getCheckoutUrl, syncCart } = useCartStore();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const currency = items[0]?.price.currencyCode || "USD";
  const totalPrice = items.reduce((sum, item) => sum + Number(item.price.amount) * item.quantity, 0);

  useEffect(() => {
    if (isOpen) {
      syncCart();
    }
  }, [isOpen, syncCart]);

  const checkout = () => {
    const checkoutUrl = getCheckoutUrl();
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 ? (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
              {totalItems}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Cart</SheetTitle>
          <SheetDescription>
            {totalItems > 0 ? `${totalItems} item${totalItems > 1 ? "s" : ""}` : "Your cart is empty"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col flex-1 min-h-0 pt-4">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div className="space-y-2">
                <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Add products to start checkout.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {items.map((item) => {
                  const image = item.product.images.edges[0]?.node;

                  return (
                    <div key={item.variantId} className="flex gap-3 p-2 rounded-lg border border-border bg-card">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-muted/40 shrink-0">
                        {image ? <img src={image.url} alt={image.altText || item.product.title} className="w-full h-full object-cover" /> : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-mono font-bold truncate">{item.product.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.selectedOptions.map((option) => option.value).join(" • ") || item.variantTitle}
                        </p>
                        <p className="text-xs font-mono pt-1">
                          {currency} {Number(item.price.amount).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeItem(item.variantId)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-mono w-6 text-center">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.variantId, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-border space-y-3">
                <div className="flex justify-between text-sm font-mono">
                  <span>Total</span>
                  <span className="font-bold text-primary">
                    {currency} {totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button className="w-full" onClick={checkout} disabled={isLoading || isSyncing || items.length === 0}>
                  {isLoading || isSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Checkout with Shopify
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
