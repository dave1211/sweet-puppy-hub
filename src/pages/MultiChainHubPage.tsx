import { useState, lazy, Suspense } from "react";
import {
  Globe, Wifi, WifiOff, Shield, TrendingUp, ArrowRightLeft,
  Plus, X, Loader2, RefreshCw, Eye, ExternalLink, Activity
} from "lucide-react";
import { ACTIVE_CHAINS, COMPLIANCE_CHAINS, getChainConfig } from "@/lib/multichain";
import type { ChainId, ChainBalance, ChainConfig } from "@/lib/multichain";
import { useMultiChainPortfolio, useMultiChainWallets, useChainStatus } from "@/hooks/useMultiChain";
import { useWallet } from "@/contexts/WalletContext";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { WidgetErrorBoundary } from "@/components/shared/WidgetErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Lazy-load bridge panel — never blocks hub boot
const BridgePanel = lazy(() =>
  import("@/components/bridge/XRPBridgePanel").then(m => ({ default: m.XRPBridgePanel }))
);

type FilterKey = "all" | "compliance" | ChainId;

const FILTER_OPTIONS: { key: FilterKey; label: string; icon?: string }[] = [
  { key: "all", label: "ALL" },
  { key: "compliance", label: "COMPLIANCE" },
  ...ACTIVE_CHAINS.map(c => ({ key: c.id as FilterKey, label: c.symbol, icon: c.icon })),
];

/* ───── small sub-components ───── */

function NetworkStatusDot({ chainId }: { chainId: ChainId }) {
  const { data: status, isLoading } = useChainStatus(chainId);
  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  return status?.connected
    ? <Wifi className="h-3 w-3 text-terminal-green" />
    : <WifiOff className="h-3 w-3 text-destructive" />;
}

function ExplorerLink({ config, address }: { config: ChainConfig; address?: string }) {
  if (!address) return null;
  const url = `${config.explorerUrl}${config.explorerAddressPath}${address}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
    >
      <ExternalLink className="h-2.5 w-2.5" /> Explorer
    </a>
  );
}

function ChainBalanceCard({ chain, balance, address }: {
  chain: ChainConfig;
  balance?: ChainBalance;
  address?: string;
}) {
  const hasBalance = balance && balance.nativeBalance > 0;
  const caps = chain.capabilities;

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{chain.icon}</span>
          <div>
            <p className="text-xs font-mono font-bold text-foreground">{chain.name}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{chain.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {chain.isCompliance && <Shield className="h-3 w-3 text-terminal-cyan" />}
          <NetworkStatusDot chainId={chain.id} />
        </div>
      </div>

      {hasBalance ? (
        <div className="space-y-1">
          <p className="text-sm font-mono font-bold text-foreground tabular-nums">
            {balance.nativeBalance.toFixed(balance.nativeBalance < 1 ? 6 : 4)} {chain.symbol}
          </p>
          {balance.nativeValueUSD > 0 && (
            <p className="text-[10px] font-mono text-muted-foreground tabular-nums">
              ≈ ${balance.nativeValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
          )}
          {caps.supportsTokens && balance.tokens.length > 0 && (
            <p className="text-[9px] font-mono text-muted-foreground">
              +{balance.tokens.length} token{balance.tokens.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] font-mono text-muted-foreground/50">
          {address ? "Loading…" : "No wallet connected"}
        </p>
      )}

      {/* Capability badges + explorer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1">
          {caps.supportsTokens && <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground">TOKENS</span>}
          {caps.supportsHistory && <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground">HISTORY</span>}
          {caps.supportsTransfers && <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground">TX</span>}
        </div>
        <ExplorerLink config={chain} address={address} />
      </div>
    </div>
  );
}

function WalletAddressInput({ chainId, currentAddress, onSet }: {
  chainId: ChainId;
  currentAddress?: string;
  onSet: (chainId: ChainId, address: string | null) => void;
}) {
  const [value, setValue] = useState(currentAddress ?? "");
  const [editing, setEditing] = useState(!currentAddress);
  const config = getChainConfig(chainId);

  if (!editing && currentAddress) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-3 rounded border border-border/30 bg-muted/10">
        <span className="text-sm">{config.icon}</span>
        <span className="text-[10px] font-mono text-foreground truncate flex-1">{currentAddress}</span>
        <button onClick={() => setEditing(true)} className="text-[9px] font-mono text-primary hover:underline">EDIT</button>
        <button onClick={() => { onSet(chainId, null); setValue(""); }} className="text-muted-foreground hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm shrink-0">{config.icon}</span>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`${config.name} address…`}
        className="h-7 text-[10px] font-mono bg-muted/20 border-border/30"
      />
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-[9px] font-mono px-2"
        disabled={!value.trim()}
        onClick={() => {
          if (value.trim()) {
            onSet(chainId, value.trim());
            setEditing(false);
          }
        }}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

/* ───── main page ───── */

export default function MultiChainHubPage() {
  const { wallets, setWallet } = useMultiChainWallets();
  const { walletAddress: solanaWallet } = useWallet();
  const [filter, setFilter] = useState<FilterKey>("all");

  // Auto-include connected Solana wallet
  const effectiveWallets = { ...wallets };
  if (solanaWallet && !effectiveWallets.solana) {
    effectiveWallets.solana = solanaWallet;
  }

  const { data: portfolio, isLoading, refetch } = useMultiChainPortfolio(effectiveWallets);

  // Derive visible chains from filter
  const displayChains: ChainConfig[] =
    filter === "all" ? ACTIVE_CHAINS
    : filter === "compliance" ? COMPLIANCE_CHAINS
    : ACTIVE_CHAINS.filter(c => c.id === filter);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            MULTI-CHAIN HUB
          </h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
            Unified portfolio across {ACTIVE_CHAINS.length} networks
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[9px] font-mono px-2"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} />
          REFRESH
        </Button>
      </div>

      {/* Network selector bar */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => setFilter(opt.key)}
            className={cn(
              "px-2 py-1 rounded text-[9px] font-mono border transition-colors",
              filter === opt.key
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-card/30 border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {opt.icon && <span className="mr-1">{opt.icon}</span>}
            {opt.label}
          </button>
        ))}
      </div>

      {/* Total Portfolio Value */}
      <WidgetErrorBoundary name="Portfolio Total">
        <PanelShell title="TOTAL PORTFOLIO VALUE" subtitle={`Across ${Object.keys(effectiveWallets).length} chain${Object.keys(effectiveWallets).length !== 1 ? "s" : ""}`}>
          <div className="flex items-baseline gap-3 py-2">
            <span className="text-2xl font-mono font-bold text-foreground tabular-nums">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary inline" />
              ) : portfolio ? (
                `$${portfolio.totalValueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              ) : (
                "$0.00"
              )}
            </span>
            {portfolio && portfolio.chains.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {portfolio.chains.length} chain{portfolio.chains.length !== 1 ? "s" : ""} active
              </span>
            )}
          </div>
        </PanelShell>
      </WidgetErrorBoundary>

      {/* Main content tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start">
          <TabsTrigger value="overview" className="text-[10px] font-mono">
            <TrendingUp className="h-3 w-3 mr-1" /> OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-[10px] font-mono">
            <Activity className="h-3 w-3 mr-1" /> ACTIVITY
          </TabsTrigger>
          <TabsTrigger value="wallets" className="text-[10px] font-mono">
            <Eye className="h-3 w-3 mr-1" /> WALLETS
          </TabsTrigger>
          <TabsTrigger value="bridge" className="text-[10px] font-mono">
            <ArrowRightLeft className="h-3 w-3 mr-1" /> BRIDGE
          </TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayChains.map(chain => {
              const balance = portfolio?.chains.find(c => c.chainId === chain.id);
              return (
                <WidgetErrorBoundary key={chain.id} name={chain.name}>
                  <ChainBalanceCard
                    chain={chain}
                    balance={balance}
                    address={effectiveWallets[chain.id]}
                  />
                </WidgetErrorBoundary>
              );
            })}
          </div>

          {/* Per-chain token breakdown */}
          {portfolio?.chains.some(c => c.tokens.length > 0) && (
            <div className="mt-4 space-y-3">
              {portfolio.chains
                .filter(c => c.tokens.length > 0 && displayChains.some(dc => dc.id === c.chainId))
                .map(c => {
                  const config = getChainConfig(c.chainId);
                  return (
                    <WidgetErrorBoundary key={c.chainId} name={`${config.name} Tokens`}>
                      <PanelShell title={`${config.name} TOKENS`} subtitle={`${c.tokens.length} asset${c.tokens.length !== 1 ? "s" : ""}`}>
                        <div className="divide-y divide-border/30 max-h-48 overflow-y-auto">
                          {c.tokens.map((t, i) => (
                            <div key={`${t.symbol}-${i}`} className="flex justify-between items-center py-2 px-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-mono font-medium text-foreground truncate">{t.symbol}</span>
                                {t.isCompliance && <Shield className="h-2.5 w-2.5 text-terminal-cyan shrink-0" />}
                              </div>
                              <div className="text-right shrink-0 ml-2">
                                <p className="text-[10px] font-mono text-foreground tabular-nums">{t.balance.toFixed(4)}</p>
                                {t.valueUSD > 0 && (
                                  <p className="text-[9px] font-mono text-muted-foreground tabular-nums">
                                    ${t.valueUSD.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </PanelShell>
                    </WidgetErrorBoundary>
                  );
                })}
            </div>
          )}
        </TabsContent>

        {/* Activity tab — shows per-chain network info */}
        <TabsContent value="activity" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayChains.map(chain => (
              <WidgetErrorBoundary key={chain.id} name={`${chain.name} Status`}>
                <ChainStatusCard chainId={chain.id} config={chain} address={effectiveWallets[chain.id]} />
              </WidgetErrorBoundary>
            ))}
          </div>
        </TabsContent>

        {/* Wallets tab */}
        <TabsContent value="wallets" className="mt-3">
          <PanelShell title="CHAIN WALLETS" subtitle="Add wallet addresses per chain">
            <div className="space-y-3 py-2">
              {ACTIVE_CHAINS.map(chain => (
                <WalletAddressInput
                  key={chain.id}
                  chainId={chain.id}
                  currentAddress={
                    chain.id === "solana" && solanaWallet
                      ? solanaWallet
                      : effectiveWallets[chain.id]
                  }
                  onSet={setWallet}
                />
              ))}
              <p className="text-[9px] font-mono text-muted-foreground/50 pt-2">
                Connected Solana wallet is auto-imported. Other chains require manual address entry.
              </p>
            </div>
          </PanelShell>
        </TabsContent>

        {/* Bridge tab — lazy loaded, fully isolated */}
        <TabsContent value="bridge" className="mt-3">
          <WidgetErrorBoundary name="Bridge">
            <Suspense fallback={
              <PanelShell title="CROSS-CHAIN BRIDGE" subtitle="Loading…">
                <div className="py-6 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-3/4" />
                </div>
              </PanelShell>
            }>
              <BridgePanel />
            </Suspense>
          </WidgetErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ───── Chain status card for Activity tab ───── */

function ChainStatusCard({ chainId, config, address }: { chainId: ChainId; config: ChainConfig; address?: string }) {
  const { data: status, isLoading } = useChainStatus(chainId);

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-xs font-mono font-bold text-foreground">{config.name}</span>
        </div>
        <StatusChip variant={status?.connected ? "success" : isLoading ? "muted" : "danger"}>
          {isLoading ? "CHECKING" : status?.connected ? "ONLINE" : "OFFLINE"}
        </StatusChip>
      </div>
      {status && (
        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div>
            <p className="text-muted-foreground">Block Height</p>
            <p className="text-foreground tabular-nums">{status.blockHeight > 0 ? status.blockHeight.toLocaleString() : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Latency</p>
            <p className="text-foreground tabular-nums">{status.latency >= 0 ? `${status.latency}ms` : "—"}</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {config.capabilities.supportsTokens && <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground">TOKENS</span>}
          {config.capabilities.supportsHistory && <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-muted/30 text-muted-foreground">HISTORY</span>}
        </div>
        <ExplorerLink config={config} address={address} />
      </div>
    </div>
  );
}
