import { useEffect, useRef } from "react";
import { useAlerts } from "./useAlerts";
import { toast } from "sonner";

interface TokenPriceMap { [address: string]: { price: number; change24h: number }; }

export function useAlertPoller(tokenPrices: TokenPriceMap) {
  const { alerts } = useAlerts();
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!alerts.length || !Object.keys(tokenPrices).length) return;
    const enabledAlerts = alerts.filter((a) => a.enabled);
    for (const alert of enabledAlerts) {
      const priceData = tokenPrices[alert.address];
      if (!priceData) continue;
      const price = priceData.price;
      const triggered = (alert.direction === "above" && price >= alert.threshold) || (alert.direction === "below" && price <= alert.threshold);
      if (triggered && !triggeredRef.current.has(alert.id)) {
        triggeredRef.current.add(alert.id);
        const label = `${alert.kind.toUpperCase()} ${alert.direction} ${alert.threshold}`;
        toast.warning(`🔔 Alert triggered: ${label}`, { description: `${alert.address.slice(0, 8)}... price is $${price.toFixed(6)}`, duration: 10000 });
      } else if (!triggered) { triggeredRef.current.delete(alert.id); }
    }
  }, [alerts, tokenPrices]);
}