import { useMemo } from "react";
import { useWalletTokens } from "./useWalletTokens";
import { computePositionSizing, type PositionSizingResult } from "@/services/positionSizingService";

const STABLECOINS = new Set(["USDC", "USDT", "BUSD", "DAI", "USDH", "UXD"]);

/**
 * Returns position sizing guidance for a prospective trade.
 * tradeAmountUSD=0 gives baseline guidance (suggested max).
 */
export function usePositionSizing(
  tokenMint: string | null,
  tradeAmountUSD: number,
  opts?: {
    safetyScore?: number | null;
    liquidityUSD?: number | null;
    volume24hUSD?: number | null;
    tokenSymbol?: string;
  }
): PositionSizingResult | null {
  const { data: walletData } = useWalletTokens();

  return useMemo(() => {
    if (!walletData) return null;

    const totalValue = walletData.solBalance * 150 + // rough SOL price estimate
      walletData.tokens.reduce((s, t) => {
        if (STABLECOINS.has(t.symbol.toUpperCase())) return s + t.balance;
        return s; // non-stablecoin SPL tokens need price feed — don't fabricate
      }, 0);

    if (totalValue <= 0) return null;

    // Current token holding
    const held = walletData.tokens.find(t => t.mint === tokenMint);
    const heldValue = held && STABLECOINS.has(held.symbol.toUpperCase())
      ? held.balance
      : 0; // can't price non-stables without feed
    const currentTokenPct = totalValue > 0 ? (heldValue / totalValue) * 100 : 0;

    // Top concentration
    const allValues = walletData.tokens.map(t =>
      STABLECOINS.has(t.symbol.toUpperCase()) ? t.balance : 0
    );
    allValues.push(walletData.solBalance * 150);
    const topValue = Math.max(...allValues, 0);
    const currentTopConcentrationPct = totalValue > 0 ? (topValue / totalValue) * 100 : 0;

    const symbol = opts?.tokenSymbol?.toUpperCase() ?? "";

    return computePositionSizing({
      portfolioValueUSD: totalValue,
      currentTokenPct,
      currentTopConcentrationPct,
      tradeAmountUSD,
      safetyScore: opts?.safetyScore ?? null,
      liquidityUSD: opts?.liquidityUSD ?? null,
      isStablecoin: STABLECOINS.has(symbol),
      volume24hUSD: opts?.volume24hUSD ?? null,
    });
  }, [walletData, tokenMint, tradeAmountUSD, opts?.safetyScore, opts?.liquidityUSD, opts?.volume24hUSD, opts?.tokenSymbol]);
}
