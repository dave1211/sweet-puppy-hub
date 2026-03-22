import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type WalletProviderType = "phantom" | "solflare" | null;

interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  provider: WalletProviderType;
  balanceSOL: number | null;
  connect: (provider: WalletProviderType) => void;
  disconnect: () => void;
  signAndSendTransaction: (tx: unknown) => Promise<never>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<WalletProviderType>(null);
  const [balanceSOL, setBalanceSOL] = useState<number | null>(null);

  const connect = useCallback((p: WalletProviderType) => {
    if (!p) return;
    const win = window as any;
    const walletObj =
      p === "phantom" ? win?.solana : p === "solflare" ? win?.solflare : null;

    if (!walletObj) {
      const demoAddr = "DeMo" + "X".repeat(36) + "demo";
      setWalletAddress(demoAddr.slice(0, 44));
      setProvider(p);
      setIsConnected(true);
      setBalanceSOL(0);
      console.warn(`[Wallet] ${p} not detected — using placeholder address`);
      return;
    }

    walletObj
      .connect()
      .then(() => {
        const pubKey: string = walletObj.publicKey?.toString() ?? null;
        if (pubKey) {
          setWalletAddress(pubKey);
          setProvider(p);
          setIsConnected(true);
          setBalanceSOL(null);
          console.info(`[Wallet] Connected via ${p}: ${pubKey.slice(0, 6)}…`);
        }
      })
      .catch((err: unknown) => {
        console.error(`[Wallet] Connection rejected`, err);
      });
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    setProvider(null);
    setBalanceSOL(null);
  }, []);

  const signAndSendTransaction = useCallback(async (_tx: unknown): Promise<never> => {
    throw new Error(
      "[Wallet] signAndSendTransaction is NOT IMPLEMENTED. Live execution is disabled."
    );
  }, []);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        provider,
        balanceSOL,
        connect,
        disconnect,
        signAndSendTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be inside WalletProvider");
  return ctx;
}
