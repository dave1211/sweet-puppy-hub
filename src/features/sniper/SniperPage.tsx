// Sniper Page — Responsive 3-panel layout with mobile tabs, hotkeys, auto-snipe, recorder
import { useState, useCallback } from "react";
import { useSniperFeed } from "@/features/sniper/hooks/useSniperFeed";
import { useSniperHotkeys } from "@/features/sniper/hooks/useSniperHotkeys";
import { useAutoSnipeEngine } from "@/features/sniper/hooks/useAutoSnipeEngine";
import { SniperHeader } from "@/features/sniper/components/SniperHeader";
import { SniperFilters } from "@/features/sniper/components/SniperFilters";
import { SniperFeed } from "@/features/sniper/components/SniperFeed";
import { SniperDetail } from "@/features/sniper/components/SniperDetail";
import { SniperExecution } from "@/features/sniper/components/SniperExecution";
import { SniperMobileTabs, type SniperTab } from "@/features/sniper/components/SniperMobileTabs";
import { AutoSnipePanel } from "@/features/sniper/components/AutoSnipePanel";
import { SnipeRecorder } from "@/features/sniper/components/SnipeRecorder";
import { HotkeyHint } from "@/features/sniper/components/HotkeyHint";
import { useWallet } from "@/contexts/WalletContext";
import { useExecutionStore } from "@/features/sniper/stores/executionStore";
import { useAutoSniperStore } from "@/features/sniper/stores/autoSniperStore";
import { supabase } from "@/integrations/supabase/client";
import { useDeviceId } from "@/hooks/useDeviceId";
import { toast } from "sonner";

const SniperPage = () => {
  const { tokens, selectedToken } = useSniperFeed();
  const { isConnected } = useWallet();
  const { config, openConfirm, isFastMode } = useExecutionStore();
  const snipeReady = tokens.filter((t) => t.state === "SNIPE_READY").length;
  const [mobileTab, setMobileTab] = useState<SniperTab>("feed");

  const handleBuy = useCallback(() => {
    if (!selectedToken) { toast.error("Select a token first"); return; }
    if (!isConnected) { toast.error("Connect wallet first"); return; }
    if (config.amountSOL <= 0) { toast.error("Set buy amount"); return; }
    if (isFastMode) {
      toast.success(`🎯 Fast sniped ${selectedToken.token.symbol} — ${config.amountSOL} SOL`);
    } else {
      openConfirm();
    }
  }, [selectedToken, isConnected, config.amountSOL, isFastMode, openConfirm]);

  const handleSell = useCallback((pct: number) => {
    if (!selectedToken) { toast.error("Select a token first"); return; }
    if (!isConnected) { toast.error("Connect wallet first"); return; }
    toast.success(`💰 Sold ${pct}% of ${selectedToken.token.symbol}`);
  }, [selectedToken, isConnected]);

  // Wire hotkeys
  useSniperHotkeys(tokens, handleBuy, handleSell);

  return (
    <div className="h-full flex flex-col">
      <SniperHeader tokenCount={tokens.length} snipeReady={snipeReady} />
      <SniperFilters />

      {/* Mobile Tabs */}
      <SniperMobileTabs
        active={mobileTab}
        onChange={setMobileTab}
        feedCount={tokens.length}
        readyCount={snipeReady}
      />

      {/* Desktop: 3-panel side by side | Mobile: single panel based on tab */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT: Token Feed */}
        <div className={`w-72 shrink-0 border-r border-border flex flex-col overflow-hidden ${
          mobileTab !== "feed" ? "hidden md:flex" : "flex md:flex"
        } md:w-72 w-full`}>
          <div className="px-2.5 py-1.5 border-b border-border/50 bg-card/30">
            <span className="text-[9px] font-mono text-muted-foreground">{tokens.length} TOKENS</span>
          </div>
          <SniperFeed tokens={tokens} />
        </div>

        {/* CENTER: Token Detail */}
        <div className={`flex-1 border-r border-border overflow-hidden ${
          mobileTab !== "detail" ? "hidden md:block" : "block"
        }`}>
          <SniperDetail token={selectedToken} />
        </div>

        {/* RIGHT: Execution + Auto Snipe + Recorder */}
        <div className={`md:w-64 w-full shrink-0 overflow-y-auto bg-card/30 ${
          mobileTab !== "execute" ? "hidden md:block" : "block"
        }`}>
          <div className="px-3 py-1.5 border-b border-border/50">
            <span className="text-[9px] font-mono text-muted-foreground">EXECUTE</span>
          </div>
          <SniperExecution token={selectedToken} />
          <div className="px-3 pb-3 space-y-2">
            <AutoSnipePanel />
            <SnipeRecorder />
          </div>
        </div>
      </div>

      {/* Hotkey Hint Bar (desktop only) */}
      <HotkeyHint />
    </div>
  );
};

export default SniperPage;
