// Detection Service — Enriches raw token data into DetectedToken format
import type { DetectedToken, TokenMetadata, SmartMoneyEntry, SniperToken } from "../types";
import { getSniperState } from "../types";
import { scoreToken } from "./scoringEngine";
import { analyzeRisk } from "./riskEngine";
import type { NewLaunchToken } from "@/hooks/useNewLaunches";

// Enrich raw launch data with simulated on-chain metrics
// In production, these would come from Helius/Shyft/Jupiter APIs
export function enrichToken(raw: NewLaunchToken): DetectedToken {
  const ageMin = (Date.now() - raw.pairCreatedAt) / 60_000;
  const seed = hashCode(raw.address);

  // Simulated enrichment — deterministic per address
  const holderCount = Math.max(5, Math.floor(deterministicRandom(seed, 1) * 500 + raw.volume24h / 2000));
  const txCount = Math.max(10, Math.floor(raw.volume24h / 100 + deterministicRandom(seed, 2) * 200));
  const buyRatio = 0.4 + deterministicRandom(seed, 3) * 0.5;
  const buyCount = Math.floor(txCount * buyRatio);
  const sellCount = txCount - buyCount;
  const topHolderPct = Math.max(5, Math.min(80, 60 - (holderCount / 10) + deterministicRandom(seed, 4) * 20));

  const hasMeta = deterministicRandom(seed, 5) > 0.4;
  const metadata: TokenMetadata = {
    website: hasMeta && deterministicRandom(seed, 6) > 0.3 ? `https://${raw.symbol.toLowerCase()}.io` : null,
    twitter: hasMeta && deterministicRandom(seed, 7) > 0.3 ? `@${raw.symbol}` : null,
    telegram: hasMeta && deterministicRandom(seed, 8) > 0.5 ? `t.me/${raw.symbol}` : null,
    description: hasMeta ? `${raw.name} — Solana memecoin` : null,
    imageUrl: null,
    hasCompleteMeta: hasMeta && deterministicRandom(seed, 6) > 0.3 && deterministicRandom(seed, 7) > 0.3,
  };

  return {
    ...raw,
    holderCount,
    txCount,
    buyCount,
    sellCount,
    topHolderPct,
    lpLocked: deterministicRandom(seed, 9) > 0.6 ? true : deterministicRandom(seed, 9) > 0.3 ? false : null,
    deployerAddress: deterministicRandom(seed, 10) > 0.3 ? `${raw.address.slice(0, 8)}...deploy` : null,
    metadata,
    detectedAt: raw.pairCreatedAt,
  };
}

// Generate simulated smart money entries for a token
export function generateSmartMoneyEntries(token: DetectedToken): SmartMoneyEntry[] {
  const seed = hashCode(token.address);
  const count = Math.floor(deterministicRandom(seed, 20) * 4);
  const entries: SmartMoneyEntry[] = [];

  for (let i = 0; i < count; i++) {
    const isBuy = deterministicRandom(seed, 21 + i) > 0.3;
    entries.push({
      walletAddress: `SM${(seed + i).toString(16).slice(0, 8)}...${(seed * (i + 1)).toString(16).slice(0, 4)}`,
      walletTag: deterministicRandom(seed, 25 + i) > 0.5 ? "smart_money" : "whale",
      walletLabel: deterministicRandom(seed, 25 + i) > 0.5 ? `Smart ${i + 1}` : `Whale ${i + 1}`,
      tokenAddress: token.address,
      action: isBuy ? "buy" : "sell",
      amount: Math.floor(deterministicRandom(seed, 30 + i) * 50) / 10,
      timestamp: Date.now() - Math.floor(deterministicRandom(seed, 35 + i) * 3600_000),
    });
  }
  return entries;
}

// Full pipeline: raw → enriched → scored → risk-analyzed → state-assigned
export function processToken(raw: NewLaunchToken): SniperToken {
  const token = enrichToken(raw);
  const smartMoneyEntries = generateSmartMoneyEntries(token);
  const whaleCount = smartMoneyEntries.filter((e) => e.walletTag === "whale" && e.action === "buy").length;
  const smartMoneyCount = smartMoneyEntries.filter((e) => e.walletTag === "smart_money" && e.action === "buy").length;

  const score = scoreToken({ token, smartMoneyEntries, whaleCount });
  const risk = analyzeRisk(token);
  const state = getSniperState(score, risk);

  return {
    token,
    score,
    risk,
    state,
    smartMoneyEntries,
    whaleCount,
    smartMoneyCount,
    momentumDelta: token.change24h > 0 ? Math.min(100, token.change24h / 2) : Math.max(-100, token.change24h),
    updatedAt: Date.now(),
  };
}

// Deterministic hash for consistent simulation
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function deterministicRandom(seed: number, offset: number): number {
  const x = Math.sin(seed * 9301 + offset * 49297) * 49297;
  return x - Math.floor(x);
}
