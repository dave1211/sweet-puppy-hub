export type GuardSeverity = "HARD_BLOCK" | "SOFT_WARNING";

export interface RugGuardFlag {
  id: string;
  label: string;
  severity: GuardSeverity;
  detail: string;
}

export interface RugGuardResult {
  allowed: boolean;
  riskLevel: "SAFE" | "CAUTION" | "DANGEROUS" | "BLOCKED";
  flags: RugGuardFlag[];
  hardBlocks: RugGuardFlag[];
  softWarnings: RugGuardFlag[];
  overridable: boolean;
}

export interface RugGuardInput {
  liquidity: number;
  volume24h: number;
  change24h: number;
  pairCreatedAt?: number;
  topHolderPct?: number;
  lpLocked?: boolean | null;
  marketCap?: number;
}

export interface RugGuardConfig {
  minLiquidity: number;
  minAgeMinutes: number;
  maxVolatility: number;
  minVolume: number;
  warnLiquidity: number;
  warnAgeMinutes: number;
  warnVolatility: number;
  maxDevWalletPct: number;
  allowOverride: boolean;
}

export const DEFAULT_GUARD_CONFIG: RugGuardConfig = {
  minLiquidity: 2_000,
  minAgeMinutes: 5,
  maxVolatility: 80,
  minVolume: 100,
  warnLiquidity: 10_000,
  warnAgeMinutes: 30,
  warnVolatility: 50,
  maxDevWalletPct: 30,
  allowOverride: true,
};

let config: RugGuardConfig = { ...DEFAULT_GUARD_CONFIG };

export function getGuardConfig(): RugGuardConfig { return { ...config }; }
export function updateGuardConfig(updates: Partial<RugGuardConfig>): RugGuardConfig { config = { ...config, ...updates }; return { ...config }; }
export function resetGuardConfig(): RugGuardConfig { config = { ...DEFAULT_GUARD_CONFIG }; return { ...config }; }

export function runRugGuard(input: RugGuardInput): RugGuardResult {
  const flags: RugGuardFlag[] = [];

  if (input.liquidity < config.minLiquidity) {
    flags.push({ id: "hard-low-liq", label: "Critically Low Liquidity", severity: "HARD_BLOCK", detail: `Liquidity $${input.liquidity.toLocaleString()} is below minimum $${config.minLiquidity.toLocaleString()}` });
  }
  if (input.pairCreatedAt) {
    const ageMin = (Date.now() - input.pairCreatedAt) / (1000 * 60);
    if (ageMin < config.minAgeMinutes) {
      flags.push({ id: "hard-too-new", label: "Token Too New", severity: "HARD_BLOCK", detail: `Token is ${Math.floor(ageMin)}min old, minimum is ${config.minAgeMinutes}min` });
    }
  }
  if (Math.abs(input.change24h) > config.maxVolatility) {
    flags.push({ id: "hard-extreme-vol", label: "Extreme Volatility", severity: "HARD_BLOCK", detail: `24h change ${input.change24h.toFixed(1)}% exceeds ±${config.maxVolatility}% limit` });
  }
  if (input.volume24h < config.minVolume) {
    flags.push({ id: "hard-no-vol", label: "No Volume", severity: "HARD_BLOCK", detail: `24h volume $${input.volume24h.toFixed(0)} is below minimum $${config.minVolume}` });
  }
  if (input.liquidity >= config.minLiquidity && input.liquidity < config.warnLiquidity) {
    flags.push({ id: "warn-low-liq", label: "Low Liquidity", severity: "SOFT_WARNING", detail: `Liquidity $${input.liquidity.toLocaleString()} is below recommended $${config.warnLiquidity.toLocaleString()}` });
  }
  if (input.pairCreatedAt) {
    const ageMin = (Date.now() - input.pairCreatedAt) / (1000 * 60);
    if (ageMin >= config.minAgeMinutes && ageMin < config.warnAgeMinutes) {
      flags.push({ id: "warn-new-token", label: "Very New Token", severity: "SOFT_WARNING", detail: `Token is only ${Math.floor(ageMin)}min old` });
    }
  }
  if (Math.abs(input.change24h) > config.warnVolatility && Math.abs(input.change24h) <= config.maxVolatility) {
    flags.push({ id: "warn-volatile", label: "High Volatility", severity: "SOFT_WARNING", detail: `24h change of ${input.change24h.toFixed(1)}% indicates high risk` });
  }
  if (input.topHolderPct != null && input.topHolderPct > config.maxDevWalletPct) {
    flags.push({ id: "warn-dev-wallet", label: "Dev Wallet Concentration", severity: "SOFT_WARNING", detail: `Top holder owns ${input.topHolderPct.toFixed(1)}% of supply (threshold: ${config.maxDevWalletPct}%)` });
  }
  if (input.lpLocked === false) {
    flags.push({ id: "warn-lp-unlocked", label: "LP Not Locked", severity: "SOFT_WARNING", detail: "Liquidity pool is not locked — rug pull risk is elevated" });
  } else if (input.lpLocked == null) {
    flags.push({ id: "warn-lp-unknown", label: "LP Lock Unknown", severity: "SOFT_WARNING", detail: "Unable to verify if liquidity pool is locked" });
  }

  const hardBlocks = flags.filter((f) => f.severity === "HARD_BLOCK");
  const softWarnings = flags.filter((f) => f.severity === "SOFT_WARNING");

  let riskLevel: RugGuardResult["riskLevel"];
  if (hardBlocks.length > 0) riskLevel = "BLOCKED";
  else if (softWarnings.length >= 3) riskLevel = "DANGEROUS";
  else if (softWarnings.length >= 1) riskLevel = "CAUTION";
  else riskLevel = "SAFE";

  return { allowed: hardBlocks.length === 0, riskLevel, flags, hardBlocks, softWarnings, overridable: hardBlocks.length === 0 && config.allowOverride };
}