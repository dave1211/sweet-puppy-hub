import { runRugGuard, RugGuardInput, RugGuardResult } from "./rugGuard";

export type ExecutionMode = "SIMULATION" | "LIVE";
export type ExecutionType = "SNIPER" | "COPY";
export type ExecutionAction = "BUY" | "SELL";

export interface ExecutionRequest {
  mode: ExecutionMode;
  type: ExecutionType;
  action: ExecutionAction;
  tokenAddress: string;
  amountSOL: number;
  source: string;
  meta?: Record<string, unknown>;
  rugGuardInput?: RugGuardInput;
  rugOverride?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  tradeId: string;
  simulatedPrice: number | null;
  txHash: string | null;
  mode: ExecutionMode;
  warning?: string;
}

export interface ExecutionLogEntry {
  id: string;
  timestamp: number;
  request: ExecutionRequest;
  result: ExecutionResult;
}

export interface ExecutionSafeguards {
  maxTradeSOL: number;
  maxDailyTrades: number;
  emergencyStop: boolean;
  liveEnabled: boolean;
  walletConnected: boolean;
  userConfirmed: boolean;
}

export const DEFAULT_SAFEGUARDS: ExecutionSafeguards = {
  maxTradeSOL: 0.1,
  maxDailyTrades: 10,
  emergencyStop: false,
  liveEnabled: false,
  walletConnected: false,
  userConfirmed: false,
};

let logs: ExecutionLogEntry[] = [];
let safeguards: ExecutionSafeguards = { ...DEFAULT_SAFEGUARDS };
let dailyTradeCount = 0;
let dailyResetTime = Date.now();

function resetDailyIfNeeded(): void {
  if (Date.now() - dailyResetTime > 24 * 60 * 60 * 1000) {
    dailyTradeCount = 0;
    dailyResetTime = Date.now();
  }
}

function generateId(): string {
  return `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function simulatePrice(): number {
  return +(Math.random() * 0.01 + 0.0001).toFixed(8);
}

interface SafeguardCheck {
  allowed: boolean;
  reason?: string;
  rugGuardResult?: RugGuardResult;
}

function checkSafeguards(request: ExecutionRequest): SafeguardCheck {
  if (safeguards.emergencyStop) {
    return { allowed: false, reason: "Emergency stop is active" };
  }
  if (request.amountSOL > safeguards.maxTradeSOL) {
    return { allowed: false, reason: `Trade size ${request.amountSOL} SOL exceeds max ${safeguards.maxTradeSOL} SOL` };
  }
  resetDailyIfNeeded();
  if (dailyTradeCount >= safeguards.maxDailyTrades) {
    return { allowed: false, reason: `Daily trade limit reached (${safeguards.maxDailyTrades})` };
  }
  if (request.mode === "LIVE") {
    if (!safeguards.liveEnabled) return { allowed: false, reason: "Live mode is not enabled" };
    if (!safeguards.walletConnected) return { allowed: false, reason: "No wallet connected" };
    if (!safeguards.userConfirmed) return { allowed: false, reason: "User has not confirmed live trading" };
  }
  if (request.action === "BUY" && request.rugGuardInput) {
    const guard = runRugGuard(request.rugGuardInput);
    if (!guard.allowed) {
      return { allowed: false, reason: `Rug Guard BLOCKED: ${guard.hardBlocks.map((f) => f.label).join(", ")}`, rugGuardResult: guard };
    }
    if (request.mode === "LIVE" && guard.softWarnings.length > 0 && !request.rugOverride) {
      return { allowed: false, reason: `Rug Guard WARNING (override required): ${guard.softWarnings.map((f) => f.label).join(", ")}`, rugGuardResult: guard };
    }
    return { allowed: true, rugGuardResult: guard };
  }
  return { allowed: true };
}

function executeLiveTrade(_request: ExecutionRequest): { success: boolean; txHash: string | null; price: number | null; error?: string } {
  console.warn("[ExecutionEngine] Jupiter adapter called but not implemented");
  return { success: false, txHash: null, price: null, error: "Jupiter trade adapter not yet connected" };
}

export function executeTrade(request: ExecutionRequest): ExecutionResult {
  const tradeId = generateId();
  const check = checkSafeguards(request);
  if (!check.allowed) {
    const result: ExecutionResult = { success: false, tradeId, simulatedPrice: null, txHash: null, mode: request.mode, warning: check.reason };
    logExecution(request, result);
    return result;
  }
  if (request.mode === "SIMULATION") {
    const price = simulatePrice();
    const result: ExecutionResult = { success: true, tradeId, simulatedPrice: price, txHash: null, mode: "SIMULATION" };
    dailyTradeCount++;
    logExecution(request, result);
    return result;
  }
  const liveResult = executeLiveTrade(request);
  const result: ExecutionResult = { success: liveResult.success, tradeId, simulatedPrice: liveResult.price, txHash: liveResult.txHash, mode: "LIVE", warning: liveResult.error };
  if (liveResult.success) dailyTradeCount++;
  logExecution(request, result);
  return result;
}

export function getSafeguards(): ExecutionSafeguards { return { ...safeguards }; }
export function updateSafeguards(updates: Partial<ExecutionSafeguards>): ExecutionSafeguards { safeguards = { ...safeguards, ...updates }; return { ...safeguards }; }
export function triggerEmergencyStop(): void { safeguards.emergencyStop = true; safeguards.liveEnabled = false; safeguards.userConfirmed = false; }
export function resetSafeguards(): void { safeguards = { ...DEFAULT_SAFEGUARDS }; dailyTradeCount = 0; }
export function getDailyTradeCount(): number { resetDailyIfNeeded(); return dailyTradeCount; }

function logExecution(request: ExecutionRequest, result: ExecutionResult): void {
  logs = [{ id: result.tradeId, timestamp: Date.now(), request, result }, ...logs].slice(0, 500);
}

export function getExecutionLogs(): ExecutionLogEntry[] { return logs; }
export function clearExecutionLogs(): void { logs = []; }