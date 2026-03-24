import { useState, useCallback, useRef, useEffect } from "react";
import { useAutoSniper } from "./useAutoSniper";
import { useTokenPrices } from "./useTokenPrices";
import { recordOutcome, recalculateWeights } from "@/lib/adaptiveWeights";
import { SimulatedTrade, SimConfig, DEFAULT_SIM_CONFIG, createTrade, updateTradePrice, checkExitConditions, exitTrade, canEnterTrade } from "@/lib/sniperSimulation";
import { SniperConfig, DEFAULT_SNIPER_CONFIG } from "@/lib/sniperEngine";

export function useSniperMode() {
  const [enabled, setEnabled] = useState(false);
  const [sniperConfig] = useState<SniperConfig>({ ...DEFAULT_SNIPER_CONFIG });
  const [simConfig, setSimConfig] = useState<SimConfig>({ ...DEFAULT_SIM_CONFIG });
  const [trades, setTrades] = useState<SimulatedTrade[]>([]);
  const cooldowns = useRef<Record<string, number>>({});

  const { previews, readyCount, blockedCount, isLoading } = useAutoSniper(sniperConfig);

  const activeAddresses = trades.filter((t) => t.status === "ENTERED").map((t) => t.token.address);
  const { data: priceData } = useTokenPrices(activeAddresses);

  useEffect(() => {
    if (!enabled) return;
    const readyPreviews = previews.filter((p) => p.status === "READY");
    for (const preview of readyPreviews) {
      const { allowed } = canEnterTrade(preview.token.address, trades, cooldowns.current, simConfig);
      if (allowed) {
        const trade = createTrade(preview.token, preview.reasons);
        setTrades((prev) => {
          if (prev.some((t) => t.token.address === preview.token.address && t.status === "ENTERED")) return prev;
          return [...prev, trade];
        });
      }
    }
  }, [enabled, previews, simConfig, trades]);

  useEffect(() => {
    if (!priceData) return;
    setTrades((prev) => prev.map((trade) => {
      if (trade.status === "EXITED") return trade;
      const priceInfo = priceData[trade.token.address];
      if (!priceInfo) return trade;
      let updated = updateTradePrice(trade, priceInfo.price);
      const exitReason = checkExitConditions(updated, simConfig);
      if (exitReason) {
        updated = exitTrade(updated, exitReason);
        cooldowns.current[trade.token.address] = Date.now();
        recordOutcome({ tokenAddress: trade.token.address, pnlPercent: updated.pnlPercent, factors: trade.reasons || [], timestamp: Date.now() });
        recalculateWeights();
      }
      return updated;
    }));
  }, [priceData, simConfig]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  const manualExit = useCallback((tradeId: string) => {
    setTrades((prev) => prev.map((t) => { if (t.id !== tradeId || t.status === "EXITED") return t; cooldowns.current[t.token.address] = Date.now(); return exitTrade(t, "manual"); }));
  }, []);
  const clearHistory = useCallback(() => { setTrades((prev) => prev.filter((t) => t.status === "ENTERED")); }, []);

  const activeTrades = trades.filter((t) => t.status === "ENTERED");
  const exitedTrades = trades.filter((t) => t.status === "EXITED");
  const totalPnl = exitedTrades.reduce((sum, t) => sum + t.pnlPercent, 0);
  const winCount = exitedTrades.filter((t) => t.pnlPercent > 0).length;
  const winRate = exitedTrades.length > 0 ? (winCount / exitedTrades.length) * 100 : 0;

  return { enabled, toggle, simConfig, setSimConfig, activeTrades, exitedTrades, manualExit, clearHistory, totalPnl, winRate, readyCount, blockedCount, isLoading };
}