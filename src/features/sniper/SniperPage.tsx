// Sniper Page — Full-width 3-panel layout
import { useSniperFeed } from "../hooks/useSniperFeed";
import { SniperHeader } from "../components/SniperHeader";
import { SniperFilters } from "../components/SniperFilters";
import { SniperFeed } from "../components/SniperFeed";
import { SniperDetail } from "../components/SniperDetail";
import { SniperExecution } from "../components/SniperExecution";

const SniperPage = () => {
  const { tokens, selectedToken } = useSniperFeed();
  const snipeReady = tokens.filter((t) => t.state === "SNIPE_READY").length;

  return (
    <div className="h-full flex flex-col">
      <SniperHeader tokenCount={tokens.length} snipeReady={snipeReady} />
      <SniperFilters />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT: Token Feed */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col overflow-hidden">
          <div className="px-2.5 py-1.5 border-b border-border/50 bg-card/30">
            <span className="text-[9px] font-mono text-muted-foreground">{tokens.length} TOKENS</span>
          </div>
          <SniperFeed tokens={tokens} />
        </div>

        {/* CENTER: Token Detail */}
        <div className="flex-1 border-r border-border overflow-hidden">
          <SniperDetail token={selectedToken} />
        </div>

        {/* RIGHT: Execution Panel */}
        <div className="w-64 shrink-0 overflow-y-auto bg-card/30">
          <div className="px-3 py-1.5 border-b border-border/50">
            <span className="text-[9px] font-mono text-muted-foreground">EXECUTE</span>
          </div>
          <SniperExecution token={selectedToken} />
        </div>
      </div>
    </div>
  );
};

export default SniperPage;
