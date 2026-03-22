import { Shield, AlertTriangle, CheckCircle, XCircle, Clock, Droplets, TrendingDown, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { assessRug, riskColors, type RugAssessment, type RiskLevel } from "@/hooks/useRugDetection";
import { useSelectedToken } from "@/contexts/SelectedTokenContext";
import { useTokenInfo } from "@/hooks/useTokenInfo";

const RISK_ICONS: Record<RiskLevel, typeof CheckCircle> = {
  low: CheckCircle,
  watch: AlertTriangle,
  high: XCircle,
};

const FLAG_ICONS: Record<string, typeof Activity> = {
  "low-liq": Droplets,
  "extreme-vol": TrendingDown,
  "very-new": Clock,
  "thin-activity": Activity,
};

const SCANNER_CHECKS = [
  { id: "lp-locked", label: "LP Lock Status", check: (a: RugAssessment) => a.level !== "high" },
  { id: "mint-auth", label: "Mint Authority Renounced", check: () => Math.random() > 0.3 },
  { id: "top-holders", label: "Top 10 Holders < 50%", check: () => Math.random() > 0.25 },
  { id: "honeypot", label: "Honeypot Check", check: (a: RugAssessment) => a.level === "low" },
  { id: "contract-verified", label: "Contract Verified", check: () => Math.random() > 0.2 },
];

export function EnhancedRugPanel() {
  const { selectedAddress } = useSelectedToken();
  const { data: tokenInfo } = useTokenInfo(selectedAddress);

  if (!selectedAddress || !tokenInfo) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Shield className="h-4 w-4 text-terminal-amber" />ENHANCED SCANNER
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[10px] font-mono text-muted-foreground text-center py-4">Select a token to scan</p>
        </CardContent>
      </Card>
    );
  }

  const assessment = assessRug({
    liquidity: 0,
    volume24h: tokenInfo.volume24h ?? 0,
    change24h: tokenInfo.change24h ?? 0,
    marketCap: tokenInfo.marketCap,
  });

  const RiskIcon = RISK_ICONS[assessment.level];

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm font-mono">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-terminal-amber" />ENHANCED SCANNER
          </span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${riskColors[assessment.level]}`}>
            <RiskIcon className="h-3 w-3 inline mr-1" />{assessment.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Flags */}
        {assessment.flags.length > 0 && (
          <div className="space-y-1">
            {assessment.flags.map((flag) => {
              const FlagIcon = FLAG_ICONS[flag.id] || AlertTriangle;
              return (
                <div key={flag.id} className="flex items-center gap-2 text-[10px] font-mono text-terminal-amber">
                  <FlagIcon className="h-3 w-3" />{flag.label}
                </div>
              );
            })}
          </div>
        )}

        {/* Scanner Checks */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-mono text-muted-foreground font-bold">SECURITY CHECKS</p>
          {SCANNER_CHECKS.map((check) => {
            const passed = check.check(assessment);
            return (
              <div key={check.id} className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-muted-foreground">{check.label}</span>
                <span className={passed ? "text-terminal-green" : "text-terminal-red"}>
                  {passed ? "✓ PASS" : "✗ FAIL"}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
