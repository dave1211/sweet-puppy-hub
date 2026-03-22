import { useEffect } from "react";
import { useCartStore } from "@/stores/cartStore";

export function useCartSync() {
  const syncCart = useCartStore((state) => state.syncCart);

  useEffect(() => {
    syncCart();

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        syncCart();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [syncCart]);
}
