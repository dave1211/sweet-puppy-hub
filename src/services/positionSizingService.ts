/**
 * Position Sizing Engine — computes recommended size, concentration impact, and warnings.
 *
 * RULES:
 *   - Never auto-execute trades
 *   - Never present suggestions as guarantees
 *   - If data is partial → lower confidence, widen margins
 *   - All outputs are recommendations, not mandates
 */

export type SizingSeverity = "ok" | "caution" | "warning" | "critical";
export type SizingConfidence = "high" | "medium" | "low";

export interface PositionSizingInput {
  /** Current portfolio total in USD */
  portfolioValueUSD: number;
  /** Current % held in the target token (0-100) */
  currentTokenPct: number;
  /** Current top-asset concentration % (0-100) */
  currentTopConcentrationPct: number;
  /** Trade amount in USD */
  tradeAmountUSD: number;
  /** Token safety score 0-100 (100 = safest). null if unknown */
  safetyScore: number | null;
  /** Available liquidity in USD. null if unknown */
  liquidityUSD: number | null;
  /** Is the token a stablecoin? */
  isStablecoin: boolean;
  /** Estimated 24h volume USD. null if unknown */
  volume24hUSD: number | null;
}

export interface PositionSizingResult {
  /** Suggested max trade size in USD */
  suggestedMaxUSD: number;
  /** Trade as % of portfolio */
  tradePctOfPortfolio: number;
  /** Token concentration after trade (%) */
  postTradeTokenPct: number;
  /** Top-asset concentration after trade (%) */
  postTradeTopConcentrationPct: number;
  /** Change in concentration */
  concentrationDelta: number;
  /** Overall severity */
  severity: SizingSeverity;
  /** Confidence in the recommendation */
  confidence: SizingConfidence;
  /** Human-readable warnings */
  warnings: string[];
  /** Human-readable recommendation */
  recommendation: string;
  /** Whether slippage risk is elevated */
  slippageRisk: boolean;
  /** Whether liquidity is insufficient */
  liquidityWarning: boolean;
}

/** Base max allocation per token risk tier (% of portfolio) */
function maxAllocationPct(safetyScore: number | null, isStablecoin: boolean): number {
  if (isStablecoin) return 50;
  if (safetyScore === null) return 5;   // unknown → conservative
  if (safetyScore >= 80) return 25;
  if (safetyScore >= 60) return 15;
  if (safetyScore >= 40) return 10;
  return 5; // high-risk
}

export function computePositionSizing(input: PositionSizingInput): PositionSizingResult {
  const {
    portfolioValueUSD, currentTokenPct, currentTopConcentrationPct,
    tradeAmountUSD, safetyScore, liquidityUSD, isStablecoin, volume24hUSD,
  } = input;

  const warnings: string[] = [];
  let confidence: SizingConfidence = "high";

  // ─── Confidence adjustments ───
  if (safetyScore === null) { confidence = "low"; warnings.push("Token safety unknown — sizing is conservative"); }
  if (liquidityUSD === null) { confidence = confidence === "high" ? "medium" : "low"; }
  if (portfolioValueUSD <= 0) {
    return {
      suggestedMaxUSD: 0, tradePctOfPortfolio: 0,
      postTradeTokenPct: 0, postTradeTopConcentrationPct: currentTopConcentrationPct,
      concentrationDelta: 0, severity: "caution", confidence: "low",
      warnings: ["Portfolio value is zero — connect wallet to get sizing guidance"],
      recommendation: "Connect wallet to enable position sizing",
      slippageRisk: false, liquidityWarning: false,
    };
  }

  // ─── Max allocation ───
  const maxPct = maxAllocationPct(safetyScore, isStablecoin);
  const remainingPct = Math.max(0, maxPct - currentTokenPct);
  let suggestedMaxUSD = (remainingPct / 100) * portfolioValueUSD;

  // ─── Liquidity constraint ───
  let liquidityWarning = false;
  if (liquidityUSD !== null && liquidityUSD > 0) {
    const maxLiquiditySafe = liquidityUSD * 0.02; // max 2% of pool
    if (suggestedMaxUSD > maxLiquiditySafe) {
      suggestedMaxUSD = maxLiquiditySafe;
      liquidityWarning = true;
      warnings.push(`Liquidity is low ($${(liquidityUSD / 1000).toFixed(0)}K) — size capped to avoid slippage`);
    }
  }

  // ─── Slippage risk ───
  let slippageRisk = false;
  if (volume24hUSD !== null && volume24hUSD > 0) {
    if (tradeAmountUSD > volume24hUSD * 0.05) {
      slippageRisk = true;
      warnings.push("Trade size exceeds 5% of 24h volume — expect significant slippage");
    }
  }

  // ─── Post-trade metrics ───
  const newPortfolioValue = portfolioValueUSD + tradeAmountUSD;
  const currentTokenValue = (currentTokenPct / 100) * portfolioValueUSD;
  const postTradeTokenValue = currentTokenValue + tradeAmountUSD;
  const postTradeTokenPct = (postTradeTokenValue / newPortfolioValue) * 100;

  // Top concentration: if this token becomes the new top, update
  const postTradeTopConcentrationPct = Math.max(currentTopConcentrationPct, postTradeTokenPct);
  const concentrationDelta = postTradeTopConcentrationPct - currentTopConcentrationPct;

  const tradePctOfPortfolio = (tradeAmountUSD / portfolioValueUSD) * 100;

  // ─── Concentration warnings ───
  if (postTradeTokenPct > maxPct) {
    warnings.push(`Position would reach ${postTradeTokenPct.toFixed(1)}% — above ${maxPct}% limit for this risk tier`);
  }
  if (postTradeTopConcentrationPct > 50) {
    warnings.push("Portfolio would be >50% in a single asset — extreme concentration");
  } else if (postTradeTopConcentrationPct > 30) {
    warnings.push("Top-asset concentration would exceed 30%");
  }

  // ─── High-risk extra warning ───
  if (safetyScore !== null && safetyScore < 40 && tradeAmountUSD > suggestedMaxUSD) {
    warnings.push("This is a high-risk token — strongly consider reducing size");
  }

  // ─── Severity ───
  let severity: SizingSeverity = "ok";
  if (tradeAmountUSD > suggestedMaxUSD * 2 || postTradeTokenPct > maxPct * 2) severity = "critical";
  else if (tradeAmountUSD > suggestedMaxUSD * 1.2 || postTradeTokenPct > maxPct) severity = "warning";
  else if (tradeAmountUSD > suggestedMaxUSD * 0.8 || slippageRisk || liquidityWarning) severity = "caution";

  // ─── Recommendation ───
  let recommendation: string;
  if (severity === "critical") recommendation = `Strongly consider reducing to ≤$${suggestedMaxUSD.toFixed(2)}`;
  else if (severity === "warning") recommendation = `Recommended max: $${suggestedMaxUSD.toFixed(2)} (${maxPct}% allocation)`;
  else if (severity === "caution") recommendation = `Size is near recommended limit of $${suggestedMaxUSD.toFixed(2)}`;
  else recommendation = "Position size is within recommended range";

  return {
    suggestedMaxUSD: Math.max(0, suggestedMaxUSD),
    tradePctOfPortfolio,
    postTradeTokenPct,
    postTradeTopConcentrationPct,
    concentrationDelta,
    severity,
    confidence,
    warnings,
    recommendation,
    slippageRisk,
    liquidityWarning,
  };
}
