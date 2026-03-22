import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { cn } from "@/lib/utils";
import { Moon, Sun, Monitor, Save } from "lucide-react";

const SETTINGS_SECTIONS = [
  {
    title: "Appearance",
    items: [
      { key: "theme", label: "Theme", type: "select", options: ["Dark", "Light", "System"], value: "Dark" },
      { key: "density", label: "Layout Density", type: "select", options: ["Compact", "Normal", "Comfortable"], value: "Compact" },
    ],
  },
  {
    title: "Trading",
    items: [
      { key: "defaultChain", label: "Default Chain", type: "select", options: ["All", "Solana", "Ethereum", "Base"], value: "Solana" },
      { key: "simMode", label: "Simulation Mode", type: "toggle", value: true },
      { key: "dryRun", label: "Dry Run Mode", type: "toggle", value: true },
    ],
  },
  {
    title: "Alerts",
    items: [
      { key: "priceAlerts", label: "Price Alerts", type: "toggle", value: true },
      { key: "whaleAlerts", label: "Whale Alerts", type: "toggle", value: true },
      { key: "riskAlerts", label: "Risk Alerts", type: "toggle", value: true },
      { key: "launchAlerts", label: "New Launch Alerts", type: "toggle", value: true },
      { key: "signalAlerts", label: "AI Signal Alerts", type: "toggle", value: false },
    ],
  },
  {
    title: "Signals",
    items: [
      { key: "minConfidence", label: "Min Signal Confidence", type: "select", options: ["50%", "60%", "70%", "80%", "90%"], value: "70%" },
      { key: "signalTypes", label: "Show All Signal Types", type: "toggle", value: true },
    ],
  },
  {
    title: "Strategy Defaults",
    items: [
      { key: "maxRisk", label: "Default Max Risk", type: "select", options: ["20", "30", "40", "50"], value: "40" },
      { key: "maxExposure", label: "Default Max Exposure (SOL)", type: "select", options: ["1", "2", "5", "10"], value: "2" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, any>>({});

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">SETTINGS</h1>
          <p className="text-xs font-mono text-muted-foreground">Configure your terminal preferences</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors">
          <Save className="h-3.5 w-3.5" /> SAVE CHANGES
        </button>
      </div>

      {SETTINGS_SECTIONS.map(section => (
        <PanelShell key={section.title} title={section.title}>
          <div className="space-y-4">
            {section.items.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                {item.type === "select" && (
                  <select className="bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                    {item.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {item.type === "toggle" && (
                  <button className={cn("w-10 h-5 rounded-full relative transition-colors", item.value ? "bg-primary" : "bg-muted")}>
                    <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform", item.value ? "left-5.5 translate-x-0" : "left-0.5")} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </PanelShell>
      ))}
    </div>
  );
}
