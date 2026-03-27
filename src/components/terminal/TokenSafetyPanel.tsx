/**
 * TokenSafetyPanel — Real safety panel using ONLY tokenSafetyService.
 * Replaces EnhancedRugPanel (which used Math.random — FAKE DATA).
 *
 * Shows: safetyScore, cautionState, confidence, checks, flags.
 * UNKNOWN = "PENDING" (never green).
 */

import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useTokenInfo } from "@/hooks/useTokenInfo";
import {
  assessTokenSafety,
  CAUTION_COLORS,
  CAUTION_LABELS,
  CHECK_STATUS_COLORS,
  CHECK_STATUS_LABELS,
  type TokenSafetyResult,
  type CheckStatus,
  type FlagSeverity,
} from "@/services/tokenSafetyService";
import { useMemo } from "react";

const CHECK_ICONS: Record<CheckStatus, typeof CheckCircle> = {
  pass: CheckCircle,
  fail: XCircle,
  unknown: Clock,
};

const FLAG_SEVERITY_STYLES: Record<FlagSeverity, string> = {
  info: "bg-terminal-blue/10 text-terminal-blue border-terminal-blue/20",
  warning: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/20",
  critical: "bg-terminal-red/10 text-terminal-red border-terminal-red/20",
};

export function TokenSafetyPanel() {
  const { selectedAddress } = useSelectedToken();
  const { data: tokenInfo, isLoading } = useTokenInfo(selectedAddress);

  const safety: TokenSafetyResult | null = useMemo(() => {
    if (!tokenInfo) return null;
    return assessTokenSafety({
      liquidity: 0,                // Not available from TokenInfo — will flag as unknown/low
      volume24h: tokenInfo.volume24h ?? 0,
      change24h: tokenInfo.change24h ?? 0,
      marketCap: tokenInfo.marketCap,
      // Not available from basic TokenInfo endpoint
      pairCreatedAt: undefined,
      topHolderPct: undefined,
      devHolderPct: undefined,
      buyCount24h: undefined,
      sellCount24h: undefined,
      lpLocked: null,
      mintAuthorityRevoked: null,
      freezeAuthorityRevoked: null,
      isHoneypot: null,
      contractVerified: null,
    });
  }, [tokenInfo]);

  // ─── Empty state ───
  if (!selectedAddress) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Shield className="h-4 w-4 text-terminal-amber" />TOKEN SAFETY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[10px] font-mono text-muted-foreground text-center py-4">Select a token to scan</p>
        </CardContent>
      </Card>
    );
  }

  // ─── Loading state ───
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Shield className="h-4 w-4 text-terminal-amber" />TOKEN SAFETY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">Analyzing token safety…</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Error state ───
  if (!safety) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Shield className="h-4 w-4 text-terminal-amber" />TOKEN SAFETY
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[10px] font-mono text-muted-foreground text-center py-4">Unable to analyze — token data unavailable</p>
        </CardContent>
      </Card>
    );
  }

  const criticalFlags = safety.flags.filter(f => f.severity === "critical");
  const warningFlags = safety.flags.filter(f => f.severity === "warning");
  const infoFlags = safety.flags.filter(f => f.severity === "info");

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-mono">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-terminal-amber" />TOKEN SAFETY
          </span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${CAUTION_COLORS[safety.cautionState]}`}>
            {CAUTION_LABELS[safety.cautionState]}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Score + Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-muted-foreground">SAFETY SCORE</span>
            <span className={`text-lg font-mono font-bold ${
              safety.safetyScore >= 65 ? "text-terminal-green" :
              safety.safetyScore >= 35 ? "text-terminal-amber" :
              "text-terminal-red"
            }`}>{safety.safetyScore}</span>
            <span className="text-[9px] font-mono text-muted-foreground">/ 100</span>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            safety.confidence === "high" ? "text-terminal-green border-terminal-green/30" :
            safety.confidence === "medium" ? "text-terminal-amber border-terminal-amber/30" :
            "text-terminal-red border-terminal-red/30"
          }`}>
            {safety.confidence.toUpperCase()} CONFIDENCE
          </span>
        </div>

        {/* Trade status */}
        {!safety.tradeAllowed && (
          <div className="p-2 rounded bg-terminal-red/10 border border-terminal-red/30">
            <div className="flex items-center gap-1.5">
              <XCircle className="h-3.5 w-3.5 text-terminal-red shrink-0" />
              <span className="text-[10px] font-mono font-bold text-terminal-red">TRADING BLOCKED</span>
            </div>
            {safety.blockReasons.map((reason, i) => (
              <p key={i} className="text-[9px] font-mono text-terminal-red/80 mt-1 pl-5">{reason}</p>
            ))}
          </div>
        )}

        {/* Security Checks */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono text-muted-foreground font-bold">SECURITY CHECKS</p>
          {safety.checks.map((check) => {
            const Icon = CHECK_ICONS[check.status];
            return (
              <div key={check.name} className="flex items-start justify-between text-[10px] font-mono gap-2">
                <span className="text-muted-foreground flex-1">{check.name}</span>
                <span className={`shrink-0 flex items-center gap-1 ${CHECK_STATUS_COLORS[check.status]}`}>
                  <Icon className="h-3 w-3" />
                  {CHECK_STATUS_LABELS[check.status]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Flags by severity */}
        {criticalFlags.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-terminal-red font-bold">CRITICAL</p>
            {criticalFlags.map((flag, i) => (
              <div key={i} className={`flex items-start gap-1.5 p-1.5 rounded text-[9px] font-mono border ${FLAG_SEVERITY_STYLES.critical}`}>
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{flag.message}</span>
              </div>
            ))}
          </div>
        )}
        {warningFlags.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-terminal-amber font-bold">WARNINGS</p>
            {warningFlags.map((flag, i) => (
              <div key={i} className={`flex items-start gap-1.5 p-1.5 rounded text-[9px] font-mono border ${FLAG_SEVERITY_STYLES.warning}`}>
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{flag.message}</span>
              </div>
            ))}
          </div>
        )}
        {infoFlags.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-mono text-terminal-blue font-bold">INFO</p>
            {infoFlags.map((flag, i) => (
              <div key={i} className={`flex items-start gap-1.5 p-1.5 rounded text-[9px] font-mono border ${FLAG_SEVERITY_STYLES.info}`}>
                <Info className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{flag.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Derived from */}
        <div className="pt-1 border-t border-border/50">
          <p className="text-[8px] font-mono text-muted-foreground/60">
            Derived from: {safety.derivedFrom.join(", ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
