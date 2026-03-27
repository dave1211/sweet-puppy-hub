import { useMemo } from "react";
import { useWalletTokens } from "@/hooks/useWalletTokens";
import { useWallet } from "@/contexts/WalletContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import {
  assessPortfolioRisk,
  type PortfolioAssetEntry,
  type PortfolioWalletEntry,
  type PortfolioRiskResult,
} from "@/services/portfolioRiskService";

const STABLECOINS = new Set(["USDC", "USDT", "DAI", "BUSD", "USDH", "PYUSD"]);

export function usePortfolioRisk() {
  const { walletAddress, isConnected } = useWallet();
  const { data: walletData, isLoading } = useWalletTokens();
  const { items: watchlistItems } = useWatchlist();

  const result = useMemo<PortfolioRiskResult | null>(() => {
    if (!isConnected || !walletData) return null;

    const solPrice = 170; // estimated — clearly labeled in evidence

    const assets: PortfolioAssetEntry[] = [];

    // Native SOL
    if (walletData.solBalance > 0) {
      assets.push({
        symbol: "SOL",
        name: "Solana",
        valueUSD: walletData.solBalance * solPrice,
        chain: "solana",
        isStablecoin: false,
        safetyScore: 90, // native asset
      });
    }

    // SPL tokens — valueUSD estimated where price unknown
    for (const token of walletData.tokens) {
      const isStable = STABLECOINS.has(token.symbol.toUpperCase());
      assets.push({
        symbol: token.symbol,
        name: token.name,
        mint: token.mint,
        valueUSD: isStable ? token.balance : 0, // only stablecoins have known value
        chain: "solana",
        isStablecoin: isStable,
        safetyScore: null, // not individually assessed — lowers confidence
      });
    }

    const wallets: PortfolioWalletEntry[] = [];
    if (walletAddress) {
      wallets.push({
        address: walletAddress,
        chain: "solana",
        valueUSD: assets.reduce((s, a) => s + a.valueUSD, 0),
      });
    }

    const watchlistAddresses = watchlistItems.map(w => w.address);

    return assessPortfolioRisk({ assets, wallets, watchlistAddresses });
  }, [isConnected, walletData, walletAddress, watchlistItems]);

  return { risk: result, isLoading };
}
