import { useMemo } from "react";
import { useNewLaunches, useTrendingSignals, NewLaunchToken } from "./useNewLaunches";
import { useSmartMoney } from "./useSmartMoney";
import { useSmartMoneyMap } from "./useSmartMoneyMap";
import { useWhaleProfiles } from "./useWhaleProfiles";
import { detectSniperActivity } from "@/lib/sniper";
import { loadWeights, SignalWeights } from "@/lib/adaptiveWeights";

export type UnifiedLabel = "HIGH SIGNAL" | "MEDIUM" | "LOW";

export interface ScoredToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  pairCreatedAt: number;
  dexId: string;
  url: string;
  score: number;
  label: UnifiedLabel;
  walletCount: number;
  walletTouches: number;
  sniperType: "sniper" | "early" | null;
  whaleCount: number;
  factors: string[];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function scoreToken(token: NewLaunchToken, walletCount: number, walletTouches: number, weights: SignalWeights): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];
  const w = weights;

  const absChange = Math.abs(token.change24h);
  if (token.change24h >= 25) { score += 30 * w.momentum; factors.push("Strong spike"); }
  else if (token.change24h >= 10) { score += clamp(token.change24h * 1.5, 15, 25) * w.momentum; factors.push("Momentum"); }
  else if (token.change24h >= 5) { score += clamp(token.change24h, 5, 15) * w.momentum; factors.push("Uptrend"); }
  else if (token.change24h > 0) { score += token.change24h * w.momentum; }

  if (walletCount >= 3) { score += 30 * w.walletCount; factors.push("Multi-wallet interest"); }
  else if (walletCount >= 2) { score += 20 * w.walletCount; factors.push("Cross-wallet activity"); }
  else if (walletTouches >= 3) { score += 15 * w.walletCount; factors.push("Accumulating"); }
  else if (walletCount >= 1) { score += 10 * w.walletCount; factors.push("Wallet active"); }

  const ageHours = (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60);
  if (ageHours < 1) { score += 20 * w.freshness; factors.push("Just launched"); }
  else if (ageHours < 6) { score += 15 * w.freshness; factors.push("Very new"); }
  else if (ageHours < 24) { score += 10 * w.freshness; factors.push("New pair"); }
  else if (ageHours < 48) { score += 5 * w.freshness; }

  if (token.liquidity >= 50000 && token.volume24h >= 100000) { score += 20 * w.liquidity; factors.push("Strong liquidity"); }
  else if (token.liquidity >= 10000 && token.volume24h >= 20000) { score += 12 * w.liquidity; }
  else if (token.liquidity >= 5000) { score += 5 * w.liquidity; }

  if (token.liquidity < 5000) { score -= 15; factors.push("Low liquidity"); }
  if (absChange > 50) { score -= 10; factors.push("Extreme volatility"); }

  return { score: clamp(Math.round(score), 0, 100), factors };
}

function getLabel(score: number): UnifiedLabel {
  if (score >= 60) return "HIGH SIGNAL";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

export function useUnifiedSignals() {
  const { data: launches } = useNewLaunches();
  const { data: trending } = useTrendingSignals();
  const { tokens: smartMoneyTokens } = useSmartMoney();
  const { map: smartMoneyMap } = useSmartMoneyMap();
  const { tokenWhaleCount } = useWhaleProfiles();

  const scored = useMemo(() => {
    const weights = loadWeights();
    const tokenMap = new Map<string, NewLaunchToken>();
    for (const t of launches ?? []) tokenMap.set(t.address, t);
    for (const t of trending ?? []) { if (!tokenMap.has(t.address)) tokenMap.set(t.address, t); }

    const smLookup = new Map(smartMoneyTokens.map((s) => [s.tokenAddress, s]));
    const results: ScoredToken[] = [];

    for (const [, token] of tokenMap) {
      const sm = smLookup.get(token.address);
      const smMap = smartMoneyMap[token.address];
      const walletCount = sm?.walletCount ?? smMap?.count ?? 0;
      const walletTouches = sm?.interactionCount ?? smMap?.count ?? 0;
      const lastSeen = smMap?.lastSeen ?? sm?.latestTime ?? 0;
      const whaleCount = tokenWhaleCount[token.address] ?? 0;

      const { score: baseScore, factors } = scoreToken(token, walletCount, walletTouches, weights);

      let smartBonus = 0;
      if (walletCount >= 2) { smartBonus += walletCount * 10; if (walletCount >= 3) smartBonus += 20; }
      const isFresh = lastSeen > 0 && (Date.now() / 1000 - lastSeen) < 300;
      if (isFresh && walletCount >= 1) { smartBonus += 25 * weights.freshness; factors.push("Smart money LIVE"); }

      const sniperType = detectSniperActivity(walletCount, lastSeen);
      let sniperBonus = 0;
      if (sniperType === "sniper") { sniperBonus += 40 * weights.sniper; factors.push("Sniper activity"); }
      else if (sniperType === "early") { sniperBonus += 20 * weights.sniper; factors.push("Early accumulation"); }

      let whaleBonus = 0;
      if (whaleCount >= 2) { whaleBonus += 35 * weights.whale; factors.push("Multi-whale convergence"); }
      else if (whaleCount >= 1) { whaleBonus += 15 * weights.whale; factors.push("Whale activity"); }

      const score = clamp(Math.round(baseScore + smartBonus + sniperBonus + whaleBonus), 0, 100);
      results.push({ ...token, score, label: getLabel(score), walletCount, walletTouches, sniperType, whaleCount, factors });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }, [launches, trending, smartMoneyTokens, smartMoneyMap, tokenWhaleCount]);

  return { tokens: scored, isLoading: !launches && !trending };
}