const STORAGE_KEY = "tanner-adaptive-weights";
const OUTCOMES_KEY = "tanner-signal-outcomes";

export interface SignalWeights {
  momentum: number;
  walletCount: number;
  freshness: number;
  liquidity: number;
  sniper: number;
  whale: number;
}

export const DEFAULT_WEIGHTS: SignalWeights = {
  momentum: 1.0,
  walletCount: 1.0,
  freshness: 1.0,
  liquidity: 1.0,
  sniper: 1.0,
  whale: 1.0,
};

export interface TradeOutcome {
  tokenAddress: string;
  pnlPercent: number;
  factors: string[];
  timestamp: number;
}

interface OutcomeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  factorStats: Record<string, { wins: number; total: number }>;
}

const FACTOR_WEIGHT_MAP: Record<string, keyof SignalWeights> = {
  "Strong spike": "momentum",
  "Momentum": "momentum",
  "Uptrend": "momentum",
  "Multi-wallet interest": "walletCount",
  "Cross-wallet activity": "walletCount",
  "Accumulating": "walletCount",
  "Wallet active": "walletCount",
  "Just launched": "freshness",
  "Very new": "freshness",
  "New pair": "freshness",
  "Smart money LIVE": "freshness",
  "Strong liquidity": "liquidity",
  "Low liquidity": "liquidity",
  "Sniper activity": "sniper",
  "Early accumulation": "sniper",
  "Multi-whale convergence": "whale",
  "Whale activity": "whale",
};

export function loadWeights(): SignalWeights {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WEIGHTS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_WEIGHTS };
}

export function saveWeights(w: SignalWeights): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
}

export function resetWeights(): SignalWeights {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(OUTCOMES_KEY);
  return { ...DEFAULT_WEIGHTS };
}

function loadOutcomes(): TradeOutcome[] {
  try {
    const raw = localStorage.getItem(OUTCOMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveOutcomes(outcomes: TradeOutcome[]): void {
  localStorage.setItem(OUTCOMES_KEY, JSON.stringify(outcomes.slice(0, 200)));
}

export function recordOutcome(outcome: TradeOutcome): void {
  const outcomes = [outcome, ...loadOutcomes()];
  saveOutcomes(outcomes);
}

export function getOutcomeStats(): OutcomeStats {
  const outcomes = loadOutcomes();
  const stats: OutcomeStats = {
    totalTrades: outcomes.length,
    wins: 0,
    losses: 0,
    factorStats: {},
  };

  for (const o of outcomes) {
    const isWin = o.pnlPercent > 0;
    if (isWin) stats.wins++;
    else stats.losses++;

    for (const f of o.factors) {
      if (!stats.factorStats[f]) stats.factorStats[f] = { wins: 0, total: 0 };
      stats.factorStats[f].total++;
      if (isWin) stats.factorStats[f].wins++;
    }
  }

  return stats;
}

const LEARNING_RATE = 0.05;
const MIN_WEIGHT = 0.3;
const MAX_WEIGHT = 2.0;
const MIN_SAMPLES = 5;

export function recalculateWeights(): SignalWeights {
  const stats = getOutcomeStats();
  const weights = loadWeights();

  if (stats.totalTrades < MIN_SAMPLES) return weights;

  const overallWinRate = stats.totalTrades > 0 ? stats.wins / stats.totalTrades : 0.5;

  for (const [factor, { wins, total }] of Object.entries(stats.factorStats)) {
    if (total < MIN_SAMPLES) continue;

    const weightKey = FACTOR_WEIGHT_MAP[factor];
    if (!weightKey) continue;

    const factorWinRate = wins / total;
    const delta = (factorWinRate - overallWinRate) * LEARNING_RATE;

    weights[weightKey] = clamp(weights[weightKey] + delta, MIN_WEIGHT, MAX_WEIGHT);
  }

  saveWeights(weights);
  return weights;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function getOutcomes(): TradeOutcome[] {
  return loadOutcomes();
}