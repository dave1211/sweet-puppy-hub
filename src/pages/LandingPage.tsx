import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wallet, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (user && !isLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-pulse text-xs font-mono text-muted-foreground">
          Initializing...
        </div>
      </div>
    );
  }

  const handleConnectWallet = () => {
    navigate("/auth", { replace: false });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tighter">
              <span className="text-primary">TANNER</span> TERMINAL
            </h1>
            <p className="text-sm md:text-base font-mono text-muted-foreground">
              Detect launches. Track whales. Scan risk. Run setups.
            </p>
          </div>
          <p className="text-xs md:text-sm font-mono text-muted-foreground/70 max-w-md mx-auto leading-relaxed">
            Move before the market reacts. Wallet-first authentication. Solana mainnet.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3">
          <Button
            onClick={handleConnectWallet}
            size="lg"
            className="w-full font-mono text-base"
          >
            <Wallet className="h-5 w-5 mr-2" />
            CONNECT WALLET
          </Button>
          <p className="text-[10px] font-mono text-muted-foreground/60 text-center">
            Requires Phantom, Solflare, or Backpack wallet extension
          </p>
        </div>

        {/* Feature callouts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-foreground">WALLET-ONLY</h3>
            <p className="text-[10px] font-mono text-muted-foreground/70">
              No email. No password. Just your Solana wallet.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-foreground">STANDALONE</h3>
            <p className="text-[10px] font-mono text-muted-foreground/70">
              Hosted independently. No external dependencies.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-foreground">REAL-TIME</h3>
            <p className="text-[10px] font-mono text-muted-foreground/70">
              Live data feeds. Market analysis. Smart signals.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-mono font-bold text-foreground">SECURE</h3>
            <p className="text-[10px] font-mono text-muted-foreground/70">
              Signature-verified auth. Session-based. No seed needed.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="space-y-3 pt-4 border-t border-border/50 text-center">
          <p className="text-[9px] font-mono text-muted-foreground/50">
            Supported on Chrome, Brave, Firefox, Edge, Opera, Arc, and mobile wallet browsers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://phantom.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-2 w-2" />
              Get Phantom
            </a>
            <span className="text-muted-foreground/30">•</span>
            <a
              href="https://solflare.com/download"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-2 w-2" />
              Get Solflare
            </a>
            <span className="text-muted-foreground/30">•</span>
            <a
              href="https://backpack.app/download"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[9px] font-mono text-primary/70 hover:text-primary transition-colors"
            >
              <ExternalLink className="h-2 w-2" />
              Get Backpack
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
