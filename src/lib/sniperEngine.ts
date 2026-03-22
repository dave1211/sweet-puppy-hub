import { ScoredToken } from "@/hooks/useUnifiedSignals";
import { assessRug, RiskLevel } from "@/hooks/useRugDetection";

export interface SniperConfig {
  minWalletCount: number;
  maxFreshnessSeconds: number;
  minSignalScore: number;
  minLiquidity: number;
  maxRugRisk: RiskLevel;
  maxPositionSizeSOL: number;
  maxOpenTrades: number;
  cooldownMinutes: number;
  requireWhale: boolean;
}

export const DEFAULT_SNIPER_CONFIG: SniperConfig = {
  minWalletCount: 2,
  maxFreshnessSeconds: 300,
  minSignalScore: 50,
  minLiquidity: 10_000,
  maxRugRisk: "watch",
  maxPositionSizeSOL: 0.5,
  maxOpenTrades: 3,
  cooldownMinutes: 10,
  requireWhale: false,
};

export type SniperStatus = "READY" | "BLOCKED";

export interface SniperPreview {
  token: ScoredToken;
  status: SniperStatus;
  reasons: string[];
  riskFlags: string[];
  rugLevel: RiskLevel;
  whaleCount: number;
  timestamp: number;
}

const RISK_ORDER: Record<RiskLevel, number> = { low: 0, watch: 1, high: 2 };

export function evaluateToken(
  token: ScoredToken,
  config: SniperConfig,
  whaleCount: number,
  lastSeen: number,
  cooldowns: Record<string, number>
): SniperPreview {
  const reasons: string[] = [];
  const riskFlags: string[] = [];
  const now = Date.now();

  const rug = assessRug({
    liquidity: token.liquidity,
    volume24h: token.volume24h,
    change24h: token.change24h,
    pairCreatedAt: token.pairCreatedAt,
  });

  if (token.walletCount >= config.minWalletCount) reasons.push(`${token.walletCount} wallets active`);
  else riskFlags.push(`Only ${token.walletCount} wallet(s) — need ${config.minWalletCount}`);

  const secondsAgo = lastSeen > 0 ? now / 1000 - lastSeen : Infinity;
  if (secondsAgo <= config.maxFreshnessSeconds) reasons.push(`Activity ${Math.round(secondsAgo)}s ago`);
  else riskFlags.push("Stale activity");

  if (token.score >= config.minSignalScore) reasons.push(`Score ${token.score}/100`);
  else riskFlags.push(`Score ${token.score} < ${config.minSignalScore}`);

  if (token.liquidity >= config.minLiquidity) reasons.push(`Liq $${(token.liquidity / 1000).toFixed(0)}K`);
  else riskFlags.push(`Low liq $${(token.liquidity / 1000).toFixed(1)}K`);

  if (RISK_ORDER[rug.level] > RISK_ORDER[config.maxRugRisk]) riskFlags.push(`Rug: ${rug.label}`);

  if (config.requireWhale && whaleCount === 0) riskFlags.push("No whale activity");
  else if (whaleCount > 0) reasons.push(`🐋 ${whaleCount} whale${whaleCount > 1 ? "s" : ""}`);

  const lastTriggered = cooldowns[token.address] ?? 0;
  if (now - lastTriggered < config.cooldownMinutes * 60 * 1000) riskFlags.push("Cooldown active");

  if (token.sniperType === "sniper") reasons.push("🎯 Sniper convergence");
  if (token.sniperType === "early") reasons.push("⚡ Early accumulation");

  const conditionsMet =
    token.walletCount >= config.minWalletCount &&
    secondsAgo <= config.maxFreshnessSeconds &&
    token.score >= config.minSignalScore &&
    token.liquidity >= config.minLiquidity;

  const safetyPassed =
    RISK_ORDER[rug.level] <= RISK_ORDER[config.maxRugRisk] &&
    (!config.requireWhale || whaleCount > 0) &&
    (now - lastTriggered >= config.cooldownMinutes * 60 * 1000);

  const status: SniperStatus = conditionsMet && safetyPassed ? "READY" : "BLOCKED";

  return { token, status, reasons, riskFlags, rugLevel: rug.level, whaleCount, timestamp: now };
}