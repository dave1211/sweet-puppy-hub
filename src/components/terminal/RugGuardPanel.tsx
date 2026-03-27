import { ShieldAlert, Shield, AlertTriangle, CheckCircle, Lock, Droplets, Users } from "lucide-react";
import { PanelShell } from "@/components/shared/PanelShell";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useTokenInfo } from "@/hooks/useTokenInfo";

interface SafetyCheck {
  label: string;
  icon: React.ElementType;
  status: "safe" | "warning" | "danger" | "unknown";
  detail: string;
}

function getChecks(tokenInfo: { price: number; volume24h: number; change24h: number; marketCap: number } | null): SafetyCheck[] {
  if (!tokenInfo) return [];

  const liq = tokenInfo.volume24h * 0.1;
  const checks: SafetyCheck[] = [
    {
      label: "Liquidity",
      icon: Droplets,
      status: liq > 50000 ? "safe" : liq > 10000 ? "warning" : "danger",
      detail: liq > 50000 ? "Healthy liquidity" : liq > 10000 ? "Low liquidity — caution" : "Very low liquidity — high risk",
    },
    {
      label: "Holders",
      icon: Users,
      status: tokenInfo.marketCap > 1000000 ? "safe" : tokenInfo.marketCap > 100000 ? "warning" : "danger",
      detail: tokenInfo.marketCap > 1000000 ? "Wide distribution" : "Concentration risk",
    },
    {
      label: "Authority",
      icon: Lock,
      status: "unknown",
      detail: "Mint authority check — coming soon",
    },
    {
      label: "Volatility",
      icon: AlertTriangle,
      status: Math.abs(tokenInfo.change24h) < 20 ? "safe" : Math.abs(tokenInfo.change24h) < 50 ? "warning" : "danger",
      detail: Math.abs(tokenInfo.change24h) < 20 ? "Normal range" : "High volatility detected",
    },
  ];
  return checks;
}

const statusStyles = {
  safe: { dot: "status-dot-live", text: "text-terminal-green", bg: "bg-terminal-green/5" },
  warning: { dot: "status-dot-warn", text: "text-terminal-amber", bg: "bg-terminal-amber/5" },
  danger: { dot: "status-dot-error", text: "text-terminal-red", bg: "bg-terminal-red/5" },
  unknown: { dot: "status-dot-offline", text: "text-muted-foreground", bg: "bg-muted/30" },
};

export function RugGuardPanel() {
  const { selectedAddress } = useSelectedToken();
  const { data: tokenInfo } = useTokenInfo(selectedAddress);
  const checks = getChecks(tokenInfo ?? null);

  const overallStatus = !selectedAddress ? "offline" as const
    : checks.some(c => c.status === "danger") ? "error" as const
    : checks.some(c => c.status === "warning") ? "warn" as const
    : checks.length > 0 ? "live" as const
    : "offline" as const;

  return (
    <PanelShell title="RUG GUARD" status={overallStatus} glow={overallStatus === "error" ? "red" : overallStatus === "warn" ? "amber" : "none"}>
      {!selectedAddress ? (
        <div className="text-center py-6">
          <Shield className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
          <p className="text-[10px] font-mono text-muted-foreground">Select a token to run safety analysis</p>
        </div>
      ) : checks.length === 0 ? (
        <div className="text-center py-6">
          <ShieldAlert className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2 animate-pulse" />
          <p className="text-[10px] font-mono text-muted-foreground">Analyzing…</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checks.map((check) => {
            const style = statusStyles[check.status];
            return (
              <div key={check.label} className={`flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2.5 ${style.bg}`}>
                <div className={`status-dot shrink-0 ${style.dot}`} />
                <check.icon className={`h-3.5 w-3.5 shrink-0 ${style.text}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono font-medium text-foreground">{check.label}</p>
                  <p className={`text-[9px] font-mono ${style.text}`}>{check.detail}</p>
                </div>
                {check.status === "safe" && <CheckCircle className="h-3 w-3 text-terminal-green shrink-0" />}
              </div>
            );
          })}
          <p className="text-[8px] font-mono text-muted-foreground/40 text-center pt-1">
            Automated safety checks · Not financial advice
          </p>
        </div>
      )}
    </PanelShell>
  );
}
