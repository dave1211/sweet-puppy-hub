// Detection Service — Enriches raw token data with live on-chain metrics
import type { DetectedToken, TokenMetadata, SmartMoneyEntry, SniperToken } from "../types";
import { getSniperState } from "../types";
import { scoreToken } from "./scoringEngine";
import { analyzeRisk } from "./riskEngine";
import type { NewLaunchToken } from "@/hooks/useNewLaunches";

// ── Live enrichment via edge function ──
export interface EnrichedTokenData {
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
  holderCount: number;
  txCount: number;
  buyCount: number;
  sellCount: number;
  topHolderPct: number;
  lpLocked: boolean | null;
  deployerAddress: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  description: string | null;
  imageUrl: string | null;
  hasCompleteMeta: boolean;
}

let enrichCache: Map<string, { data: EnrichedTokenData; ts: number }> = new Map();
const ENRICH_TTL = 30_000;

export async function fetchEnrichedTokens(addresses: string[]): Promise<EnrichedTokenData[]> {
  if (addresses.length === 0) return [];

  // Return cached items that are still fresh, only fetch stale ones
  const fresh: EnrichedTokenData[] = [];
  const staleAddrs: string[] = [];

  for (const addr of addresses) {
    const cached = enrichCache.get(addr);
    if (cached && Date.now() - cached.ts < ENRICH_TTL) {
      fresh.push(cached.data);
    } else {
      staleAddrs.push(addr);
    }
  }

  if (staleAddrs.length === 0) return fresh;

  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const res = await fetch(
      `https://${projectId}.supabase.co/functions/v1/token-data?action=token-enrich`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ addresses: staleAddrs }),
      }
    );

    if (res.ok) {
      const data: EnrichedTokenData[] = await res.json();
      for (const item of data) {
        enrichCache.set(item.address, { data: item, ts: Date.now() });
        fresh.push(item);
      }
    }
  } catch {
    // Silently fail — will use fallback enrichment
  }

  return fresh;
}

// Enrich from live data or fallback to basic token info
function enrichFromLive(raw: NewLaunchToken, live: EnrichedTokenData | undefined): DetectedToken {
  if (live) {
    const metadata: TokenMetadata = {
      website: live.website,
      twitter: live.twitter,
      telegram: live.telegram,
      description: live.description,
      imageUrl: live.imageUrl,
      hasCompleteMeta: live.hasCompleteMeta,
    };

    return {
      address: live.address,
      symbol: live.symbol,
      name: live.name,
      price: live.price,
      change24h: live.change24h,
      volume24h: live.volume24h,
      liquidity: live.liquidity,
      pairCreatedAt: live.pairCreatedAt,
      dexId: live.dexId,
      url: live.url,
      holderCount: live.holderCount,
      txCount: live.txCount,
      buyCount: live.buyCount,
      sellCount: live.sellCount,
      topHolderPct: live.topHolderPct,
      lpLocked: live.lpLocked,
      deployerAddress: live.deployerAddress,
      metadata,
      detectedAt: live.pairCreatedAt,
    };
  }

  // Fallback: use raw data with zeros for unknown fields
  return {
    ...raw,
    holderCount: 0,
    txCount: 0,
    buyCount: 0,
    sellCount: 0,
    topHolderPct: 0,
    lpLocked: null,
    deployerAddress: null,
    metadata: {
      website: null,
      twitter: null,
      telegram: null,
      description: null,
      imageUrl: null,
      hasCompleteMeta: false,
    },
    detectedAt: raw.pairCreatedAt,
  };
}

// Smart money entries from tracked wallets — kept as-is (already live via useSmartMoney)
// For individual token context we return empty; real SM data comes from useSmartMoney hook
export function generateSmartMoneyEntries(_token: DetectedToken): SmartMoneyEntry[] {
  return [];
}

// Synchronous processor for immediate display (uses cached enrichment)
export function processToken(raw: NewLaunchToken): SniperToken {
  const cachedEnrich = enrichCache.get(raw.address);
  const token = enrichFromLive(raw, cachedEnrich?.data);
  const smartMoneyEntries = generateSmartMoneyEntries(token);
  const whaleCount = 0;
  const smartMoneyCount = 0;

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

// Async processor that fetches live enrichment first
export async function processTokensLive(rawTokens: NewLaunchToken[]): Promise<SniperToken[]> {
  const addresses = rawTokens.map((t) => t.address);
  const enriched = await fetchEnrichedTokens(addresses);
  const enrichMap = new Map(enriched.map((e) => [e.address, e]));

  return rawTokens.map((raw) => {
    const token = enrichFromLive(raw, enrichMap.get(raw.address));
    const smartMoneyEntries: SmartMoneyEntry[] = [];
    const whaleCount = 0;
    const smartMoneyCount = 0;

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
  });
}
