import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTrackedWallets } from "./useTrackedWallets";
import { useWalletActivity, WalletTransaction } from "./useWalletActivity";
import { useTokenPrices } from "./useTokenPrices";
import { recordOutcome, recalculateWeights } from "@/lib/adaptiveWeights";
import { SimulatedTrade, SimConfig, DEFAULT_SIM_CONFIG, updateTradePrice, checkExitConditions, exitTrade } from "@/lib/sniperSimulation";

export interface CopyTrade extends SimulatedTrade { sourceWallet: string; sourceLabel: string | null; tradeType: "COPY TRADE"; confidence: number; }

interface WalletToggle { address: string; label: string | null; enabled: boolean; }

const COOLDOWN_MS = 10 * 60 * 1000;
const MAX_COPY_TRADES = 5;
const FRESH_WINDOW_S = 300;

function computeConfidence(tokenAddress: string, allActivities: { data: WalletTransaction[] | undefined; wallet: string }[]): number {
  let score = 30; let walletsBuying = 0; let totalBuys = 0; let freshestAge = Infinity; const now = Date.now() / 1000;
  for (const { data } of allActivities) {
    if (!data) continue;
    const tokenTxs = data.filter((tx) => tx.tokenAddress === tokenAddress && tx.type === "buy");
    if (tokenTxs.length > 0) { walletsBuying++; totalBuys += tokenTxs.length; for (const tx of tokenTxs) { if (tx.blockTime) freshestAge = Math.min(freshestAge, now - tx.blockTime); } }
  }
  if (walletsBuying >= 3) score += 30; else if (walletsBuying >= 2) score += 20;
  if (totalBuys >= 4) score += 15; else if (totalBuys >= 2) score += 5;
  if (freshestAge < FRESH_WINDOW_S) score += 25; else if (freshestAge < 600) score += 10;
  return Math.min(score, 100);
}

export function useCopyTrading() {
  const { wallets } = useTrackedWallets();
  const [walletToggles, setWalletToggles] = useState<Record<string, boolean>>({});
  const [enabled, setEnabled] = useState(false);
  const [trades, setTrades] = useState<CopyTrade[]>([]);
  const [simConfig] = useState<SimConfig>({ ...DEFAULT_SIM_CONFIG, maxConcurrentTrades: MAX_COPY_TRADES });
  const cooldowns = useRef<Record<string, number>>({});
  const processedTxs = useRef<Set<string>>(new Set());

  const w0 = wallets[0]?.address ?? null; const w1 = wallets[1]?.address ?? null; const w2 = wallets[2]?.address ?? null; const w3 = wallets[3]?.address ?? null; const w4 = wallets[4]?.address ?? null;
  const a0 = useWalletActivity(w0); const a1 = useWalletActivity(w1); const a2 = useWalletActivity(w2); const a3 = useWalletActivity(w3); const a4 = useWalletActivity(w4);

  const allActivities = useMemo(() =>
    [{ data: a0.data, wallet: w0 ?? "" }, { data: a1.data, wallet: w1 ?? "" }, { data: a2.data, wallet: w2 ?? "" }, { data: a3.data, wallet: w3 ?? "" }, { data: a4.data, wallet: w4 ?? "" }].filter((a) => a.wallet),
    [a0.data, a1.data, a2.data, a3.data, a4.data, w0, w1, w2, w3, w4]
  );

  useEffect(() => { setWalletToggles((prev) => { const next = { ...prev }; for (const w of wallets) { if (!(w.address in next)) next[w.address] = true; } return next; }); }, [wallets]);

  const toggleWallet = useCallback((address: string) => { setWalletToggles((prev) => ({ ...prev, [address]: !prev[address] })); }, []);

  const walletList: WalletToggle[] = useMemo(() => wallets.map((w) => ({ address: w.address, label: w.label, enabled: walletToggles[w.address] ?? true })), [wallets, walletToggles]);

  const activeAddresses = trades.filter((t) => t.status === "ENTERED").map((t) => t.token.address);
  const { data: priceData } = useTokenPrices(activeAddresses);

  useEffect(() => {
    if (!enabled) return;
    const now = Date.now() / 1000;
    for (const { data, wallet } of allActivities) {
      if (!data || !walletToggles[wallet]) continue;
      for (const tx of data) {
        if (tx.type !== "buy" || !tx.tokenAddress || !tx.tokenSymbol) continue;
        if (processedTxs.current.has(tx.signature)) continue;
        if (tx.blockTime && now - tx.blockTime > FRESH_WINDOW_S) continue;
        const lastExit = cooldowns.current[tx.tokenAddress] ?? 0;
        if (Date.now() - lastExit < COOLDOWN_MS) continue;
        const openCount = trades.filter((t) => t.status === "ENTERED").length;
        if (openCount >= simConfig.maxConcurrentTrades) continue;
        if (trades.some((t) => t.token.address === tx.tokenAddress && t.status === "ENTERED")) continue;
        processedTxs.current.add(tx.signature);
        const walletInfo = wallets.find((w) => w.address === wallet);
        const confidence = computeConfidence(tx.tokenAddress, allActivities);
        const copyTrade: CopyTrade = {
          id: `copy-${tx.tokenAddress}-${Date.now()}`, token: { address: tx.tokenAddress, symbol: tx.tokenSymbol, name: tx.tokenSymbol, price: 0, change24h: 0, volume24h: 0, liquidity: 0, pairCreatedAt: 0, dexId: "", url: "", score: confidence, label: "LOW", walletCount: 0, walletTouches: 0, sniperType: null, whaleCount: 0, factors: [`Copied from ${walletInfo?.label || wallet.slice(0, 6)}…`] },
          status: "ENTERED", entryPrice: 0, currentPrice: 0, pnlPercent: 0, enteredAt: Date.now(), exitedAt: null, exitReason: null, reasons: [`BUY detected from ${walletInfo?.label || wallet.slice(0, 6)}…`],
          sourceWallet: wallet, sourceLabel: walletInfo?.label ?? null, tradeType: "COPY TRADE", confidence,
        };
        setTrades((prev) => [...prev, copyTrade]);
      }
    }
  }, [enabled, allActivities, walletToggles, simConfig.maxConcurrentTrades]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!priceData) return;
    setTrades((prev) => prev.map((trade) => {
      if (trade.status === "EXITED") return trade;
      const priceInfo = priceData[trade.token.address];
      if (!priceInfo) return trade;
      let updated = { ...trade };
      if (updated.entryPrice === 0) updated.entryPrice = priceInfo.price;
      updated = { ...updateTradePrice(updated, priceInfo.price), sourceWallet: trade.sourceWallet, sourceLabel: trade.sourceLabel, tradeType: trade.tradeType, confidence: trade.confidence } as CopyTrade;
      const exitReason = checkExitConditions(updated, simConfig);
      if (exitReason) {
        cooldowns.current[trade.token.address] = Date.now();
        const exited = { ...exitTrade(updated, exitReason), sourceWallet: trade.sourceWallet, sourceLabel: trade.sourceLabel, tradeType: trade.tradeType, confidence: trade.confidence } as CopyTrade;
        recordOutcome({ tokenAddress: trade.token.address, pnlPercent: exited.pnlPercent, factors: trade.reasons || [], timestamp: Date.now() });
        recalculateWeights();
        return exited;
      }
      return updated;
    }));
  }, [priceData, simConfig]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);
  const manualExit = useCallback((tradeId: string) => {
    setTrades((prev) => prev.map((t) => { if (t.id !== tradeId || t.status === "EXITED") return t; cooldowns.current[t.token.address] = Date.now(); return { ...exitTrade(t, "manual"), sourceWallet: t.sourceWallet, sourceLabel: t.sourceLabel, tradeType: t.tradeType, confidence: t.confidence } as CopyTrade; }));
  }, []);
  const clearHistory = useCallback(() => { setTrades((prev) => prev.filter((t) => t.status === "ENTERED")); }, []);

  const activeTrades = trades.filter((t) => t.status === "ENTERED");
  const exitedTrades = trades.filter((t) => t.status === "EXITED");
  const totalPnl = exitedTrades.reduce((sum, t) => sum + t.pnlPercent, 0);
  const winCount = exitedTrades.filter((t) => t.pnlPercent > 0).length;
  const winRate = exitedTrades.length > 0 ? (winCount / exitedTrades.length) * 100 : 0;

  return { enabled, toggle, walletList, toggleWallet, activeTrades, exitedTrades, manualExit, clearHistory, totalPnl, winRate, isLoading: a0.isLoading || a1.isLoading };
}