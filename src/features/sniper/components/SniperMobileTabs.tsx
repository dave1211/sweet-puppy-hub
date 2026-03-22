// Mobile tab switcher for Feed / Detail / Execute
import { List, Search, Zap } from "lucide-react";

export type SniperTab = "feed" | "detail" | "execute";

interface Props {
  active: SniperTab;
  onChange: (tab: SniperTab) => void;
  feedCount: number;
  readyCount: number;
}

export function SniperMobileTabs({ active, onChange, feedCount, readyCount }: Props) {
  const tabs: { id: SniperTab; label: string; icon: typeof List; badge?: number }[] = [
    { id: "feed", label: "FEED", icon: List, badge: feedCount },
    { id: "detail", label: "DETAIL", icon: Search },
    { id: "execute", label: "EXECUTE", icon: Zap, badge: readyCount > 0 ? readyCount : undefined },
  ];

  return (
    <div className="flex border-b border-border bg-card/50 md:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono font-bold transition-colors relative ${
            active === tab.id
              ? "text-primary border-b-2 border-primary bg-primary/5"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <tab.icon className="h-3.5 w-3.5" />
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="absolute top-1 right-1/4 bg-primary text-primary-foreground text-[7px] font-bold rounded-full h-3.5 min-w-[14px] flex items-center justify-center px-0.5">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
