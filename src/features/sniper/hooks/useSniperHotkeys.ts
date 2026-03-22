// Sniper Hotkeys — Keyboard shortcuts for sniper actions
import { useEffect } from "react";
import { useSniperStore } from "../stores/sniperStore";
import { useExecutionStore } from "../stores/executionStore";
import { toast } from "sonner";

const HOTKEY_MAP: Record<string, string> = {
  b: "BUY — Quick snipe buy",
  s: "SELL — Sell 100%",
  f: "FAST — Toggle fast mode",
  n: "NEXT — Select next token",
  p: "PREV — Select previous token",
  l: "LIVE — Toggle live feed",
  "1": "SELL 25%",
  "2": "SELL 50%",
  "3": "SELL 75%",
  "4": "SELL 100%",
  Escape: "CLOSE — Close confirm modal",
};

export function useSniperHotkeys(
  filteredTokens: { token: { address: string } }[],
  onBuy?: () => void,
  onSell?: (pct: number) => void,
) {
  const { selectedAddress, selectToken, toggleLive } = useSniperStore();
  const { toggleFastMode, openConfirm, closeConfirm, isConfirmOpen } = useExecutionStore();

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key;

      switch (key) {
        case "b":
          e.preventDefault();
          onBuy?.();
          break;
        case "s":
          e.preventDefault();
          onSell?.(100);
          break;
        case "f":
          e.preventDefault();
          toggleFastMode();
          toast.info("⚡ Fast mode toggled");
          break;
        case "l":
          e.preventDefault();
          toggleLive();
          break;
        case "n":
        case "ArrowDown": {
          e.preventDefault();
          const idx = filteredTokens.findIndex((t) => t.token.address === selectedAddress);
          const next = idx < filteredTokens.length - 1 ? idx + 1 : 0;
          if (filteredTokens[next]) selectToken(filteredTokens[next].token.address);
          break;
        }
        case "p":
        case "ArrowUp": {
          e.preventDefault();
          const idx = filteredTokens.findIndex((t) => t.token.address === selectedAddress);
          const prev = idx > 0 ? idx - 1 : filteredTokens.length - 1;
          if (filteredTokens[prev]) selectToken(filteredTokens[prev].token.address);
          break;
        }
        case "1":
          e.preventDefault();
          onSell?.(25);
          break;
        case "2":
          e.preventDefault();
          onSell?.(50);
          break;
        case "3":
          e.preventDefault();
          onSell?.(75);
          break;
        case "4":
          e.preventDefault();
          onSell?.(100);
          break;
        case "Escape":
          if (isConfirmOpen) {
            e.preventDefault();
            closeConfirm();
          }
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedAddress, filteredTokens, toggleFastMode, toggleLive, selectToken, openConfirm, closeConfirm, isConfirmOpen, onBuy, onSell]);

  return HOTKEY_MAP;
}
