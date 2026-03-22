import { ScoredToken } from "@/hooks/useUnifiedSignals";

export type TradeStatus = "ENTERED" | "EXITED";
export type ExitReason = "take_profit" | "stop_loss" | "timeout" | "manual";

export interface SimulatedTrade {
  id: string;
  token: ScoredToken;
  status: TradeStatus;
  entryPrice: number;
  currentPrice: number;
  pnlPercent: number;
  enteredAt: number;
  exitedAt: number | null;
  exitReason: ExitReason | null;
  reasons: string[];
}

export interface SimConfig {
  takeProfitPercent: number;
  stopLossPercent: number;
  timeoutMinutes: number;
  maxConcurrentTrades: number;
  cooldownMinutes: number;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  takeProfitPercent: 20,
  stopLossPercent: -10,
  timeoutMinutes: 30,
  maxConcurrentTrades: 3,
  cooldownMinutes: 10,
};

export function createTrade(token: ScoredToken, reasons: string[]): SimulatedTrade {
  return { id: `${token.address}-${Date.now()}`, token, status: "ENTERED", entryPrice: token.price, currentPrice: token.price, pnlPercent: 0, enteredAt: Date.now(), exitedAt: null, exitReason: null, reasons };
}

export function updateTradePrice(trade: SimulatedTrade, currentPrice: number): SimulatedTrade {
  if (trade.status === "EXITED") return trade;
  const pnlPercent = trade.entryPrice > 0 ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100 : 0;
  return { ...trade, currentPrice, pnlPercent };
}

export function checkExitConditions(trade: SimulatedTrade, config: SimConfig): ExitReason | null {
  if (trade.status === "EXITED") return null;
  if (trade.pnlPercent >= config.takeProfitPercent) return "take_profit";
  if (trade.pnlPercent <= config.stopLossPercent) return "stop_loss";
  const elapsed = (Date.now() - trade.enteredAt) / (1000 * 60);
  if (elapsed >= config.timeoutMinutes) return "timeout";
  return null;
}

export function exitTrade(trade: SimulatedTrade, reason: ExitReason): SimulatedTrade {
  return { ...trade, status: "EXITED", exitedAt: Date.now(), exitReason: reason };
}

export function canEnterTrade(tokenAddress: string, activeTrades: SimulatedTrade[], cooldowns: Record<string, number>, config: SimConfig): { allowed: boolean; reason?: string } {
  const openCount = activeTrades.filter((t) => t.status === "ENTERED").length;
  if (openCount >= config.maxConcurrentTrades) return { allowed: false, reason: `Max ${config.maxConcurrentTrades} open trades` };
  const alreadyOpen = activeTrades.some((t) => t.token.address === tokenAddress && t.status === "ENTERED");
  if (alreadyOpen) return { allowed: false, reason: "Already in active trade" };
  const lastExit = cooldowns[tokenAddress] ?? 0;
  const cooldownMs = config.cooldownMinutes * 60 * 1000;
  if (Date.now() - lastExit < cooldownMs) {
    const remaining = Math.ceil((cooldownMs - (Date.now() - lastExit)) / (1000 * 60));
    return { allowed: false, reason: `Cooldown ${remaining}m remaining` };
  }
  return { allowed: true };
}