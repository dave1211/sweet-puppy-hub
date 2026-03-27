/**
 * Unified Token Safety Service — SINGLE SOURCE OF TRUTH for all risk/safety data.
 *
 * Composes (does NOT replace) these engines:
 *   1. rugGuard        (src/lib/rugGuard.ts)         — hard block / soft warning gate
 *   2. advancedRisk    (src/lib/advancedRisk.ts)     — weighted category scoring
 *   3. useRugDetection (src/hooks/useRugDetection.ts) — simple flag-based assessment
 *   4. sniper riskEngine (src/features/sniper/services/riskEngine.ts) — launch-specific risk
 *
 * STRICT RULES:
 *   - UNKNOWN checks → status: "unknown", evidence: "PENDING — on-chain verification coming soon"
 *   - HARD_BLOCK from rugGuard → tradeAllowed: false, NO override
 *   - No Math.random anywhere
 *   - No fake data
 */

import { runRugGuard, type RugGuardInput, type RugGuardResult } from "@/lib/rugGuard";
import { assessAdvancedRisk, type TokenRiskInput, type RugRiskAssessment } from "@/lib/advancedRisk";
import { assessRug, type RugAssessment } from "@/hooks/useRugDetection";

/* ── Public types ── */

export type CheckStatus = "pass" | "fail" | "unknown";
export type FlagSeverity = "info" | "warning" | "critical";
export type CautionState = "safer" | "caution" | "high_risk" | "critical_risk";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface SafetyCheck {
  name: string;
  status: CheckStatus;
  evidence: string;
}

export interface SafetyFlag {
  severity: FlagSeverity;
  message: string;
}

export interface TokenSafetyResult {
  safetyScore: number;               // 0–100 (100 = safest)
  cautionState: CautionState;
  confidence: ConfidenceLevel;
  checks: SafetyCheck[];
  flags: SafetyFlag[];
  tradeAllowed: boolean;
  blockReasons: string[];
  derivedFrom: string[];
  // Raw results preserved for debugging — never used in UI directly
  _raw?: {
    rugGuard: RugGuardResult;
    advancedRisk: RugRiskAssessment;
    simpleRug: RugAssessment;
  };
}

/* ── Input ── */

export interface TokenSafetyInput {
  liquidity: number;
  volume24h: number;
  change24h: number;
  pairCreatedAt?: number;
  marketCap?: number;
  topHolderPct?: number;
  devHolderPct?: number;
  buyCount24h?: number;
  sellCount24h?: number;
  txCount24h?: number;
  lpLocked?: boolean | null;
  holders?: number;
  // On-chain authority data — null means NOT YET VERIFIED
  mintAuthorityRevoked?: boolean | null;
  freezeAuthorityRevoked?: boolean | null;
  isHoneypot?: boolean | null;
  contractVerified?: boolean | null;
}

/* ── Core function ── */

export function assessTokenSafety(input: TokenSafetyInput): TokenSafetyResult {
  const derivedFrom: string[] = [];
  const checks: SafetyCheck[] = [];
  const flags: SafetyFlag[] = [];
  const blockReasons: string[] = [];

  // ─── 1. Run rugGuard (HARD BLOCK authority) ───
  const guardInput: RugGuardInput = {
    liquidity: input.liquidity,
    volume24h: input.volume24h,
    change24h: input.change24h,
    pairCreatedAt: input.pairCreatedAt,
    topHolderPct: input.topHolderPct,
    lpLocked: input.lpLocked,
    marketCap: input.marketCap,
  };
  const guardResult = runRugGuard(guardInput);
  derivedFrom.push("rugGuard");

  // Hard blocks → absolute denial
  for (const hb of guardResult.hardBlocks) {
    blockReasons.push(hb.detail);
    flags.push({ severity: "critical", message: `${hb.label}: ${hb.detail}` });
  }
  for (const sw of guardResult.softWarnings) {
    flags.push({ severity: "warning", message: `${sw.label}: ${sw.detail}` });
  }

  // ─── 2. Run advancedRisk (category scoring — WITHOUT Math.random) ───
  const riskInput: TokenRiskInput = {
    liquidity: input.liquidity,
    volume24h: input.volume24h,
    change24h: input.change24h,
    marketCap: input.marketCap,
    pairCreatedAt: input.pairCreatedAt,
    holders: input.holders,
    topHolderPct: input.topHolderPct,     // pass real data or undefined
    devHolderPct: input.devHolderPct,     // pass real data or undefined
    buyCount24h: input.buyCount24h,       // pass real data or undefined
    sellCount24h: input.sellCount24h,     // pass real data or undefined
    txCount24h: input.txCount24h,
    lpLocked: input.lpLocked ?? undefined,
  };
  const advResult = assessAdvancedRisk(riskInput);
  derivedFrom.push("advancedRisk");

  // Map advancedRisk warnings to flags
  for (const w of advResult.warnings) {
    const sev: FlagSeverity = w.severity === "critical" ? "critical" : w.severity === "warning" ? "warning" : "info";
    // Avoid duplicating flags already emitted by rugGuard
    const alreadyFlagged = flags.some(f => f.message.includes(w.label));
    if (!alreadyFlagged) {
      flags.push({ severity: sev, message: `${w.label}: ${w.description}` });
    }
  }

  // ─── 3. Run simple assessRug (flag-based) ───
  const simpleResult = assessRug({
    liquidity: input.liquidity,
    volume24h: input.volume24h,
    change24h: input.change24h,
    pairCreatedAt: input.pairCreatedAt,
    marketCap: input.marketCap,
  });
  derivedFrom.push("useRugDetection");

  // ─── 4. Build safety checks ───

  // Liquidity check
  if (input.liquidity >= 10_000) {
    checks.push({ name: "Liquidity Adequate", status: "pass", evidence: `$${input.liquidity.toLocaleString()} liquidity` });
  } else if (input.liquidity >= 2_000) {
    checks.push({ name: "Liquidity Low", status: "fail", evidence: `$${input.liquidity.toLocaleString()} — below $10K recommended` });
  } else {
    checks.push({ name: "Liquidity Critical", status: "fail", evidence: `$${input.liquidity.toLocaleString()} — dangerously low` });
  }

  // Volume check
  if (input.volume24h >= 1_000) {
    checks.push({ name: "24h Volume", status: "pass", evidence: `$${input.volume24h.toLocaleString()}` });
  } else {
    checks.push({ name: "24h Volume", status: "fail", evidence: `$${input.volume24h.toLocaleString()} — very thin` });
  }

  // LP Lock check
  if (input.lpLocked === true) {
    checks.push({ name: "LP Lock Status", status: "pass", evidence: "Liquidity pool is locked" });
  } else if (input.lpLocked === false) {
    checks.push({ name: "LP Lock Status", status: "fail", evidence: "LP is NOT locked — elevated rug risk" });
  } else {
    checks.push({ name: "LP Lock Status", status: "unknown", evidence: "PENDING — on-chain verification coming soon" });
  }

  // Holder concentration
  if (input.topHolderPct != null) {
    if (input.topHolderPct <= 30) {
      checks.push({ name: "Top Holder Concentration", status: "pass", evidence: `Top holders: ${input.topHolderPct.toFixed(1)}%` });
    } else {
      checks.push({ name: "Top Holder Concentration", status: "fail", evidence: `Top holders: ${input.topHolderPct.toFixed(1)}% — concentrated` });
    }
  } else {
    checks.push({ name: "Top Holder Concentration", status: "unknown", evidence: "PENDING — holder data not available" });
  }

  // Mint authority — ON-CHAIN CHECK
  if (input.mintAuthorityRevoked === true) {
    checks.push({ name: "Mint Authority Renounced", status: "pass", evidence: "Mint authority has been revoked" });
  } else if (input.mintAuthorityRevoked === false) {
    checks.push({ name: "Mint Authority Renounced", status: "fail", evidence: "Mint authority is ACTIVE — supply can be inflated" });
    flags.push({ severity: "critical", message: "Mint authority is active — token supply can be inflated at any time" });
  } else {
    checks.push({ name: "Mint Authority Renounced", status: "unknown", evidence: "PENDING — on-chain verification coming soon" });
  }

  // Freeze authority — ON-CHAIN CHECK
  if (input.freezeAuthorityRevoked === true) {
    checks.push({ name: "Freeze Authority Renounced", status: "pass", evidence: "Freeze authority has been revoked" });
  } else if (input.freezeAuthorityRevoked === false) {
    checks.push({ name: "Freeze Authority Renounced", status: "fail", evidence: "Freeze authority is ACTIVE — accounts can be frozen" });
    flags.push({ severity: "critical", message: "Freeze authority is active — your tokens can be frozen" });
  } else {
    checks.push({ name: "Freeze Authority Renounced", status: "unknown", evidence: "PENDING — on-chain verification coming soon" });
  }

  // Honeypot check
  if (input.isHoneypot === false) {
    checks.push({ name: "Honeypot Check", status: "pass", evidence: "Token is tradeable (not a honeypot)" });
  } else if (input.isHoneypot === true) {
    checks.push({ name: "Honeypot Check", status: "fail", evidence: "HONEYPOT DETECTED — you cannot sell this token" });
    flags.push({ severity: "critical", message: "Honeypot detected — selling is impossible" });
    blockReasons.push("Honeypot detected — token cannot be sold");
  } else {
    checks.push({ name: "Honeypot Check", status: "unknown", evidence: "PENDING — on-chain verification coming soon" });
  }

  // Contract verification
  if (input.contractVerified === true) {
    checks.push({ name: "Contract Verified", status: "pass", evidence: "Contract source is verified" });
  } else if (input.contractVerified === false) {
    checks.push({ name: "Contract Verified", status: "fail", evidence: "Contract is NOT verified" });
  } else {
    checks.push({ name: "Contract Verified", status: "unknown", evidence: "PENDING — on-chain verification coming soon" });
  }

  // ─── 5. Compute unified safety score ───
  // Invert advancedRisk.overallScore (0=safe → 100=dangerous) to safetyScore (100=safest → 0=dangerous)
  let safetyScore = Math.max(0, Math.min(100, 100 - advResult.overallScore));

  // Penalize unknown checks — each reduces score slightly and drops confidence
  const unknownCount = checks.filter(c => c.status === "unknown").length;
  safetyScore = Math.max(0, safetyScore - unknownCount * 3);

  // Critical flags cap the max safety score
  const criticalCount = flags.filter(f => f.severity === "critical").length;
  if (criticalCount > 0) {
    safetyScore = Math.min(safetyScore, 35);
  }

  // HARD_BLOCK from rugGuard → force lowest score
  if (!guardResult.allowed) {
    safetyScore = Math.min(safetyScore, 10);
  }

  // ─── 6. Determine caution state ───
  let cautionState: CautionState;
  if (!guardResult.allowed || safetyScore <= 15) {
    cautionState = "critical_risk";
  } else if (safetyScore <= 35) {
    cautionState = "high_risk";
  } else if (safetyScore <= 65) {
    cautionState = "caution";
  } else {
    cautionState = "safer";
  }

  // ─── 7. Determine confidence ───
  let confidence: ConfidenceLevel;
  if (unknownCount >= 4) {
    confidence = "low";
  } else if (unknownCount >= 2) {
    confidence = "medium";
  } else {
    confidence = "high";
  }

  // ─── 8. Trade gating ───
  // HARD_BLOCK from rugGuard is absolute — no override
  const tradeAllowed = guardResult.allowed && !blockReasons.some(r => r.includes("Honeypot"));

  return {
    safetyScore,
    cautionState,
    confidence,
    checks,
    flags,
    tradeAllowed,
    blockReasons,
    derivedFrom,
    _raw: {
      rugGuard: guardResult,
      advancedRisk: advResult,
      simpleRug: simpleResult,
    },
  };
}

/* ── Convenience: Caution state display helpers ── */

export const CAUTION_COLORS: Record<CautionState, string> = {
  safer: "text-terminal-green border-terminal-green/30 bg-terminal-green/10",
  caution: "text-terminal-amber border-terminal-amber/30 bg-terminal-amber/10",
  high_risk: "text-terminal-red border-terminal-red/30 bg-terminal-red/10",
  critical_risk: "text-terminal-red border-terminal-red/40 bg-terminal-red/15",
};

export const CAUTION_LABELS: Record<CautionState, string> = {
  safer: "SAFER",
  caution: "CAUTION",
  high_risk: "HIGH RISK",
  critical_risk: "CRITICAL RISK",
};

export const CHECK_STATUS_COLORS: Record<CheckStatus, string> = {
  pass: "text-terminal-green",
  fail: "text-terminal-red",
  unknown: "text-terminal-amber",
};

export const CHECK_STATUS_LABELS: Record<CheckStatus, string> = {
  pass: "✓ PASS",
  fail: "✗ FAIL",
  unknown: "⏳ PENDING",
};
