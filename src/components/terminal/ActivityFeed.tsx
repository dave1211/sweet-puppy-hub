import { useEffect, useRef, useState } from "react";
import { Activity, TrendingUp, TrendingDown, Bell, Eye, Wallet, Zap, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useAlerts } from "@/hooks/useAlerts";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { useWalletActivity } from "@/hooks/useWalletActivity";
import { useTokenSignals } from "@/hooks/useTokenSignals";
import { useNewLaunches } from "@/hooks/useNewLaunches";

interface FeedEvent {
  id: string;
  type: "price_move" | "alert_triggered" | "watchlist_add" | "wallet_tx" | "signal" | "new_launch";
  message: string;
  timestamp: Date;
  positive?: boolean;
}

export function ActivityFeed() {
  const { items } = useWatchlist();
  const { alerts } = useAlerts();
  const { wallets } = useTrackedWallets();
  const addresses = items.map((i) => i.address);
  const { data: prices } = useTokenPrices(addresses);
  const signals = useTokenSignals(prices);
  const { data: launches } = useNewLaunches();
  const prevPricesRef = useRef<Record<string, number>>({});
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const prevItemCountRef = useRef(items.length);
  const seenSignalsRef = useRef<Set<string>>(new Set());
  const seenTxRef = useRef<Set<string>>(new Set());
  const seenLaunchesRef = useRef<Set<string>>(new Set());

  const firstWalletAddr = wallets.length > 0 ? wallets[0].address : null;
  const { data: walletTxs } = useWalletActivity(firstWalletAddr);

  useEffect(() => {
    if (!prices || Object.keys(prices).length === 0) return;
    const prev = prevPricesRef.current;
    const newEvents: FeedEvent[] = [];
    for (const [addr, data] of Object.entries(prices)) {
      const prevPrice = prev[addr];
      if (prevPrice === undefined) { prev[addr] = data.price; continue; }
      const pctChange = prevPrice > 0 ? ((data.price - prevPrice) / prevPrice) * 100 : 0;
      if (Math.abs(pctChange) >= 0.5) {
        const item = items.find((i) => i.address === addr);
        const label = item?.label || `${addr.slice(0, 6)}…`;
        newEvents.push({
          id: `price-${addr}-${Date.now()}`,
          type: "price_move",
          message: `${label} ${pctChange > 0 ? "↑" : "↓"} ${Math.abs(pctChange).toFixed(1)}% → $${data.price < 0.01 ? data.price.toFixed(6) : data.price.toFixed(2)}`,
          timestamp: new Date(),
          positive: pctChange > 0,
        });
      }
      prev[addr] = data.price;
    }
    if (newEvents.length > 0) setEvents((e) => [...newEvents, ...e].slice(0, 40));
  }, [prices, items]);

  useEffect(() => {
    if (items.length > prevItemCountRef.current) {
      const newest = items[0];
      if (newest) {
        const ev: FeedEvent = { id: `watch-${newest.id}-${Date.now()}`, type: "watchlist_add", message: `Added ${newest.label || newest.address.slice(0, 8)} to watchlist`, timestamp: new Date() };
        setEvents((e) => [ev, ...e].slice(0, 40));
      }
    }
    prevItemCountRef.current = items.length;
  }, [items]);

  useEffect(() => {
    if (!prices) return;
    for (const alert of alerts.filter((a) => a.enabled)) {
      const p = prices[alert.address];
      if (!p) continue;
      const triggered = (alert.direction === "above" && p.price >= alert.threshold) || (alert.direction === "below" && p.price <= alert.threshold);
      if (triggered) {
        const item = items.find((i) => i.address === alert.address);
        const label = item?.label || `${alert.address.slice(0, 6)}…`;
        const ev: FeedEvent = { id: `alert-${alert.id}`, type: "alert_triggered", message: `🔔 ${label} ${alert.direction} $${alert.threshold}`, timestamp: new Date() };
        setEvents((prev) => { if (prev.some((e) => e.id === ev.id)) return prev; return [ev, ...prev].slice(0, 40); });
      }
    }
  }, [alerts, prices, items]);

  useEffect(() => {
    for (const [addr, sig] of Object.entries(signals)) {
      const key = `${addr}-${sig.signal}`;
      if (seenSignalsRef.current.has(key)) continue;
      seenSignalsRef.current.add(key);
      const item = items.find((i) => i.address === addr);
      const lbl = item?.label || `${addr.slice(0, 6)}…`;
      const ev: FeedEvent = { id: `signal-${key}-${Date.now()}`, type: "signal", message: `${sig.label} on ${lbl}`, timestamp: new Date(), positive: sig.signal === "momentum" || sig.signal === "early" };
      setEvents((e) => [ev, ...e].slice(0, 40));
    }
  }, [signals, items]);

  useEffect(() => {
    if (!walletTxs || walletTxs.length === 0) return;
    const walletLabel = wallets[0]?.label || `${wallets[0]?.address.slice(0, 4)}…`;
    const newEvents: FeedEvent[] = [];
    for (const tx of walletTxs.slice(0, 3)) {
      if (seenTxRef.current.has(tx.signature)) continue;
      seenTxRef.current.add(tx.signature);
      newEvents.push({ id: `tx-${tx.signature}`, type: "wallet_tx", message: `${walletLabel}: ${tx.err ? "failed" : "confirmed"} tx ${tx.signature.slice(0, 8)}…`, timestamp: tx.blockTime ? new Date(tx.blockTime * 1000) : new Date(), positive: !tx.err });
    }
    if (newEvents.length > 0) setEvents((e) => [...newEvents, ...e].slice(0, 40));
  }, [walletTxs, wallets]);

  useEffect(() => {
    if (!launches || launches.length === 0) return;
    const newEvents: FeedEvent[] = [];
    for (const token of launches.slice(0, 3)) {
      if (seenLaunchesRef.current.has(token.address)) continue;
      seenLaunchesRef.current.add(token.address);
      newEvents.push({ id: `launch-${token.address}`, type: "new_launch", message: `New: ${token.symbol} ($${token.price < 0.01 ? token.price.toFixed(6) : token.price.toFixed(4)}) on ${token.dexId}`, timestamp: new Date(token.pairCreatedAt), positive: token.change24h > 0 });
    }
    if (newEvents.length > 0) setEvents((e) => [...newEvents, ...e].slice(0, 40));
  }, [launches]);

  const getIcon = (type: FeedEvent["type"], positive?: boolean) => {
    switch (type) {
      case "price_move": return positive ? <TrendingUp className="h-3 w-3 text-terminal-green" /> : <TrendingDown className="h-3 w-3 text-terminal-red" />;
      case "alert_triggered": return <Bell className="h-3 w-3 text-terminal-amber" />;
      case "watchlist_add": return <Eye className="h-3 w-3 text-primary" />;
      case "wallet_tx": return <Wallet className="h-3 w-3 text-terminal-blue" />;
      case "signal": return <Zap className="h-3 w-3 text-terminal-cyan" />;
      case "new_launch": return <Rocket className="h-3 w-3 text-terminal-amber" />;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Activity className="h-4 w-4 text-terminal-cyan" />
          INTEL FEED
          {events.length > 0 && (
            <span className="text-[9px] bg-terminal-cyan/15 text-terminal-cyan px-1.5 py-0.5 rounded font-mono">{events.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-[10px] text-muted-foreground font-mono text-center py-4">Scanning… signals and events will appear here</p>
        ) : (
          <div className="space-y-0.5 max-h-[240px] overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors">
                <div className="mt-0.5 shrink-0">{getIcon(event.type, event.positive)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-foreground/90 leading-relaxed">{event.message}</p>
                  <p className="text-[9px] font-mono text-muted-foreground/60">{event.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}