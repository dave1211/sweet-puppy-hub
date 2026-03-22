import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const SOL_MINT = "So11111111111111111111111111111111111111112";

export interface JupiterQuote { inputMint: string; outputMint: string; inAmount: string; outAmount: string; otherAmountThreshold: string; priceImpactPct: string; slippageBps: number; routePlan: Array<{ swapInfo: { ammKey: string; label: string; inputMint: string; outputMint: string; inAmount: string; outAmount: string; feeAmount: string; feeMint: string }; percent: number }>; }
export interface SwapPreview { quote: JupiterQuote; inputAmountSOL: number; outputAmount: number; outputDecimals: number; priceImpact: number; slippageBps: number; route: string[]; minimumReceived: number; }
export interface SwapTransaction { swapTransaction: string; lastValidBlockHeight: number; quote: JupiterQuote; }

export function useJupiterSwap() {
  const [isQuoting, setIsQuoting] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [preview, setPreview] = useState<SwapPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (tokenAddress: string, amountSOL: number, slippageBps = 50): Promise<SwapPreview | null> => {
    setIsQuoting(true); setError(null); setPreview(null);
    try {
      const lamports = Math.round(amountSOL * 1e9);
      const { data, error: fnError } = await supabase.functions.invoke("jupiter-swap", { body: { action: "quote", inputMint: SOL_MINT, outputMint: tokenAddress, amount: lamports, slippageBps } });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const quote = data as JupiterQuote;
      const outAmount = parseInt(quote.outAmount, 10);
      const outputDecimals = 6;
      const outputAmount = outAmount / 10 ** outputDecimals;
      const minimumReceived = parseInt(quote.otherAmountThreshold, 10) / 10 ** outputDecimals;
      const routeLabels = quote.routePlan?.map((r) => r.swapInfo?.label || "Unknown") ?? [];
      const result: SwapPreview = { quote, inputAmountSOL: amountSOL, outputAmount, outputDecimals, priceImpact: parseFloat(quote.priceImpactPct || "0"), slippageBps, route: routeLabels, minimumReceived };
      setPreview(result);
      return result;
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Quote failed"); return null; }
    finally { setIsQuoting(false); }
  }, []);

  const buildSwapTransaction = useCallback(async (tokenAddress: string, amountSOL: number, userPublicKey: string, slippageBps = 50): Promise<SwapTransaction | null> => {
    setIsBuilding(true); setError(null);
    try {
      const lamports = Math.round(amountSOL * 1e9);
      const { data, error: fnError } = await supabase.functions.invoke("jupiter-swap", { body: { action: "swap", inputMint: SOL_MINT, outputMint: tokenAddress, amount: lamports, slippageBps, userPublicKey } });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      return data as SwapTransaction;
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Swap build failed"); return null; }
    finally { setIsBuilding(false); }
  }, []);

  const clearPreview = useCallback(() => { setPreview(null); setError(null); }, []);
  return { getQuote, buildSwapTransaction, clearPreview, preview, isQuoting, isBuilding, error };
}