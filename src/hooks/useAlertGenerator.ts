/**
 * Unified alert generator — ties watchlist, wallets, risk, launches into signal engine.
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
import { assessRug } from "@/hooks/useRugDetection";

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

  // ─── Risk/rug alerts for watchlist tokens ───
  useEffect(() => {
    if (!prices) return;
    for (const item of watchlistItems) {
      const priceData = prices[item.address];
      if (!priceData) continue;

      const assessment = assessRug({
        liquidity: priceData.change24h * 100, // rough proxy
        volume24h: Math.abs(priceData.change24h) * 1000,
        change24h: priceData.change24h,
      });

      if (assessment.level === "high") {
        const label = item.label || `${item.address.slice(0, 6)}…`;
        emit({
          category: "risk",
          severity: "critical",
          source: "risk_engine",
          title: `⚠ HIGH RISK: ${label}`,
          message: `${assessment.flags.map(f => f.label).join(", ")}`,
          detail: `Token ${label} has ${assessment.flags.length} risk flags: ${assessment.flags.map(f => f.label).join(", ")}. Consider removing from watchlist or reducing exposure.`,
          address: item.address,
          asset: item.label || undefined,
          dedupeKey: `risk-${item.address}-high`,
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

      const rugCheck = assessRug({
        liquidity: token.liquidity,
        volume24h: token.volume24h,
        change24h: token.change24h,
        pairCreatedAt: token.pairCreatedAt,
      });

      emit({
        category: "launch",
        severity: rugCheck.level === "high" ? "warning" : "info",
        source: "launch_scanner",
        title: `🚀 New: ${token.symbol}`,
        message: `$${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)} on ${token.dexId}${rugCheck.level === "high" ? " ⚠ HIGH RISK" : ""}`,
        detail: `New token launch detected: ${token.name} (${token.symbol}) at $${token.price.toFixed(8)} on ${token.dexId}. Volume: $${token.volume24h.toFixed(0)}. Liquidity: $${token.liquidity.toFixed(0)}.${rugCheck.flags.length > 0 ? ` Risk flags: ${rugCheck.flags.map(f => f.label).join(", ")}.` : ""}`,
        address: token.address,
        asset: token.symbol,
        dedupeKey: `launch-${token.address}`,
      });
    }
  }, [launches, emit]);
}
