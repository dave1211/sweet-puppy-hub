export type RiskLevel = "low" | "watch" | "high";

export interface RugFlag {
  id: string;
  label: string;
}

export interface RugAssessment {
  level: RiskLevel;
  label: string;
  flags: RugFlag[];
}

interface RugInput {
  liquidity: number;
  volume24h: number;
  change24h: number;
  pairCreatedAt?: number;
  marketCap?: number;
  price?: number;
}

const FLAG_LOW_LIQ = { id: "low-liq", label: "Low Liquidity" };
const FLAG_EXTREME_VOL = { id: "extreme-vol", label: "Extreme Volatility" };
const FLAG_VERY_NEW = { id: "very-new", label: "Very New Pair" };
const FLAG_THIN_ACTIVITY = { id: "thin-activity", label: "Thin Activity" };

export function assessRug(input: RugInput): RugAssessment {
  const flags: RugFlag[] = [];
  if (input.liquidity < 5_000) flags.push(FLAG_LOW_LIQ);
  if (Math.abs(input.change24h) > 50) flags.push(FLAG_EXTREME_VOL);
  if (input.pairCreatedAt) {
    const ageHours = (Date.now() - input.pairCreatedAt) / (1000 * 60 * 60);
    if (ageHours < 2) flags.push(FLAG_VERY_NEW);
  }
  if (input.liquidity > 0 && input.volume24h / input.liquidity < 0.1) flags.push(FLAG_THIN_ACTIVITY);

  let level: RiskLevel = "low";
  if (flags.length >= 3) level = "high";
  else if (flags.length >= 1) level = "watch";

  const labels: Record<RiskLevel, string> = { low: "LOW RISK", watch: "WATCH", high: "HIGH RISK" };
  return { level, label: labels[level], flags };
}

export const riskColors: Record<RiskLevel, string> = {
  low: "bg-terminal-green/10 text-terminal-green border-terminal-green/30",
  watch: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/30",
  high: "bg-terminal-red/15 text-terminal-red border-terminal-red/40",
};