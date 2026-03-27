/**
 * useOnChainSafety — React hook that fetches on-chain verification data
 * and produces a full TokenSafetyResult by combining on-chain + market data.
 *
 * RULES:
 *   - RPC failure → UNKNOWN/PENDING (never PASS)
 *   - No fake data
 *   - Composes with existing tokenSafetyService
 */

import { useQuery } from "@tanstack/react-query";
import { verifyTokenOnChain, type OnChainTokenData } from "@/services/onChainVerification";
import { assessTokenSafety, type TokenSafetyResult, type TokenSafetyInput } from "@/services/tokenSafetyService";

export interface OnChainSafetyResult {
  safety: TokenSafetyResult | null;
  onChain: OnChainTokenData | null;
  isVerifying: boolean;
  verificationErrors: string[];
}

/**
 * Fetches on-chain token data and merges with market data to produce
 * a unified safety assessment.
 */
export function useOnChainSafety(
  tokenAddress: string | null,
  marketData?: {
    liquidity?: number;
    volume24h?: number;
    change24h?: number;
    pairCreatedAt?: number;
    marketCap?: number;
    buyCount24h?: number;
    sellCount24h?: number;
    txCount24h?: number;
    lpLocked?: boolean | null;
  }
): OnChainSafetyResult {
  const {
    data: onChain,
    isLoading: isVerifying,
  } = useQuery<OnChainTokenData | null>({
    queryKey: ["on-chain-verify", tokenAddress],
    queryFn: async () => {
      if (!tokenAddress) return null;
      return verifyTokenOnChain(tokenAddress);
    },
    enabled: !!tokenAddress,
    staleTime: 60_000,       // Cache for 1 min (on-chain data doesn't change fast)
    refetchInterval: 120_000, // Re-verify every 2 min
    retry: 1,
    retryDelay: 3000,
    refetchOnWindowFocus: false,
  });

  // Merge on-chain data with market data into safety input
  const safety: TokenSafetyResult | null = (() => {
    if (!tokenAddress) return null;

    const input: TokenSafetyInput = {
      liquidity: marketData?.liquidity ?? 0,
      volume24h: marketData?.volume24h ?? 0,
      change24h: marketData?.change24h ?? 0,
      pairCreatedAt: marketData?.pairCreatedAt,
      marketCap: marketData?.marketCap,
      buyCount24h: marketData?.buyCount24h,
      sellCount24h: marketData?.sellCount24h,
      txCount24h: marketData?.txCount24h,
      lpLocked: marketData?.lpLocked ?? null,
      // On-chain data replaces scaffolded nulls when available
      mintAuthorityRevoked: onChain?.mintAuthorityRevoked ?? null,
      freezeAuthorityRevoked: onChain?.freezeAuthorityRevoked ?? null,
      topHolderPct: onChain?.topHolderPct ?? undefined,
      holders: onChain?.holders ?? undefined,
      // These remain null until we have honeypot/contract verification
      isHoneypot: null,
      contractVerified: onChain?.hasMetadata ?? null,
    };

    return assessTokenSafety(input);
  })();

  return {
    safety,
    onChain: onChain ?? null,
    isVerifying,
    verificationErrors: onChain?.errors ?? [],
  };
}
