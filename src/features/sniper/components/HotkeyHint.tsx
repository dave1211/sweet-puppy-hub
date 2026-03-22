// Hotkey Hint Bar — Shows available keyboard shortcuts
import { Keyboard } from "lucide-react";
import { useState } from "react";

const HOTKEYS = [
  { key: "B", action: "Buy" },
  { key: "S", action: "Sell 100%" },
  { key: "F", action: "Fast mode" },
  { key: "N/↓", action: "Next" },
  { key: "P/↑", action: "Prev" },
  { key: "L", action: "Live" },
  { key: "1-4", action: "Sell %" },
  { key: "Esc", action: "Close" },
];

export function HotkeyHint() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="hidden md:block border-t border-border bg-card/30 px-3 py-1">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground hover:text-foreground transition-colors"
      >
        <Keyboard className="h-3 w-3" />
        HOTKEYS
      </button>
      {expanded && (
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 pb-0.5">
          {HOTKEYS.map((h) => (
            <div key={h.key} className="text-[8px] font-mono">
              <kbd className="bg-muted/40 border border-border rounded px-1 py-0.5 text-foreground">{h.key}</kbd>
              <span className="text-muted-foreground ml-1">{h.action}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
