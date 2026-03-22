/**
 * Risk assessment engine — evaluates token/trade safety.
 */

import type { RiskAssessment, RiskWarning, TrustLine, AMMPool, OrderBookSnapshot } from "@/types/xrpl";

export function assessTokenRisk(
  currency: string,
  issuer: string | undefined,
  trustLine?: TrustLine,
  pool?: AMMPool | null,
  orderBook?: OrderBookSnapshot
): RiskAssessment {
  const warnings: RiskWarning[] = [];

  // XRP is always safe
  if (!issuer) {
    return { level: "low", warnings: [], score: 5 };
  }

  // No trust line
  if (!trustLine) {
    warnings.push({
      type: "no_trustline",
      message: `No trust line set for ${currency}`,
      severity: "warning",
    });
  }

  // Low liquidity
  const totalBidDepth = orderBook?.bids.reduce((s, b) => s + b.size, 0) ?? 0;
  const totalAskDepth = orderBook?.asks.reduce((s, a) => s + a.size, 0) ?? 0;
  if (totalBidDepth + totalAskDepth < 1000) {
    warnings.push({
      type: "low_liquidity",
      message: "Very low order book liquidity — large trades may suffer high slippage",
      severity: "warning",
    });
  }

  // High spread = suspicious
  if (orderBook && orderBook.spreadPct > 5) {
    warnings.push({
      type: "suspicious_token",
      message: `Unusually wide spread (${orderBook.spreadPct.toFixed(1)}%) — exercise caution`,
      severity: "critical",
    });
  }

  // AMM pool check
  if (pool && pool.asset1Balance < 100 && pool.asset2Balance < 100) {
    warnings.push({
      type: "low_liquidity",
      message: "AMM pool has very low reserves",
      severity: "warning",
    });
  }

  // Issuer concentration
  if (trustLine && Number(trustLine.balance) > Number(trustLine.limit) * 0.9) {
    warnings.push({
      type: "issuer_concentration",
      message: "Balance near trust line limit — issuer may restrict",
      severity: "info",
    });
  }

  const score = Math.min(100, warnings.length * 25);
  const level = score >= 75 ? "critical" : score >= 50 ? "high" : score >= 25 ? "medium" : "low";

  return { level, warnings, score };
}

export function assessTradeRisk(slippage: number, priceImpact: number, amount: number): RiskWarning[] {
  const warnings: RiskWarning[] = [];

  if (slippage > 5) {
    warnings.push({
      type: "high_slippage",
      message: `High slippage: ${slippage.toFixed(2)}%`,
      severity: slippage > 10 ? "critical" : "warning",
    });
  }

  if (priceImpact > 3) {
    warnings.push({
      type: "high_slippage",
      message: `Significant price impact: ${priceImpact.toFixed(2)}%`,
      severity: priceImpact > 8 ? "critical" : "warning",
    });
  }

  return warnings;
}
