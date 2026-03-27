import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

export type WalletProviderType = "phantom" | "solflare" | "backpack" | null;

export type WalletEnvironment =
  | "phantom_in_app"
  | "other_wallet_browser"
  | "mobile_browser"
  | "desktop_browser"
  | "preview_context";

export interface WalletEnvironmentInfo {
  environment: WalletEnvironment;
  isPreview: boolean;
  isMobile: boolean;
  hasPhantom: boolean;
  hasSolflare: boolean;
  hasBackpack: boolean;
  host: string;
}

type WalletProviderError = Error & { code?: string };

interface WalletPublicKey {
  toString: () => string;
  toBytes: () => Uint8Array;
}

interface WalletConnectResponse {
  publicKey?: WalletPublicKey;
}

interface SolanaWallet {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey: WalletPublicKey | null;
  isConnected: boolean;
  connect: () => Promise<WalletConnectResponse>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (tx: unknown, opts?: unknown) => Promise<{ signature: string }>;
  signTransaction?: (tx: unknown) => Promise<unknown>;
  signMessage?: (msg: Uint8Array) => Promise<{ signature: Uint8Array }>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  off?: (event: string, handler: (...args: unknown[]) => void) => void;
}

interface WalletState {
  isConnected: boolean;
  walletAddress: string | null;
  provider: WalletProviderType;
  balanceSOL: number | null;
  isLoading: boolean;
  connect: (provider: WalletProviderType, options?: { suppressToast?: boolean }) => Promise<string>;
  disconnect: () => void;
  clearWalletSessionState: () => void;
  refreshBalance: () => Promise<void>;
  signAndSendTransaction: (tx: unknown) => Promise<{ signature: string }>;
  getWalletObject: (providerOverride?: WalletProviderType) => SolanaWallet | null;
  probeWalletProviders: () => WalletProviderType[];
  detectWalletEnvironment: () => WalletEnvironmentInfo;
}

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const WALLET_STORAGE_KEY = "tanner_wallet_provider";

const WalletContext = createContext<WalletState | null>(null);

interface WalletWindow extends Window {
  solana?: (SolanaWallet & { providers?: SolanaWallet[] }) | undefined;
  phantom?: { solana?: SolanaWallet };
  solflare?: SolanaWallet;
  backpack?: SolanaWallet;
}

function createWalletProviderError(message: string, code: string): WalletProviderError {
  const error = new Error(message) as WalletProviderError;
  error.code = code;
  return error;
}

function isPreviewHost(host: string): boolean {
  return host.includes("id-preview--") || host.endsWith(".lovable.app");
}

function resolvePhantomProvider(win: WalletWindow): SolanaWallet | null {
  if (win.phantom?.solana?.isPhantom) return win.phantom.solana;

  const injected = win.solana;
  if (injected?.isPhantom) return injected;

  if (Array.isArray(injected?.providers)) {
    const phantomProvider = injected.providers.find((provider) => provider?.isPhantom);
    if (phantomProvider) return phantomProvider;
  }

  return null;
}

function resolveSolflareProvider(win: WalletWindow): SolanaWallet | null {
  if (win.solflare) return win.solflare;

  const injected = win.solana;
  if (injected?.isSolflare) return injected;

  if (Array.isArray(injected?.providers)) {
    const solflareProvider = injected.providers.find((provider) => provider?.isSolflare);
    if (solflareProvider) return solflareProvider;
  }

  return null;
}

function resolveBackpackProvider(win: WalletWindow): SolanaWallet | null {
  if (win.backpack) return win.backpack;
  return null;
}

function getWalletProvider(p: WalletProviderType): SolanaWallet | null {
  if (!p) return null;
  const win = window as unknown as WalletWindow;
  if (p === "phantom") return resolvePhantomProvider(win);
  if (p === "solflare") return resolveSolflareProvider(win);
  if (p === "backpack") return resolveBackpackProvider(win);
  return null;
}

function probeWalletProvidersInternal(): WalletProviderType[] {
  const providers: WalletProviderType[] = [];
  if (getWalletProvider("phantom")) providers.push("phantom");
  if (getWalletProvider("solflare")) providers.push("solflare");
  if (getWalletProvider("backpack")) providers.push("backpack");
  return providers;
}

function detectWalletEnvironmentInternal(): WalletEnvironmentInfo {
  const host = window.location.hostname;
  const ua = navigator.userAgent;
  const isMobile = /android|iphone|ipad|ipod/i.test(ua);
  const isPreview = isPreviewHost(host);
  const hasPhantom = Boolean(getWalletProvider("phantom"));
  const hasSolflare = Boolean(getWalletProvider("solflare"));
  const hasBackpack = Boolean(getWalletProvider("backpack"));
  const hasAnyWallet = hasPhantom || hasSolflare || hasBackpack;

  const phantomUA = /phantom/i.test(ua);
  const walletUA = /solflare|backpack/i.test(ua);

  const environment: WalletEnvironment = isPreview && !hasAnyWallet
    ? "preview_context"
    : phantomUA && hasPhantom
      ? "phantom_in_app"
      : walletUA && hasAnyWallet
        ? "other_wallet_browser"
        : isMobile
          ? "mobile_browser"
          : "desktop_browser";

  return {
    environment,
    isPreview,
    isMobile,
    hasPhantom,
    hasSolflare,
    hasBackpack,
    host,
  };
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
    console.info("[Wallet] Refresh balance", { walletAddress });
    const bal = await fetchSOLBalance(walletAddress);
    setBalanceSOL(bal);
  }, [walletAddress]);

  const clearWalletSessionState = useCallback(() => {
    setIsConnected(false);
    setWalletAddress(null);
    setProvider(null);
    setBalanceSOL(null);
    setIsLoading(false);
    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  // Auto-reconnect on page load if wallet was previously connected in this browser.
  // Wrapped in try-catch to prevent "not authorized" errors on mobile wallet browsers (e.g. Phantom).
  useEffect(() => {
    const savedProvider = localStorage.getItem(WALLET_STORAGE_KEY) as WalletProviderType;
    if (!savedProvider) return;

    try {
      const wallet = getWalletProvider(savedProvider);
      console.info("[Wallet] Reconnect check", {
        provider: savedProvider,
        providerFound: Boolean(wallet),
      });

      if (wallet?.isConnected && wallet?.publicKey) {
        const pubKey = wallet.publicKey.toString();
        setWalletAddress(pubKey);
        setProvider(savedProvider);
        setIsConnected(true);
        fetchSOLBalance(pubKey).then(setBalanceSOL);
        return;
      }
    } catch (err) {
      console.warn("[Wallet] Auto-reconnect failed, clearing saved provider", err);
    }

    localStorage.removeItem(WALLET_STORAGE_KEY);
  }, []);

  // Listen for account changes and disconnects from the active provider.
  useEffect(() => {
    if (!provider) return;
    const wallet = getWalletProvider(provider);
    if (!wallet) return;

    const handleAccountChanged = (publicKey: unknown) => {
      if (publicKey && typeof publicKey === "object" && "toString" in (publicKey as object)) {
        const newAddr = (publicKey as { toString: () => string }).toString();
        console.info("[Wallet] accountChanged", { provider, address: newAddr });
        setWalletAddress(newAddr);
        fetchSOLBalance(newAddr).then(setBalanceSOL);
        toast.info(`Wallet changed: ${newAddr.slice(0, 4)}…${newAddr.slice(-4)}`);
      } else {
        console.info("[Wallet] accountChanged -> disconnected", { provider });
        setIsConnected(false);
        setWalletAddress(null);
        setProvider(null);
        setBalanceSOL(null);
        localStorage.removeItem(WALLET_STORAGE_KEY);
      }
    };

    const handleDisconnect = () => {
      console.info("[Wallet] disconnect event", { provider });
      setIsConnected(false);
      setWalletAddress(null);
      setProvider(null);
      setBalanceSOL(null);
      localStorage.removeItem(WALLET_STORAGE_KEY);
    };

    wallet.on?.("accountChanged", handleAccountChanged);
    wallet.on?.("disconnect", handleDisconnect);

    return () => {
      wallet.off?.("accountChanged", handleAccountChanged);
      wallet.off?.("disconnect", handleDisconnect);
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

  const connect = useCallback(async (p: WalletProviderType, options?: { suppressToast?: boolean }): Promise<string> => {
    if (!p) throw new Error("Wallet provider is required");
    setIsLoading(true);
    console.info("[Wallet] connect start", { provider: p });

    const wallet = getWalletProvider(p);
    if (!wallet) {
      const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
      const message = isMobile
        ? `${p} wallet provider not found. Open Tanner Terminal inside the ${p} wallet app browser.`
        : `${p} wallet extension not detected. Install it from ${p === "phantom" ? "phantom.app" : p === "solflare" ? "solflare.com" : "backpack.app"}.`;

      console.error("[Wallet] provider not found", { provider: p, isMobile });
      setIsLoading(false);
      if (!options?.suppressToast) {
        toast.error(message, { duration: 6000 });
      }
      throw createWalletProviderError(message, "WALLET_PROVIDER_MISSING");
    }

    try {
      const resp = await wallet.connect();
      const pubKey = resp?.publicKey?.toString() ?? wallet.publicKey?.toString();

      if (!pubKey) {
        throw new Error("Wallet connected but no public key was returned");
      }

      setWalletAddress(pubKey);
      setProvider(p);
      setIsConnected(true);
      localStorage.setItem(WALLET_STORAGE_KEY, p);

      const bal = await fetchSOLBalance(pubKey);
      setBalanceSOL(bal);

      console.info("[Wallet] connect success", { provider: p, address: pubKey });
      if (!options?.suppressToast) {
        toast.success(`Connected via ${p}`, {
          description: `${pubKey.slice(0, 6)}…${pubKey.slice(-4)}`,
        });
      }

      return pubKey;
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Wallet connection failed";
      const rejectedByUser = /rejected|denied|cancel|4001|User rejected/i.test(rawMessage);
      const normalizedMessage = rejectedByUser
        ? "Wallet connection was rejected by the user"
        : rawMessage;

      console.error("[Wallet] connect failure", { provider: p, error: rawMessage });
      setIsConnected(false);
      setWalletAddress(null);
      setProvider(null);
      setBalanceSOL(null);
      localStorage.removeItem(WALLET_STORAGE_KEY);

      if (!options?.suppressToast) {
        toast.error(normalizedMessage);
      }
      throw createWalletProviderError(normalizedMessage, rejectedByUser ? "USER_REJECTED_CONNECT" : "WALLET_CONNECT_FAILED");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    console.info("[Wallet] disconnect start", { provider });
    const wallet = getWalletProvider(provider);
    if (wallet) {
      wallet.disconnect().catch((err) => {
        const message = err instanceof Error ? err.message : "Unknown disconnect error";
        console.warn("[Wallet] disconnect provider call failed", { provider, error: message });
      });
    }

    clearWalletSessionState();
    // Also clear zustand wallet store to prevent stale hydration
    sessionStorage.removeItem("tanner-wallet");
    console.info("[Wallet] disconnect complete");
  }, [provider, clearWalletSessionState]);

  const signAndSendTransaction = useCallback(
    async (tx: unknown): Promise<{ signature: string }> => {
      const wallet = getWalletProvider(provider);
      if (!wallet || !isConnected) {
        throw new Error("Wallet not connected");
      }
      console.info("[Wallet] signAndSendTransaction start", { provider, isConnected });
      return wallet.signAndSendTransaction(tx);
    },
    [provider, isConnected]
  );

  const getWalletObject = useCallback((providerOverride?: WalletProviderType) => {
    return getWalletProvider(providerOverride ?? provider);
  }, [provider]);

  const probeWalletProviders = useCallback(() => {
    return probeWalletProvidersInternal();
  }, []);

  const detectWalletEnvironment = useCallback(() => {
    return detectWalletEnvironmentInternal();
  }, []);

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
        clearWalletSessionState,
        refreshBalance,
        signAndSendTransaction,
        getWalletObject,
        probeWalletProviders,
        detectWalletEnvironment,
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
