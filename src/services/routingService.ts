/**
 * Smart routing engine — compares DEX and AMM quotes to find optimal execution path.
 */

import type { TradingPair, RouteQuote, AMMPool } from "@/types/xrpl";

export function computeRoutes(
  pair: TradingPair,
  amount: number,
  side: "buy" | "sell",
  dexPrice: number,
  ammPool: AMMPool | null
): RouteQuote[] {
  const quotes: RouteQuote[] = [];

  // DEX quote
  const dexSlippage = estimateSlippage(amount, 500_000); // mock liquidity
  const dexOutput = side === "buy"
    ? amount / (dexPrice * (1 + dexSlippage / 100))
    : amount * dexPrice * (1 - dexSlippage / 100);

  quotes.push({
    source: "dex",
    inputAmount: amount,
    outputAmount: dexOutput,
    effectivePrice: dexPrice * (1 + (side === "buy" ? 1 : -1) * dexSlippage / 100),
    priceImpact: dexSlippage * 0.8,
    fee: amount * 0.001,
    slippage: dexSlippage,
    isBest: false,
    explanation: `XRPL DEX direct order book — ${dexSlippage.toFixed(2)}% slippage`,
  });

  // AMM quote
  if (ammPool) {
    const ammFeeRate = ammPool.tradingFee / 100_000;
    const ammSlippage = estimateAMMSlippage(amount, ammPool.asset1Balance, ammPool.asset2Balance);
    const ammFee = amount * ammFeeRate;
    const ammOutput = side === "buy"
      ? (amount - ammFee) / (dexPrice * (1 + ammSlippage / 100))
      : (amount - ammFee) * dexPrice * (1 - ammSlippage / 100);

    quotes.push({
      source: "amm",
      inputAmount: amount,
      outputAmount: ammOutput,
      effectivePrice: dexPrice * (1 + (side === "buy" ? 1 : -1) * ammSlippage / 100),
      priceImpact: ammSlippage,
      fee: ammFee,
      slippage: ammSlippage,
      isBest: false,
      explanation: `XRPL AMM pool — ${ammSlippage.toFixed(2)}% impact, ${(ammFeeRate * 100).toFixed(3)}% fee`,
    });

    // Split route if beneficial
    if (quotes.length === 2) {
      const dexOut = quotes[0].outputAmount;
      const ammOut = quotes[1].outputAmount;
      const splitPct = dexOut > ammOut ? { dex: 70, amm: 30 } : { dex: 30, amm: 70 };
      const splitOutput = (dexOut * splitPct.dex + ammOut * splitPct.amm) / 100;
      const avgSlippage = (quotes[0].slippage * splitPct.dex + quotes[1].slippage * splitPct.amm) / 100;

      if (splitOutput > Math.max(dexOut, ammOut) * 0.998) {
        quotes.push({
          source: "split",
          inputAmount: amount,
          outputAmount: splitOutput,
          effectivePrice: amount / splitOutput,
          priceImpact: avgSlippage,
          fee: (quotes[0].fee * splitPct.dex + quotes[1].fee * splitPct.amm) / 100,
          slippage: avgSlippage,
          isBest: false,
          splitPct,
          explanation: `Split ${splitPct.dex}% DEX / ${splitPct.amm}% AMM — optimized execution`,
        });
      }
    }
  }

  // Mark best
  let bestIdx = 0;
  let bestOutput = 0;
  quotes.forEach((q, i) => {
    if (q.outputAmount > bestOutput) {
      bestOutput = q.outputAmount;
      bestIdx = i;
    }
  });
  quotes[bestIdx].isBest = true;

  return quotes;
}

function estimateSlippage(amount: number, liquidity: number): number {
  const ratio = amount / liquidity;
  return Math.min(ratio * 100, 15);
}

function estimateAMMSlippage(amount: number, reserve1: number, reserve2: number): number {
  const totalLiquidity = Math.sqrt(reserve1 * reserve2);
  const ratio = amount / totalLiquidity;
  return Math.min(ratio * 50, 20);
}
