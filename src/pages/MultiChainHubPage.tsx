import { useState } from "react";
import {
  Globe, Wifi, WifiOff, Shield, TrendingUp, ArrowRightLeft,
  Plus, X, Loader2, RefreshCw, Eye
} from "lucide-react";
import { ACTIVE_CHAINS, COMPLIANCE_CHAINS, getChainConfig } from "@/lib/multichain";
import type { ChainId, ChainBalance } from "@/lib/multichain";
import { useMultiChainPortfolio, useMultiChainWallets, useChainStatus } from "@/hooks/useMultiChain";
import { useWallet } from "@/contexts/WalletContext";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { WidgetErrorBoundary } from "@/components/shared/WidgetErrorBoundary";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

function NetworkStatusDot({ chainId }: { chainId: ChainId }) {
  const { data: status, isLoading } = useChainStatus(chainId);
  if (isLoading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  return status?.connected
    ? <Wifi className="h-3 w-3 text-terminal-green" />
    : <WifiOff className="h-3 w-3 text-destructive" />;
}

function ChainBalanceCard({ chain, balance }: { chain: typeof ACTIVE_CHAINS[number]; balance?: ChainBalance }) {
  const hasBalance = balance && balance.nativeBalance > 0;
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
        <div className="flex items-center gap-2">
          {chain.isCompliance && (
            <Shield className="h-3 w-3 text-terminal-cyan" title="Compliance-aligned" />
          )}
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
          {balance.tokens.length > 0 && (
            <p className="text-[9px] font-mono text-muted-foreground">
              +{balance.tokens.length} token{balance.tokens.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] font-mono text-muted-foreground/50">No wallet connected</p>
      )}
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

export default function MultiChainHubPage() {
  const { wallets, setWallet } = useMultiChainWallets();
  const { walletAddress: solanaWallet } = useWallet();
  const [complianceView, setComplianceView] = useState(false);

  // Auto-include connected Solana wallet
  const effectiveWallets = { ...wallets };
  if (solanaWallet && !effectiveWallets.solana) {
    effectiveWallets.solana = solanaWallet;
  }

  const { data: portfolio, isLoading, refetch } = useMultiChainPortfolio(effectiveWallets);

  const displayChains = complianceView ? COMPLIANCE_CHAINS : ACTIVE_CHAINS;

  return (
    <div className="space-y-4">
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-terminal-cyan" />
            <span className="text-[10px] font-mono text-muted-foreground">COMPLIANCE VIEW</span>
            <Switch
              checked={complianceView}
              onCheckedChange={setComplianceView}
              className="scale-75"
            />
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

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start">
          <TabsTrigger value="overview" className="text-[10px] font-mono">
            <TrendingUp className="h-3 w-3 mr-1" /> OVERVIEW
          </TabsTrigger>
          <TabsTrigger value="wallets" className="text-[10px] font-mono">
            <Eye className="h-3 w-3 mr-1" /> MANAGE WALLETS
          </TabsTrigger>
          <TabsTrigger value="bridge" className="text-[10px] font-mono">
            <ArrowRightLeft className="h-3 w-3 mr-1" /> BRIDGE
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {displayChains.map(chain => {
              const balance = portfolio?.chains.find(c => c.chainId === chain.id);
              return (
                <WidgetErrorBoundary key={chain.id} name={chain.name}>
                  <ChainBalanceCard chain={chain} balance={balance} />
                </WidgetErrorBoundary>
              );
            })}
          </div>

          {/* Per-chain token breakdown */}
          {portfolio?.chains.some(c => c.tokens.length > 0) && (
            <div className="mt-4 space-y-3">
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

        <TabsContent value="bridge" className="mt-3">
          <PanelShell title="CROSS-CHAIN BRIDGE" subtitle="Coming soon — safe mode">
            <div className="py-8 text-center space-y-3">
              <ArrowRightLeft className="h-10 w-10 text-muted-foreground/20 mx-auto" />
              <p className="text-xs font-mono text-muted-foreground">
                Cross-chain bridging is in development.
              </p>
              <p className="text-[10px] font-mono text-muted-foreground/60 max-w-md mx-auto">
                Bridge architecture is ready. Provider integration will be enabled once verified
                safe. No unaudited bridge logic will be activated.
              </p>
              <StatusChip variant="muted">SAFE MODE — NOT YET ACTIVE</StatusChip>
            </div>
          </PanelShell>
        </TabsContent>
      </Tabs>
    </div>
  );
}
