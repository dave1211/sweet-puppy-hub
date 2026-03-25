import { useState, useEffect } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { cn } from "@/lib/utils";
import { Save, Check } from "lucide-react";
import { toast } from "sonner";
import { ReferralPanel } from "@/components/terminal/ReferralPanel";

const STORAGE_KEY = "tanner_terminal_settings";

const SETTINGS_SECTIONS = [
  {
    title: "Appearance",
    items: [
      { key: "theme", label: "Theme", type: "select" as const, options: ["Dark", "Light", "System"], value: "Dark" },
      { key: "density", label: "Layout Density", type: "select" as const, options: ["Compact", "Normal", "Comfortable"], value: "Compact" },
    ],
  },
  {
    title: "Trading",
    items: [
      { key: "defaultChain", label: "Default Chain", type: "select" as const, options: ["All", "Solana", "Ethereum", "Base"], value: "Solana" },
      { key: "simMode", label: "Simulation Mode", type: "toggle" as const, options: [] as string[], value: "true" },
      { key: "liveMode", label: "Live Sniper Mode (Real Trades)", type: "toggle" as const, options: [] as string[], value: "false" },
    ],
  },
  {
    title: "Alerts",
    items: [
      { key: "priceAlerts", label: "Price Alerts", type: "toggle" as const, options: [] as string[], value: "true" },
      { key: "whaleAlerts", label: "Whale Alerts", type: "toggle" as const, options: [] as string[], value: "true" },
      { key: "riskAlerts", label: "Risk Alerts", type: "toggle" as const, options: [] as string[], value: "true" },
    ],
  },
  {
    title: "Strategy Defaults",
    items: [
      { key: "maxRisk", label: "Default Max Risk", type: "select" as const, options: ["20", "30", "40", "50"], value: "40" },
      { key: "maxExposure", label: "Default Max Exposure (SOL)", type: "select" as const, options: ["1", "2", "5", "10"], value: "2" },
    ],
  },
];

function getDefaults(): Record<string, string> {
  const init: Record<string, string> = {};
  SETTINGS_SECTIONS.forEach(s => s.items.forEach(i => { init[i.key] = i.value; }));
  return init;
}

function loadSettings(): Record<string, string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...getDefaults(), ...parsed };
    }
  } catch { /* ignore */ }
  return getDefaults();
}

export function getSettingValue(key: string): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed[key] !== undefined) return parsed[key];
    }
  } catch { /* ignore */ }
  const defaults = getDefaults();
  return defaults[key] ?? "";
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>(loadSettings);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setSettings(prev => ({ ...prev, [key]: prev[key] === "true" ? "false" : "true" }));

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    toast.success("Settings saved");
    setTimeout(() => setSaved(false), 2000);
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent("settings-changed", { detail: settings }));
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">SETTINGS</h1>
          <p className="text-xs font-mono text-muted-foreground">Configure your terminal preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-primary-foreground text-xs font-mono font-medium hover:bg-primary/90 transition-colors"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "SAVED" : "SAVE"}
        </button>
      </div>

      {SETTINGS_SECTIONS.map(section => (
        <PanelShell key={section.title} title={section.title}>
          <div className="space-y-4">
            {section.items.map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  {item.key === "liveMode" && (
                    <p className="text-[9px] text-terminal-amber font-mono">⚠ Enables real trade execution when wallet is connected</p>
                  )}
                  {item.key === "simMode" && settings.liveMode === "true" && (
                    <p className="text-[9px] text-muted-foreground font-mono">Overridden by Live Mode</p>
                  )}
                </div>
                {item.type === "select" && (
                  <select
                    value={settings[item.key]}
                    onChange={e => setSettings(prev => ({ ...prev, [item.key]: e.target.value }))}
                    className="bg-muted border border-border rounded px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  >
                    {item.options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {item.type === "toggle" && (
                  <button onClick={() => toggle(item.key)} className={cn("w-10 h-5 rounded-full relative transition-colors", settings[item.key] === "true" ? (item.key === "liveMode" ? "bg-terminal-red" : "bg-primary") : "bg-muted")}>
                    <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-transform", settings[item.key] === "true" ? "left-5" : "left-0.5")} />
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
