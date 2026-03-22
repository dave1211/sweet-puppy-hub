import { Shield, Activity, Crosshair, Wallet, Users, Brain, ShieldAlert, Star, Bell, Rocket, BarChart3, Zap, Eye, Target, TrendingUp, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FEATURES = [
  { icon: BarChart3, title: "Live Pairs Monitoring", desc: "Real-time tracking of active trading pairs across markets with price, volume, and liquidity data." },
  { icon: Rocket, title: "New Launch Detection", desc: "Early identification of newly deployed tokens before they gain mainstream attention." },
  { icon: Crosshair, title: "Sniper Mode", desc: "Strategy simulation system for defining conditions and identifying high-probability setups." },
  { icon: Wallet, title: "Wallet Tracking", desc: "Monitor specific wallets for transactions, holdings, and behavioural patterns." },
  { icon: Users, title: "Copy Trade Intelligence", desc: "Analyse top-performing wallets and understand their strategies without blind copying." },
  { icon: Brain, title: "AI Signals Engine", desc: "Pattern-based signal detection using volume spikes, whale activity, and market behaviour." },
  { icon: ShieldAlert, title: "Risk Scanner", desc: "Multi-indicator risk evaluation covering liquidity, holder distribution, and contract behaviour." },
  { icon: Bell, title: "Watchlists & Alerts", desc: "Custom watchlists with configurable alerts for price movements, volume changes, and risk events." },
];

const FAQS = [
  { q: "What is Tanner Terminal?", a: "Tanner Terminal is a crypto intelligence dashboard that helps users track markets, detect opportunities, and analyse risk using real-time data and signal systems." },
  { q: "Does Tanner Terminal execute trades?", a: "No. Tanner Terminal does not execute trades. It provides insights, signals, and analysis tools to support decision-making." },
  { q: "What is Sniper Mode?", a: "Sniper Mode is a strategy simulation system that helps users define conditions for identifying high-probability opportunities in new or active tokens." },
  { q: "What are AI Signals?", a: "AI Signals highlight potential opportunities or risks based on patterns such as volume spikes, whale activity, and market behaviour." },
  { q: "What is the Risk Scanner?", a: "The Risk Scanner evaluates tokens using multiple indicators including liquidity, holder distribution, contract behaviour, and volatility." },
  { q: "Can Tanner Terminal prevent rug pulls?", a: "No system can guarantee prevention. Tanner Terminal reduces risk by highlighting warning signs and suspicious activity early." },
  { q: "What chains are supported?", a: "The platform is designed to support multiple chains and can be expanded over time." },
  { q: "Do I need a wallet to use it?", a: "No wallet is required for basic use. Wallet tracking features are optional." },
  { q: "Is this for beginners?", a: "Tanner Terminal is best suited for users who want deeper insights and are comfortable making their own decisions." },
  { q: "Is my data stored?", a: "The app can be configured to use secure backends. Sensitive data handling depends on final deployment setup." },
];

const PILLARS = [
  { icon: Zap, label: "Signal over noise" },
  { icon: TrendingUp, label: "Speed over delay" },
  { icon: Eye, label: "Clarity over confusion" },
];

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-16">
      {/* HERO */}
      <section className="text-center pt-8 md:pt-16 space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-mono tracking-widest uppercase">
          <Activity className="h-3 w-3 animate-pulse-glow" />
          Intelligence Platform
        </div>
        <h1 className="text-4xl md:text-5xl font-mono font-bold tracking-tight text-foreground">
          TANNER<span className="text-primary">TERMINAL</span>
        </h1>
        <p className="text-lg md:text-xl font-mono text-muted-foreground tracking-wide">
          Built for operators. Designed for signal.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Tanner Terminal is a next-generation crypto intelligence platform built to help users
          detect opportunity early, analyse risk clearly, and move with precision.
        </p>
        <div className="w-12 h-px bg-primary/30 mx-auto mt-8" />
      </section>

      {/* WHAT IT DOES */}
      <section className="space-y-6">
        <h2 className="text-xs font-mono font-semibold text-primary tracking-[0.2em] uppercase">
          What It Does
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Tracks live token markets in real time",
            "Detects new launches early",
            "Monitors smart money wallets",
            "Provides AI-driven signals",
            "Evaluates risk using multiple indicators",
            "Supports strategy-based decision making",
          ].map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/50"
            >
              <Target className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-foreground/90">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY IT EXISTS */}
      <section className="space-y-6">
        <h2 className="text-xs font-mono font-semibold text-primary tracking-[0.2em] uppercase">
          Why It Exists
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Most platforms show data. Tanner Terminal is designed for people who want an edge — not just information.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {PILLARS.map((p) => (
            <div
              key={p.label}
              className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card text-center"
              style={{ boxShadow: "var(--panel-shadow)" }}
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <p.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-mono font-semibold text-foreground tracking-wide">
                {p.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className="space-y-6">
        <h2 className="text-xs font-mono font-semibold text-primary tracking-[0.2em] uppercase">
          Core Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-4 rounded-lg border border-border bg-card/50 space-y-2"
              style={{ boxShadow: "var(--panel-shadow)" }}
            >
              <div className="flex items-center gap-2">
                <f.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-mono font-semibold text-foreground">{f.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SAFETY + RISK */}
      <section className="space-y-6">
        <h2 className="text-xs font-mono font-semibold text-primary tracking-[0.2em] uppercase">
          Safety & Risk Awareness
        </h2>
        <div className="p-5 rounded-lg border border-border bg-card" style={{ boxShadow: "var(--panel-shadow)" }}>
          <div className="flex items-start gap-3 mb-4">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/90 font-medium">
              Tanner Terminal is not a trading platform and does not execute trades.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {[
              "Risk indicators",
              "Contract insights",
              "Wallet behaviour analysis",
              "Signal confidence scoring",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                {item}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground/70 font-mono border-t border-border pt-3">
            Users remain fully responsible for their decisions.
          </p>
        </div>
      </section>

      {/* CLOSING */}
      <section className="text-center space-y-4 py-8">
        <div className="w-12 h-px bg-primary/30 mx-auto" />
        <p className="text-lg font-mono font-semibold text-foreground tracking-wide">
          Access the signal. Move with intent. Operate with clarity.
        </p>
        <div className="w-12 h-px bg-primary/30 mx-auto" />
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-xs font-mono font-semibold text-primary tracking-[0.2em] uppercase">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-lg bg-card/50 px-4 overflow-hidden"
              style={{ boxShadow: "var(--panel-shadow)" }}
            >
              <AccordionTrigger className="text-sm font-mono text-foreground hover:no-underline py-3">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="text-center text-xs font-mono text-muted-foreground/50 pt-6 tracking-wider">
          "If you understand the signal, you already know."
        </p>
      </section>
    </div>
  );
}
