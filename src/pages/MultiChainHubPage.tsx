import { useState, lazy, Suspense } from "react";
import {
  Globe, Wifi, WifiOff, Shield, TrendingUp, ArrowRightLeft,
  Plus, X, Loader2, RefreshCw, Eye, ExternalLink, Activity,
  Landmark, Cpu, Zap
} from "lucide-react";
import { ACTIVE_CHAINS, COMPLIANCE_CHAINS, getChainConfig, CHAIN_READINESS } from "@/lib/multichain";
import type { ChainId, ChainBalance, ChainConfig, ChainReadiness } from "@/lib/multichain";
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

const BridgePanel = lazy(() =>
  import("@/components/bridge/XRPBridgePanel").then(m => ({ default: m.XRPBridgePanel }))
);

/* ── Chain groupings ── */
const SOLANA_CHAINS: ChainId[] = ["solana"];
const COMPLIANCE_CHAIN_IDS: ChainId[] = ["xrpl", "stellar", "hedera", "xdc", "algorand", "quant", "iota"];
const EVM_BTC_CHAINS: ChainId[] = ["ethereum", "bitcoin"];

/* ── Helpers ── */

function ReadinessBadge({ readiness }: { readiness: ChainReadiness }) {
  const styles: Record<ChainReadiness, string> = {
    live: "bg-terminal-green/15 text-terminal-green border-terminal-green/30",
    beta: "bg-terminal-amber/15 text-terminal-amber border-terminal-amber/30",
    scaffolded: "bg-muted/30 text-muted-foreground border-border/30",
  };
  const labels: Record<ChainReadiness, string> = { live: "LIVE", beta: "BETA", scaffolded: "PREVIEW" };
  return (
    <span className={cn("text-[7px] font-mono px-1 py-0.5 rounded border uppercase tracking-wider", styles[readiness])}>
      {labels[readiness]}
    </span>
  );
}

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
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors">
      <ExternalLink className="h-2.5 w-2.5" /> Explorer
    </a>
  );
}

function ChainBalanceCard({ chain, balance, address }: {
  chain: ChainConfig; balance?: ChainBalance; address?: string;
}) {
  const hasBalance = balance && balance.nativeBalance > 0;
  const caps = chain.capabilities;
  const readiness = CHAIN_READINESS[chain.id];

  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-2 hover:border-border/80 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{chain.icon}</span>
          <div>
            <p className="text-xs font-mono font-bold text-foreground">{chain.name}</p>
            <p className="text-[9px] font-mono text-muted-foreground">{chain.symbol}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ReadinessBadge readiness={readiness} />
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
          {readiness === "scaffolded" ? "Coming soon" : address ? "Loading…" : "No wallet connected"}
        </p>
      )}

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
  chainId: ChainId; currentAddress?: string; onSet: (chainId: ChainId, address: string | null) => void;
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
      <Input value={value} onChange={(e) => setValue(e.target.value)}
        placeholder={`${config.name} address…`}
        className="h-7 text-[10px] font-mono bg-muted/20 border-border/30" />
      <Button size="sm" variant="outline" className="h-7 text-[9px] font-mono px-2"
        disabled={!value.trim()}
        onClick={() => { if (value.trim()) { onSet(chainId, value.trim()); setEditing(false); } }}>
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

/* ── Section renderer ── */
function ChainSection({ title, subtitle, icon, chainIds, portfolio, effectiveWallets }: {
  title: string; subtitle: string; icon: React.ReactNode;
  chainIds: ChainId[]; portfolio: ReturnType<typeof useMultiChainPortfolio>["data"];
  effectiveWallets: Partial<Record<ChainId, string>>;
}) {
  const chains = chainIds.map(id => getChainConfig(id)).filter(Boolean);
  if (chains.length === 0) return null;

  const sectionValue = chains.reduce((sum, chain) => {
    const bal = portfolio?.chains.find(c => c.chainId === chain.id);
    return sum + (bal?.nativeValueUSD ?? 0) + (bal?.tokens.reduce((s, t) => s + t.valueUSD, 0) ?? 0);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">{title}</h2>
            <p className="text-[9px] font-mono text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {sectionValue > 0 && (
          <span className="text-xs font-mono font-bold text-foreground tabular-nums">
            ${sectionValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {chains.map(chain => (
          <WidgetErrorBoundary key={chain.id} name={chain.name}>
            <ChainBalanceCard
              chain={chain}
              balance={portfolio?.chains.find(c => c.chainId === chain.id)}
              address={effectiveWallets[chain.id]}
            />
          </WidgetErrorBoundary>
        ))}
      </div>
    </div>
  );
}

/* ── Chain Status Card ── */
function ChainStatusCard({ chainId, config, address }: { chainId: ChainId; config: ChainConfig; address?: string }) {
  const { data: status, isLoading } = useChainStatus(chainId);
  return (
    <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className="text-xs font-mono font-bold text-foreground">{config.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ReadinessBadge readiness={CHAIN_READINESS[chainId]} />
          <StatusChip variant={status?.connected ? "success" : isLoading ? "muted" : "danger"}>
            {isLoading ? "CHECKING" : status?.connected ? "ONLINE" : "OFFLINE"}
          </StatusChip>
        </div>
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

/* ───── Main Page ───── */

export default function MultiChainHubPage() {
  const { wallets, setWallet } = useMultiChainWallets();
  const { walletAddress: solanaWallet } = useWallet();

  const effectiveWallets = { ...wallets };
  if (solanaWallet && !effectiveWallets.solana) {
    effectiveWallets.solana = solanaWallet;
  }

  const { data: portfolio, isLoading, refetch } = useMultiChainPortfolio(effectiveWallets);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            MULTI-CHAIN HUB
          </h1>
          <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
            Unified portfolio across {ACTIVE_CHAINS.length} networks · Solana primary
          </p>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-[9px] font-mono px-2"
          onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("h-3 w-3 mr-1", isLoading && "animate-spin")} /> REFRESH
        </Button>
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
              ) : "$0.00"}
            </span>
            {portfolio && portfolio.chains.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {portfolio.chains.length} chain{portfolio.chains.length !== 1 ? "s" : ""} active
              </span>
            )}
          </div>
        </PanelShell>
      </WidgetErrorBoundary>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start">
          <TabsTrigger value="overview" className="text-[10px] font-mono">
            <TrendingUp className="h-3 w-3 mr-1" /> OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-[10px] font-mono">
            <Activity className="h-3 w-3 mr-1" /> NETWORK
          </TabsTrigger>
          <TabsTrigger value="wallets" className="text-[10px] font-mono">
            <Eye className="h-3 w-3 mr-1" /> WALLETS
          </TabsTrigger>
          <TabsTrigger value="bridge" className="text-[10px] font-mono">
            <ArrowRightLeft className="h-3 w-3 mr-1" /> BRIDGE
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          {/* 1. Solana — Primary */}
          <ChainSection
            title="Solana"
            subtitle="Primary trading chain"
            icon={<Zap className="h-4 w-4 text-terminal-green" />}
            chainIds={SOLANA_CHAINS}
            portfolio={portfolio}
            effectiveWallets={effectiveWallets}
          />

          {/* 2. Compliance / ISO Chains */}
          <ChainSection
            title="Compliance & Payments"
            subtitle="XRPL · XLM · HBAR · XDC · ALGO · QNT · IOTA"
            icon={<Landmark className="h-4 w-4 text-terminal-cyan" />}
            chainIds={COMPLIANCE_CHAIN_IDS}
            portfolio={portfolio}
            effectiveWallets={effectiveWallets}
          />

          {/* 3. EVM + BTC */}
          <ChainSection
            title="EVM & Bitcoin"
            subtitle="Ethereum · Bitcoin"
            icon={<Cpu className="h-4 w-4 text-terminal-amber" />}
            chainIds={EVM_BTC_CHAINS}
            portfolio={portfolio}
            effectiveWallets={effectiveWallets}
          />

          {/* Token breakdown */}
          {portfolio?.chains.some(c => c.tokens.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-xs font-mono font-bold text-foreground uppercase tracking-wider">Token Holdings</h2>
              {portfolio.chains
                .filter(c => c.tokens.length > 0)
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
                                  <p className="text-[9px] font-mono text-muted-foreground tabular-nums">${t.valueUSD.toFixed(2)}</p>
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

        {/* ── NETWORK STATUS ── */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ACTIVE_CHAINS.map(chain => (
              <WidgetErrorBoundary key={chain.id} name={`${chain.name} Status`}>
                <ChainStatusCard chainId={chain.id} config={chain} address={effectiveWallets[chain.id]} />
              </WidgetErrorBoundary>
            ))}
          </div>
        </TabsContent>

        {/* ── WALLETS ── */}
        <TabsContent value="wallets" className="mt-4">
          <PanelShell title="CHAIN WALLETS" subtitle="Add wallet addresses per chain">
            <div className="space-y-3 py-2">
              {ACTIVE_CHAINS.map(chain => (
                <WalletAddressInput key={chain.id} chainId={chain.id}
                  currentAddress={chain.id === "solana" && solanaWallet ? solanaWallet : effectiveWallets[chain.id]}
                  onSet={setWallet} />
              ))}
              <p className="text-[9px] font-mono text-muted-foreground/50 pt-2">
                Solana wallet auto-imported. Other chains require manual address entry.
              </p>
            </div>
          </PanelShell>
        </TabsContent>

        {/* ── BRIDGE ── */}
        <TabsContent value="bridge" className="mt-4">
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
