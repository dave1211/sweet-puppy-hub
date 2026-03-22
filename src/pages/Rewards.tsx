import { Gift, Copy, Users, Star, Zap, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRewards } from "@/hooks/useRewards";
import { getReferralLink } from "@/lib/referral";
import { toast } from "sonner";

const ACTIONS = [
  { id: "daily_login", label: "Daily Login", points: 10, icon: Zap, description: "Log in every day" },
  { id: "share_signal", label: "Share a Signal", points: 25, icon: Share2, description: "Share trading signals" },
  { id: "add_watchlist", label: "Add to Watchlist", points: 5, icon: Star, description: "Track new tokens" },
  { id: "set_alert", label: "Set an Alert", points: 5, icon: Zap, description: "Create price alerts" },
  { id: "connect_wallet", label: "Connect Wallet", points: 50, icon: Gift, description: "Link your Solana wallet" },
];

export default function Rewards() {
  const { rewards, isLoading, referralCode } = useRewards();
  const referralLink = getReferralLink();

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2 pt-2">
        <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground">
          <Gift className="inline h-7 w-7 text-terminal-yellow mr-2" />
          Rewards <span className="text-primary">Program</span>
        </h1>
        <p className="text-sm font-mono text-muted-foreground">Earn points. Refer friends. Get rewarded.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-mono font-black text-primary">{isLoading ? "—" : rewards?.points ?? 0}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">TOTAL POINTS</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-mono font-black text-terminal-cyan">{isLoading ? "—" : rewards?.total_referrals ?? 0}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">REFERRALS</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <p className="text-lg font-mono font-black text-terminal-yellow">{referralCode}</p>
            <p className="text-[10px] font-mono text-muted-foreground mt-1">YOUR CODE</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="border-terminal-cyan/30 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Users className="h-4 w-4 text-terminal-cyan" />REFER & EARN
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs font-mono text-muted-foreground mb-3">
            Share your link. Earn <span className="text-primary font-bold">100 points</span> for every friend who joins.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-md px-3 py-2 text-[10px] font-mono text-foreground/80 truncate border border-border">
              {referralLink}
            </div>
            <button onClick={copyLink} className="flex items-center gap-1 px-3 py-2 rounded-md bg-primary/10 text-primary text-[10px] font-mono font-semibold hover:bg-primary/20 transition-colors border border-primary/30">
              <Copy className="h-3 w-3" />COPY
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Earn Points */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Star className="h-4 w-4 text-terminal-yellow" />EARN POINTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <div key={action.id} className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-mono font-bold">{action.label}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-primary">+{action.points} pts</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
