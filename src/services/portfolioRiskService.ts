/**
 * Portfolio Risk Engine — evaluates total exposure across assets, wallets, and chains.
 *
 * RULES:
 *   - Never fabricate P/L or cost basis
 *   - If data is partial → lower confidence + explain why
 *   - Scores are 0-100 (100 = worst risk)
 *   - No Math.random, no fake precision
 */

export type PortfolioRiskLevel = "low" | "moderate" | "elevated" | "high";
export type RiskConfidence = "high" | "medium" | "low";

export interface PortfolioAssetEntry {
  symbol: string;
  name: string;
  valueUSD: number;
  mint?: string;
  chain?: string;
  /** from tokenSafetyService — null if not assessed */
  safetyScore?: number | null;
  isStablecoin?: boolean;
  liquidity?: number;
}

export interface PortfolioWalletEntry {
  address: string;
  chain: string;
  valueUSD: number;
}

export interface PortfolioRiskResult {
  totalValue: number;
  confidence: RiskConfidence;
  concentrationScore: number;
  diversificationScore: number;
  liquidityRiskScore: number;
  highRiskExposureScore: number;
  walletConcentrationScore: number;
  stablecoinRatio: number;
  overallPortfolioRisk: PortfolioRiskLevel;
  topRisks: string[];
  recommendations: string[];
  evidence: string[];
  chainAllocation: Record<string, { valueUSD: number; pct: number }>;
  topAssets: { symbol: string; pct: number; valueUSD: number }[];
}

export interface PortfolioRiskInput {
  assets: PortfolioAssetEntry[];
  wallets: PortfolioWalletEntry[];
  watchlistAddresses?: string[];
}

export function assessPortfolioRisk(input: PortfolioRiskInput): PortfolioRiskResult {
  const { assets, wallets, watchlistAddresses = [] } = input;

  const totalValue = assets.reduce((s, a) => s + a.valueUSD, 0);
  const evidence: string[] = [];
  const topRisks: string[] = [];
  const recommendations: string[] = [];

  // ─── Confidence ───
  let confidencePoints = 3; // start high
  if (assets.length === 0) confidencePoints = 0;
  if (assets.some(a => a.safetyScore === null || a.safetyScore === undefined)) confidencePoints -= 1;
  if (wallets.length === 0) confidencePoints -= 1;
  const confidence: RiskConfidence = confidencePoints >= 3 ? "high" : confidencePoints >= 2 ? "medium" : "low";

  if (totalValue === 0) {
    return {
      totalValue: 0, confidence: "low",
      concentrationScore: 0, diversificationScore: 0,
      liquidityRiskScore: 0, highRiskExposureScore: 0,
      walletConcentrationScore: 0, stablecoinRatio: 0,
      overallPortfolioRisk: "low",
      topRisks: ["No assets detected"], recommendations: ["Connect wallet to assess risk"],
      evidence: ["Portfolio is empty or wallet not connected"],
      chainAllocation: {}, topAssets: [],
    };
  }

  // ─── Asset concentration ───
  const sorted = [...assets].sort((a, b) => b.valueUSD - a.valueUSD);
  const topPct = totalValue > 0 ? (sorted[0]?.valueUSD / totalValue) * 100 : 0;
  const top3Pct = totalValue > 0 ? (sorted.slice(0, 3).reduce((s, a) => s + a.valueUSD, 0) / totalValue) * 100 : 0;

  let concentrationScore = 0;
  if (topPct > 80) concentrationScore = 95;
  else if (topPct > 60) concentrationScore = 75;
  else if (topPct > 40) concentrationScore = 50;
  else if (topPct > 25) concentrationScore = 30;
  else concentrationScore = 10;

  evidence.push(`Top asset: ${sorted[0]?.symbol ?? "—"} at ${topPct.toFixed(1)}% of portfolio`);
  evidence.push(`Top 3 assets: ${top3Pct.toFixed(1)}% of portfolio`);

  if (topPct > 60) {
    topRisks.push(`${sorted[0]?.symbol} represents ${topPct.toFixed(0)}% — extreme concentration`);
    recommendations.push(`Consider diversifying out of ${sorted[0]?.symbol}`);
  } else if (topPct > 40) {
    topRisks.push(`${sorted[0]?.symbol} at ${topPct.toFixed(0)}% — above recommended 30%`);
  }

  // ─── Diversification (inverse of concentration) ───
  const diversificationScore = Math.max(0, 100 - concentrationScore);

  // ─── Stablecoin ratio ───
  const stableValue = assets.filter(a => a.isStablecoin).reduce((s, a) => s + a.valueUSD, 0);
  const stablecoinRatio = totalValue > 0 ? stableValue / totalValue : 0;
  evidence.push(`Stablecoin allocation: ${(stablecoinRatio * 100).toFixed(1)}%`);

  if (stablecoinRatio < 0.05 && totalValue > 100) {
    recommendations.push("Consider holding some stablecoins as a safety buffer");
  }

  // ─── Liquidity risk ───
  const lowLiqAssets = assets.filter(a => a.liquidity != null && a.liquidity < 5_000);
  const lowLiqValue = lowLiqAssets.reduce((s, a) => s + a.valueUSD, 0);
  const lowLiqPct = totalValue > 0 ? (lowLiqValue / totalValue) * 100 : 0;
  let liquidityRiskScore = 0;
  if (lowLiqPct > 50) liquidityRiskScore = 90;
  else if (lowLiqPct > 30) liquidityRiskScore = 65;
  else if (lowLiqPct > 15) liquidityRiskScore = 40;
  else if (lowLiqPct > 5) liquidityRiskScore = 20;
  else liquidityRiskScore = 5;

  if (lowLiqPct > 20) {
    topRisks.push(`${lowLiqPct.toFixed(0)}% of value in low-liquidity tokens`);
  }
  evidence.push(`Low-liquidity exposure: ${lowLiqPct.toFixed(1)}%`);

  // ─── High risk exposure (tokens with low safety score) ───
  const riskyAssets = assets.filter(a => a.safetyScore != null && a.safetyScore < 40);
  const riskyValue = riskyAssets.reduce((s, a) => s + a.valueUSD, 0);
  const riskyPct = totalValue > 0 ? (riskyValue / totalValue) * 100 : 0;
  let highRiskExposureScore = 0;
  if (riskyPct > 40) highRiskExposureScore = 90;
  else if (riskyPct > 20) highRiskExposureScore = 60;
  else if (riskyPct > 10) highRiskExposureScore = 35;
  else highRiskExposureScore = 10;

  if (riskyPct > 15) {
    topRisks.push(`${riskyPct.toFixed(0)}% of portfolio in high-risk tokens`);
    recommendations.push("Review high-risk holdings and consider reducing exposure");
  }
  evidence.push(`High-risk token exposure: ${riskyPct.toFixed(1)}%`);

  // ─── Wallet concentration ───
  let walletConcentrationScore = 0;
  if (wallets.length > 0) {
    const walletTotal = wallets.reduce((s, w) => s + w.valueUSD, 0);
    const topWallet = Math.max(...wallets.map(w => w.valueUSD));
    const topWalletPct = walletTotal > 0 ? (topWallet / walletTotal) * 100 : 100;
    walletConcentrationScore = wallets.length === 1 ? 80 : topWalletPct > 80 ? 70 : topWalletPct > 50 ? 40 : 15;

    if (wallets.length === 1) {
      topRisks.push("Single wallet — no redundancy");
      recommendations.push("Consider using multiple wallets for security");
    }
    evidence.push(`${wallets.length} wallet(s), top wallet: ${topWalletPct.toFixed(0)}%`);
  } else {
    walletConcentrationScore = 50;
    evidence.push("No wallet data available — estimated risk");
  }

  // ─── Chain allocation ───
  const chainAllocation: Record<string, { valueUSD: number; pct: number }> = {};
  for (const a of assets) {
    const chain = a.chain ?? "solana";
    if (!chainAllocation[chain]) chainAllocation[chain] = { valueUSD: 0, pct: 0 };
    chainAllocation[chain].valueUSD += a.valueUSD;
  }
  for (const chain of Object.keys(chainAllocation)) {
    chainAllocation[chain].pct = totalValue > 0 ? (chainAllocation[chain].valueUSD / totalValue) * 100 : 0;
  }

  const chainCount = Object.keys(chainAllocation).length;
  if (chainCount === 1) {
    evidence.push("100% on a single chain — no cross-chain diversification");
  } else {
    evidence.push(`Spread across ${chainCount} chains`);
  }

  // ─── Top assets list ───
  const topAssets = sorted.slice(0, 5).map(a => ({
    symbol: a.symbol,
    pct: totalValue > 0 ? (a.valueUSD / totalValue) * 100 : 0,
    valueUSD: a.valueUSD,
  }));

  // ─── Overall risk ───
  const weightedScore =
    concentrationScore * 0.3 +
    liquidityRiskScore * 0.2 +
    highRiskExposureScore * 0.25 +
    walletConcentrationScore * 0.15 +
    (100 - diversificationScore) * 0.1;

  let overallPortfolioRisk: PortfolioRiskLevel;
  if (weightedScore >= 70) overallPortfolioRisk = "high";
  else if (weightedScore >= 50) overallPortfolioRisk = "elevated";
  else if (weightedScore >= 30) overallPortfolioRisk = "moderate";
  else overallPortfolioRisk = "low";

  // Watchlist overlap
  const holdingMints = new Set(assets.map(a => a.mint).filter(Boolean));
  const overlap = watchlistAddresses.filter(a => holdingMints.has(a));
  if (overlap.length > 0) {
    evidence.push(`${overlap.length} watchlist token(s) in holdings`);
  }

  return {
    totalValue, confidence,
    concentrationScore, diversificationScore,
    liquidityRiskScore, highRiskExposureScore,
    walletConcentrationScore, stablecoinRatio,
    overallPortfolioRisk, topRisks, recommendations, evidence,
    chainAllocation, topAssets,
  };
}
