import { useMemo } from "react";
import { TokenPriceMap } from "./useTokenPrices";

export type SignalType = "early" | "momentum" | "spike" | "watch" | "volatile" | null;

export interface TokenSignal {
  address: string;
  signal: SignalType;
  label: string;
  strength: number;
}

export function useTokenSignals(
  prices: TokenPriceMap | undefined,
  volumeData?: Record<string, number>
): Record<string, TokenSignal> {
  return useMemo(() => {
    if (!prices) return {};
    const signals: Record<string, TokenSignal> = {};

    for (const [addr, data] of Object.entries(prices)) {
      const absChange = Math.abs(data.change24h);
      let signal: SignalType = null;
      let label = "";
      let strength = 0;

      if (absChange >= 25) { signal = "spike"; label = "🔥 Spike"; strength = Math.min(100, absChange); }
      else if (data.change24h >= 10) { signal = "momentum"; label = "↑ Momentum"; strength = Math.min(80, data.change24h * 2); }
      else if (data.change24h <= -10) { signal = "volatile"; label = "⚠ Volatile"; strength = Math.min(70, absChange); }
      else if (absChange >= 5) { signal = "watch"; label = "👁 Watch"; strength = Math.min(50, absChange * 2); }

      if (signal) signals[addr] = { address: addr, signal, label, strength };
    }
    return signals;
  }, [prices, volumeData]);
}

export function classifyLaunchSignal(token: {
  price: number; change24h: number; volume24h: number; liquidity: number; pairCreatedAt: number;
}): { signal: SignalType; label: string; strength: number } {
  const ageHours = (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60);
  const absChange = Math.abs(token.change24h);

  if (ageHours < 24 && token.change24h > 5) return { signal: "early", label: "⚡ Early", strength: Math.min(100, 80 + token.change24h) };
  if (absChange >= 25) return { signal: "spike", label: "🔥 Spike", strength: Math.min(100, absChange) };
  if (token.change24h >= 10) return { signal: "momentum", label: "↑ Momentum", strength: Math.min(80, token.change24h * 2) };
  if (ageHours < 48) return { signal: "early", label: "⚡ Early", strength: 40 };
  return { signal: "watch", label: "👁 Watch", strength: 20 };
}