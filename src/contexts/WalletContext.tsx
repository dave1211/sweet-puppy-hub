import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { toast } from "sonner";

type WalletProviderType = "phantom" | "solflare" | null;

interface SolanaWallet {
  publicKey: { toString: () => string; toBytes: () => Uint8Array } | null;
  isConnected: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (tx: unknown, opts?: unknown) => Promise<{ signature: string }>;
  signTransaction: (tx: unknown) => Promise<unknown>;
  signMessage: (msg: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  provider: WalletProviderType;
  balanceSOL: number | null;
  isLoading: boolean;
  connect: (provider: WalletProviderType) => void;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
  getWalletObject: () => SolanaWallet | null;
}

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

const WalletContext = createContext<WalletState | null>(null);

function getWalletProvider(p: WalletProviderType): SolanaWallet | null {
  if (!p) return null;
  const win = window as unknown as Record<string, unknown>;
  if (p === "phantom") return (win.solana as SolanaWallet) ?? null;
  if (p === "solflare") return (win.solflare as SolanaWallet) ?? null;
  return null;
}

async function fetchSOLBalance(address: string): Promise<number> {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return (data.result?.value ?? 0) / 1e9;
  } catch {
    return 0;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<WalletProviderType>(null);
  const [balanceSOL, setBalanceSOL] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!walletAddress) return;
    const bal = await fetchSOLBalance(walletAddress);
    setBalanceSOL(bal);
  }, [walletAddress]);

  // Auto-reconnect on page load if wallet was previously connected
  useEffect(() => {
    const savedProvider = localStorage.getItem("tanner_wallet_provider") as WalletProviderType;
    if (!savedProvider) return;

    const wallet = getWalletProvider(savedProvider);
    if (wallet?.isConnected && wallet?.publicKey) {
      const pubKey = wallet.publicKey.toString();
      setWalletAddress(pubKey);
      setProvider(savedProvider);
      setIsConnected(true);
      fetchSOLBalance(pubKey).then(setBalanceSOL);
    }
  }, []);

  // Listen for account changes and disconnects
  useEffect(() => {
    if (!provider) return;
    const wallet = getWalletProvider(provider);
    if (!wallet) return;

    const handleAccountChanged = (publicKey: unknown) => {
      if (publicKey && typeof publicKey === "object" && "toString" in (publicKey as object)) {
        const newAddr = (publicKey as { toString: () => string }).toString();
        setWalletAddress(newAddr);
        fetchSOLBalance(newAddr).then(setBalanceSOL);
        toast.info(`Wallet changed: ${newAddr.slice(0, 4)}…${newAddr.slice(-4)}`);
      } else {
        // Disconnected
        setIsConnected(false);
        setWalletAddress(null);
        setProvider(null);
        setBalanceSOL(null);
        localStorage.removeItem("tanner_wallet_provider");
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setWalletAddress(null);
      setProvider(null);
      setBalanceSOL(null);
      localStorage.removeItem("tanner_wallet_provider");
    };

    wallet.on("accountChanged", handleAccountChanged);
    wallet.on("disconnect", handleDisconnect);

    return () => {
      wallet.off("accountChanged", handleAccountChanged);
      wallet.off("disconnect", handleDisconnect);
    };
  }, [provider]);

  // Refresh balance periodically
  useEffect(() => {
    if (!walletAddress) return;
    const interval = setInterval(() => {
      fetchSOLBalance(walletAddress).then(setBalanceSOL);
    }, 30_000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const connect = useCallback((p: WalletProviderType) => {
    if (!p) return;
    setIsLoading(true);

    const wallet = getWalletProvider(p);
    if (!wallet) {
      setIsLoading(false);
      toast.error(`${p} wallet not detected`, {
        description: "You're in preview mode — wallet extensions aren't available here. Install the extension in your browser to connect, or explore the app in demo mode.",
        duration: 6000,
      });
      return;
    }

    wallet
      .connect()
      .then((resp) => {
        const pubKey = resp?.publicKey?.toString() ?? wallet.publicKey?.toString();
        if (pubKey) {
          setWalletAddress(pubKey);
          setProvider(p);
          setIsConnected(true);
          localStorage.setItem("tanner_wallet_provider", p);
          fetchSOLBalance(pubKey).then(setBalanceSOL);
          toast.success(`Connected via ${p}`, {
            description: `${pubKey.slice(0, 6)}…${pubKey.slice(-4)}`,
          });
        }
      })
      .catch((err: Error) => {
        console.error(`[Wallet] Connection rejected`, err);
        toast.error("Connection rejected", { description: err.message });
      })
      .finally(() => setIsLoading(false));
  }, []);

  const disconnect = useCallback(() => {
    const wallet = getWalletProvider(provider);
    if (wallet) {
      wallet.disconnect().catch(() => {});
    }
    setIsConnected(false);
    setWalletAddress(null);
    setProvider(null);
    setBalanceSOL(null);
    localStorage.removeItem("tanner_wallet_provider");
    toast.info("Wallet disconnected");
  }, [provider]);

  const signAndSendTransaction = useCallback(
    async (tx: unknown): Promise<{ signature: string }> => {
      const wallet = getWalletProvider(provider);
      if (!wallet || !isConnected) {
        throw new Error("Wallet not connected");
      }
      return wallet.signAndSendTransaction(tx);
    },
    [provider, isConnected]
  );

  const getWalletObject = useCallback(() => {
    return getWalletProvider(provider);
  }, [provider]);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        walletAddress,
        provider,
        balanceSOL,
        isLoading,
        connect,
        disconnect,
        refreshBalance,
        signAndSendTransaction,
        getWalletObject,
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
