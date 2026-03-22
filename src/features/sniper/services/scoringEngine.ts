// Scoring Engine — Weighted rules engine for token opportunity scoring
import type { DetectedToken, ScoreBreakdown, SmartMoneyEntry } from "../types";
import { getScoreBand } from "../types";

interface ScoringInput {
  token: DetectedToken;
  smartMoneyEntries: SmartMoneyEntry[];
  whaleCount: number;
}

interface WeightConfig {
  liquidity: number;
  momentum: number;
  holderQuality: number;
  smartMoney: number;
  safety: number;
  socialMeta: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  liquidity: 20,
  momentum: 20,
  holderQuality: 20,
  smartMoney: 20,
  safety: 15,
  socialMeta: 5,
};

export function scoreToken(input: ScoringInput, weights = DEFAULT_WEIGHTS): ScoreBreakdown {
  const { token, smartMoneyEntries, whaleCount } = input;
  const tags: string[] = [];

  // 1. LIQUIDITY SCORE (0–20)
  let liqScore = 0;
  if (token.liquidity >= 100_000) { liqScore = 20; tags.push("DEEP_LIQ"); }
  else if (token.liquidity >= 50_000) liqScore = 17;
  else if (token.liquidity >= 25_000) liqScore = 14;
  else if (token.liquidity >= 10_000) liqScore = 10;
  else if (token.liquidity >= 5_000) liqScore = 6;
  else if (token.liquidity >= 2_000) liqScore = 3;
  else liqScore = 1;

  const ageMin = (Date.now() - token.pairCreatedAt) / 60_000;
  // healthy liq-to-age ratio bonus
  if (token.liquidity > 0 && ageMin > 0 && token.liquidity / ageMin > 500) {
    liqScore = Math.min(20, liqScore + 2);
    tags.push("GROWING_LIQ");
  }

  // 2. MOMENTUM SCORE (0–20)
  let momScore = 0;
  const buyRatio = token.buyCount / Math.max(1, token.buyCount + token.sellCount);
  if (buyRatio >= 0.8) { momScore += 8; tags.push("BUY_PRESSURE"); }
  else if (buyRatio >= 0.65) momScore += 5;
  else if (buyRatio >= 0.5) momScore += 3;

  // volume acceleration
  if (token.volume24h >= 500_000) { momScore += 6; tags.push("VOLUME_SURGE"); }
  else if (token.volume24h >= 100_000) momScore += 4;
  else if (token.volume24h >= 25_000) momScore += 2;

  // price direction without violent rejection
  if (token.change24h > 0 && token.change24h < 200) {
    momScore += 4;
    if (token.change24h > 50) tags.push("STRONG_PUMP");
  } else if (token.change24h > 200) {
    momScore += 2; // too parabolic can be risky
    tags.push("PARABOLIC");
  }

  // trade cadence
  if (token.txCount > 200) momScore += 2;
  else if (token.txCount > 50) momScore += 1;
  momScore = Math.min(20, momScore);

  // 3. HOLDER QUALITY SCORE (0–20)
  let holderScore = 0;
  if (token.holderCount >= 500) { holderScore = 10; tags.push("WIDE_DISTRIBUTION"); }
  else if (token.holderCount >= 200) holderScore = 8;
  else if (token.holderCount >= 100) holderScore = 6;
  else if (token.holderCount >= 50) holderScore = 4;
  else holderScore = 2;

  // concentration penalty
  if (token.topHolderPct < 10) { holderScore += 8; tags.push("LOW_CONCENTRATION"); }
  else if (token.topHolderPct < 25) holderScore += 5;
  else if (token.topHolderPct < 40) holderScore += 3;
  else holderScore += 1; // very concentrated

  // natural growth bonus
  if (token.holderCount > 0 && ageMin > 0) {
    const growthRate = token.holderCount / ageMin;
    if (growthRate > 5) { holderScore += 2; tags.push("ORGANIC_GROWTH"); }
  }
  holderScore = Math.min(20, holderScore);

  // 4. SMART MONEY SCORE (0–20)
  let smScore = 0;
  const smBuys = smartMoneyEntries.filter((e) => e.action === "buy");
  const smSells = smartMoneyEntries.filter((e) => e.action === "sell");

  if (smBuys.length >= 3) { smScore = 14; tags.push("SM_CONVERGENCE"); }
  else if (smBuys.length >= 2) { smScore = 10; tags.push("SM_INTEREST"); }
  else if (smBuys.length >= 1) smScore = 6;

  // penalize if smart money is selling
  if (smSells.length > smBuys.length) { smScore = Math.max(0, smScore - 6); tags.push("SM_EXIT"); }

  if (whaleCount >= 2) { smScore += 4; tags.push("WHALE_ENTRY"); }
  else if (whaleCount >= 1) smScore += 2;

  // early entry bonus
  const earlySmBuy = smBuys.find((e) => (Date.now() - e.timestamp) / 60_000 < 10);
  if (earlySmBuy) { smScore += 2; tags.push("EARLY_SM_BUY"); }
  smScore = Math.min(20, smScore);

  // 5. SAFETY SCORE (0–15)
  let safetyScore = 0;
  if (token.lpLocked === true) { safetyScore += 6; tags.push("LP_LOCKED"); }
  else if (token.lpLocked === null) safetyScore += 2; // unknown
  // else unlocked = 0

  if (token.topHolderPct < 20) safetyScore += 3;
  if (ageMin > 30) safetyScore += 2;
  if (token.change24h > -30) safetyScore += 2; // no immediate dump
  if (token.txCount > 50 && buyRatio > 0.5) safetyScore += 2; // organic activity
  safetyScore = Math.min(15, safetyScore);

  // 6. SOCIAL / META SCORE (0–5)
  let metaScore = 0;
  if (token.metadata.hasCompleteMeta) { metaScore = 4; tags.push("VERIFIED_META"); }
  else {
    if (token.metadata.website) metaScore += 1;
    if (token.metadata.twitter) metaScore += 1;
    if (token.metadata.telegram) metaScore += 1;
    if (token.metadata.imageUrl) metaScore += 1;
  }
  metaScore = Math.min(5, metaScore);

  // Apply weights
  const total = Math.round(
    (liqScore / 20) * weights.liquidity +
    (momScore / 20) * weights.momentum +
    (holderScore / 20) * weights.holderQuality +
    (smScore / 20) * weights.smartMoney +
    (safetyScore / 15) * weights.safety +
    (metaScore / 5) * weights.socialMeta
  );

  const confidence = Math.min(100, Math.round(
    (token.txCount > 20 ? 20 : 10) +
    (token.holderCount > 10 ? 15 : 5) +
    (ageMin > 5 ? 15 : 5) +
    (smartMoneyEntries.length > 0 ? 20 : 0) +
    (token.liquidity > 5_000 ? 15 : 5) +
    (token.metadata.hasCompleteMeta ? 15 : 5)
  ));

  return {
    liquidity: liqScore,
    momentum: momScore,
    holderQuality: holderScore,
    smartMoney: smScore,
    safety: safetyScore,
    socialMeta: metaScore,
    total: Math.min(100, total),
    band: getScoreBand(total),
    confidence,
    tags,
  };
}
