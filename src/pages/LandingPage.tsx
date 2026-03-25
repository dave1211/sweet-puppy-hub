import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Crosshair, ShieldAlert, Brain, Rocket, Wallet, BarChart3,
  Zap, Crown, ChevronRight, Users, Bell, TrendingUp, Star
} from "lucide-react";
import { cn } from "@/lib/utils";

const FEATURES = [
  { icon: Crosshair, title: "Sniper Mode", desc: "Detect and enter tokens before the crowd. Sub-second signal scanning with auto-filter.", color: "text-terminal-green" },
  { icon: ShieldAlert, title: "Rug Protection", desc: "Real-time risk scoring, liquidity analysis, and holder concentration checks before you trade.", color: "text-terminal-red" },
  { icon: Brain, title: "AI Signals", desc: "Machine-scored token intelligence with whale tracking, volume spikes, and entry timing.", color: "text-terminal-cyan" },
  { icon: Wallet, title: "Wallet Tracker", desc: "Follow smart money. Track whale wallets, copy trades, and get alerts on big moves.", color: "text-terminal-amber" },
  { icon: Rocket, title: "Launchpad", desc: "Launch your own token with built-in anti-rug protections and instant listing.", color: "text-primary" },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time charts, volume analysis, holder distribution, and market intelligence.", color: "text-terminal-blue" },
];

const TIERS = [
  { name: "FREE", price: "$0", period: "forever", features: ["Basic signals", "1 tracked wallet", "3 alerts", "Dashboard access"], cta: false },
  { name: "PRO", price: "$29", period: "/mo", features: ["All FREE features", "Sniper Mode", "Smart Money Tracker", "5 wallets · 20 alerts", "Advanced signals"], cta: true, popular: true },
  { name: "ELITE", price: "$99", period: "/mo", features: ["All PRO features", "Auto Sniper", "Copy Trading", "Unlimited everything", "Priority support"], cta: true },
];

const STATS = [
  { value: "50K+", label: "Tokens Scanned Daily" },
  { value: "<200ms", label: "Signal Latency" },
  { value: "98.7%", label: "Rug Detection Rate" },
  { value: "24/7", label: "Live Monitoring" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="font-mono font-bold text-lg">
            <span className="text-primary">TANNER</span> TERMINAL
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-mono text-xs">SIGN IN</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="font-mono text-xs">GET STARTED</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-terminal-green/30 bg-terminal-green/5 text-terminal-green text-[10px] font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-terminal-green animate-pulse" />
              LIVE — SCANNING SOLANA NETWORK
            </div>
            <h1 className="text-3xl sm:text-5xl font-mono font-black leading-tight">
              The Crypto Terminal<br />
              That <span className="text-primary">Makes You Money</span>
            </h1>
            <p className="text-sm sm:text-base font-mono text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Snipe launches before the crowd. Detect rugs before they pull. Track smart money in real-time. 
              Your unfair advantage starts here.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/auth">
                <Button size="lg" className="font-mono text-sm px-8 gap-2">
                  <Zap className="h-4 w-4" /> START FREE — NO CARD NEEDED
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="font-mono text-sm px-8 gap-2">
                  SEE FEATURES <ChevronRight className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {STATS.map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-mono font-black text-primary">{s.value}</p>
                <p className="text-[10px] sm:text-xs font-mono text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold">
            Every Tool You Need. <span className="text-primary">One Terminal.</span>
          </h2>
          <p className="text-xs sm:text-sm font-mono text-muted-foreground mt-3 max-w-lg mx-auto">
            Stop switching between 10 tabs. Tanner Terminal puts every signal, every tool, every edge in one place.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="p-5 rounded-lg border border-border/50 bg-card/50 hover:border-primary/20 transition-colors group">
              <f.icon className={cn("h-8 w-8 mb-3", f.color)} />
              <h3 className="font-mono font-bold text-sm text-foreground mb-2">{f.title}</h3>
              <p className="text-xs font-mono text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-terminal-amber text-terminal-amber" />)}
          </div>
          <p className="font-mono text-sm text-foreground max-w-md mx-auto italic">
            "Tanner Terminal caught a rug 3 seconds before it pulled. Saved me 8 SOL. This thing is insane."
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-2">— Early Access User</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold">
            Stop Missing <span className="text-primary">Alpha</span>
          </h2>
          <p className="text-xs font-mono text-muted-foreground mt-2">
            Every minute without Pro, you're watching others profit. Upgrade now. Cancel anytime.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map(tier => (
            <div key={tier.name} className={cn(
              "relative rounded-lg border bg-card p-5 flex flex-col",
              tier.popular ? "border-terminal-cyan/50 ring-1 ring-terminal-cyan/20" : "border-border/50"
            )}>
              {tier.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-terminal-cyan/20 text-terminal-cyan text-[9px] font-mono font-bold border border-terminal-cyan/30">
                  MOST POPULAR
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-4 w-4 text-primary" />
                <span className="font-mono font-bold text-sm">{tier.name}</span>
              </div>
              <div className="mb-5">
                <span className="text-3xl font-mono font-black">{tier.price}</span>
                <span className="text-xs font-mono text-muted-foreground ml-1">{tier.period}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs font-mono text-foreground">
                    <Zap className="h-3 w-3 text-terminal-green shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className={cn(
                "block text-center py-2.5 rounded-md text-xs font-mono font-bold transition-colors",
                tier.cta
                  ? tier.popular ? "bg-terminal-cyan text-background hover:bg-terminal-cyan/80" : "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "border border-border text-muted-foreground hover:bg-muted"
              )}>
                {tier.cta ? `Get ${tier.name}` : "Start Free"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 bg-gradient-to-t from-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-mono font-bold">
            Ready to <span className="text-primary">Trade Smarter</span>?
          </h2>
          <p className="text-xs font-mono text-muted-foreground">
            Join thousands of traders using Tanner Terminal to find alpha, avoid rugs, and make money.
          </p>
          <Link to="/auth">
            <Button size="lg" className="font-mono text-sm px-10 gap-2 mt-2">
              <Rocket className="h-4 w-4" /> LAUNCH YOUR TERMINAL
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[10px] font-mono text-muted-foreground">
            © {new Date().getFullYear()} TANNER TERMINAL — SOLANA INTELLIGENCE PLATFORM
          </p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">ABOUT</Link>
            <Link to="/auth" className="text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors">SIGN IN</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
