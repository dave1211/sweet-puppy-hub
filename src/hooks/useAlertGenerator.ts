/**
 * Unified alert generator — ties watchlist, wallets, risk, launches into signal engine.
 * Uses tokenSafetyService as single source of truth (not raw engines directly).
 * Runs as a hook inside the dashboard. Non-blocking, deduped, severity-based.
 */
import { useEffect, useRef } from "react";
import { useSignalStore } from "@/stores/signalEngine";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { useWalletActivity } from "@/hooks/useWalletActivity";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { useAlerts } from "@/hooks/useAlerts";
import { assessTokenSafety, CAUTION_LABELS } from "@/services/tokenSafetyService";

const PRICE_MOVE_THRESHOLD = 5; // 5% move triggers alert
const BIG_PRICE_MOVE = 15; // 15% triggers warning
const CRITICAL_PRICE_MOVE = 30; // 30% triggers critical

export function useAlertGenerator() {
  const emit = useSignalStore(s => s.emit);
  const { items: watchlistItems } = useWatchlist();
  const addresses = watchlistItems.map(i => i.address);
  const { data: prices } = useTokenPrices(addresses);
  const { alerts } = useAlerts();
  const { wallets } = useTrackedWallets();
  const { data: launches } = useNewLaunches();

  const prevPrices = useRef<Record<string, number>>({});
  const seenLaunches = useRef<Set<string>>(new Set());
  const seenTxs = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  // First tracked wallet activity
  const firstWalletAddr = wallets.length > 0 ? wallets[0].address : null;
  const { data: walletTxs } = useWalletActivity(firstWalletAddr);

  // ─── Price movement alerts ───
  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    if (initialLoad.current) {
      // Seed initial prices without alerting
      for (const [addr, data] of Object.entries(prices)) {
        prevPrices.current[addr] = data.price;
      }
      initialLoad.current = false;
      return;
    }

    for (const [addr, data] of Object.entries(prices)) {
      const prev = prevPrices.current[addr];
      if (prev === undefined) {
        prevPrices.current[addr] = data.price;
        continue;
      }

      const pctChange = prev > 0 ? ((data.price - prev) / prev) * 100 : 0;
      const absPct = Math.abs(pctChange);

      if (absPct >= PRICE_MOVE_THRESHOLD) {
        const item = watchlistItems.find(i => i.address === addr);
        const label = item?.label || `${addr.slice(0, 6)}…`;
        const direction = pctChange > 0 ? "↑" : "↓";
        const severity = absPct >= CRITICAL_PRICE_MOVE ? "critical" as const
          : absPct >= BIG_PRICE_MOVE ? "warning" as const
          : "info" as const;

        emit({
          category: "price",
          severity,
          source: "watchlist",
          title: `${label} ${direction} ${absPct.toFixed(1)}%`,
          message: `Price moved to $${data.price < 0.01 ? data.price.toFixed(8) : data.price.toFixed(4)}`,
          detail: `Previous: $${prev < 0.01 ? prev.toFixed(8) : prev.toFixed(4)} → Current: $${data.price < 0.01 ? data.price.toFixed(8) : data.price.toFixed(4)}. ${absPct.toFixed(1)}% change detected on your watchlist.`,
          address: addr,
          asset: item?.label || undefined,
          dedupeKey: `price-${addr}-${Math.floor(pctChange / 5)}`,
        });
      }
      prevPrices.current[addr] = data.price;
    }
  }, [prices, watchlistItems, emit]);

  // ─── Risk/safety alerts for watchlist tokens ───
  useEffect(() => {
    if (!prices) return;
    for (const item of watchlistItems) {
      const priceData = prices[item.address];
      if (!priceData) continue;

      const safety = assessTokenSafety({
        liquidity: 0, // Not available from price data — will flag as unknown
        volume24h: Math.abs(priceData.change24h) * 1000,
        change24h: priceData.change24h,
      });

      if (safety.cautionState === "critical_risk" || safety.cautionState === "high_risk") {
        const label = item.label || `${item.address.slice(0, 6)}…`;
        const criticalFlags = safety.flags.filter(f => f.severity === "critical");
        emit({
          category: "risk",
          severity: safety.cautionState === "critical_risk" ? "critical" : "warning",
          source: "safety_engine",
          title: `⚠ ${CAUTION_LABELS[safety.cautionState]}: ${label}`,
          message: criticalFlags.length > 0
            ? criticalFlags.map(f => f.message.split(":")[0]).join(", ")
            : `Safety score: ${safety.safetyScore}/100`,
          detail: `Token ${label} scored ${safety.safetyScore}/100 (${CAUTION_LABELS[safety.cautionState]}). ${safety.flags.length} flag(s): ${safety.flags.map(f => f.message.split(":")[0]).join(", ")}. Consider reducing exposure.`,
          address: item.address,
          asset: item.label || undefined,
          dedupeKey: `safety-${item.address}-${safety.cautionState}`,
        });
      }
    }
  }, [prices, watchlistItems, emit]);

  // ─── User-configured price threshold alerts ───
  useEffect(() => {
    if (!prices || !alerts.length) return;
    for (const alert of alerts.filter(a => a.enabled)) {
      const priceData = prices[alert.address];
      if (!priceData) continue;

      const triggered = (alert.direction === "above" && priceData.price >= alert.threshold) ||
                        (alert.direction === "below" && priceData.price <= alert.threshold);

      if (triggered) {
        emit({
          category: "price",
          severity: "warning",
          source: "dashboard",
          title: `🔔 Alert: ${alert.direction} $${alert.threshold}`,
          message: `Price is $${priceData.price < 0.01 ? priceData.price.toFixed(6) : priceData.price.toFixed(2)} (${alert.address.slice(0, 8)}…)`,
          detail: `Your configured alert triggered: price ${alert.direction} threshold of $${alert.threshold}. Current price: $${priceData.price < 0.01 ? priceData.price.toFixed(8) : priceData.price.toFixed(4)}.`,
          address: alert.address,
          dedupeKey: `threshold-${alert.id}`,
        });
      }
    }
  }, [prices, alerts, emit]);

  // ─── Wallet activity alerts ───
  useEffect(() => {
    if (!walletTxs || walletTxs.length === 0 || !firstWalletAddr) return;
    const walletLabel = wallets[0]?.label || `${firstWalletAddr.slice(0, 6)}…`;

    for (const tx of walletTxs.slice(0, 5)) {
      if (seenTxs.current.has(tx.signature)) continue;
      seenTxs.current.add(tx.signature);

      emit({
        category: "wallet_activity",
        severity: tx.err ? "warning" : "info",
        source: "wallet_tracker",
        title: tx.err ? `❌ Failed TX: ${walletLabel}` : `✅ TX Confirmed: ${walletLabel}`,
        message: `Signature: ${tx.signature.slice(0, 12)}…`,
        detail: `Transaction ${tx.signature} on tracked wallet ${walletLabel} (${firstWalletAddr}). Status: ${tx.err ? "FAILED" : "CONFIRMED"}.`,
        address: firstWalletAddr,
        dedupeKey: `tx-${tx.signature}`,
      });
    }
  }, [walletTxs, firstWalletAddr, wallets, emit]);

  // ─── New launch alerts ───
  useEffect(() => {
    if (!launches || launches.length === 0) return;

    for (const token of launches.slice(0, 3)) {
      if (seenLaunches.current.has(token.address)) continue;
      seenLaunches.current.add(token.address);

      const safety = assessTokenSafety({
        liquidity: token.liquidity,
        volume24h: token.volume24h,
        change24h: token.change24h,
        pairCreatedAt: token.pairCreatedAt,
      });

      emit({
        category: "launch",
        severity: safety.cautionState === "critical_risk" || safety.cautionState === "high_risk" ? "warning" : "info",
        source: "launch_scanner",
        title: `🚀 New: ${token.symbol}`,
        message: `$${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)} on ${token.dexId}${safety.cautionState !== "safer" ? ` ⚠ ${CAUTION_LABELS[safety.cautionState]}` : ""}`,
        detail: `New token launch detected: ${token.name} (${token.symbol}) at $${token.price.toFixed(8)} on ${token.dexId}. Volume: $${token.volume24h.toFixed(0)}. Liquidity: $${token.liquidity.toFixed(0)}. Safety: ${safety.safetyScore}/100.`,
        address: token.address,
        asset: token.symbol,
        dedupeKey: `launch-${token.address}`,
      });
    }
  }, [launches, emit]);
}
