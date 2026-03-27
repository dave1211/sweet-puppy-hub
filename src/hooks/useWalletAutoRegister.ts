import { useEffect, useRef } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletProfiles } from "@/hooks/useWalletProfiles";

/**
 * Auto-registers the connected wallet as a wallet profile.
 * Must be rendered inside both WalletProvider and AuthProvider.
 */
export function useWalletAutoRegister() {
  const { walletAddress, isConnected } = useWallet();
  const { ensureConnectedWallet } = useWalletProfiles();
  const registeredRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected || !walletAddress) return;
    if (registeredRef.current === walletAddress) return;
    registeredRef.current = walletAddress;
    ensureConnectedWallet(walletAddress);
  }, [isConnected, walletAddress, ensureConnectedWallet]);
}
