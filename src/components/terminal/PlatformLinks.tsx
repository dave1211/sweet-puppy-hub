// Platform link buttons — DexScreener, Pump.fun, Bonk LaunchLab
import { ExternalLink } from "lucide-react";

interface PlatformLinksProps {
  address: string;
  dexId?: string;
  url?: string;
  compact?: boolean;
}

function getDexScreenerUrl(address: string): string {
  return `https://dexscreener.com/solana/${address}`;
}

function getPumpFunUrl(address: string): string {
  return `https://pump.fun/coin/${address}`;
}

function getBonkUrl(address: string): string {
  return `https://letsbonk.fun/token/${address}`;
}

function isPumpFun(dexId?: string, address?: string): boolean {
  return dexId === "pumpfun" || dexId === "pumpswap" || (address?.endsWith("pump") ?? false);
}

function isBonk(dexId?: string, address?: string): boolean {
  return dexId === "launchlab" || (address?.endsWith("bonk") ?? false);
}

export function PlatformLinks({ address, dexId, url, compact }: PlatformLinksProps) {
  const showPump = isPumpFun(dexId, address);
  const showBonk = isBonk(dexId, address);

  const btnClass = compact
    ? "flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-mono font-bold transition-colors"
    : "flex items-center gap-1 px-1.5 py-1 rounded text-[9px] font-mono font-bold transition-colors";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* DexScreener — always show */}
      <a
        href={url || getDexScreenerUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnClass} bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/20 hover:bg-terminal-cyan/20`}
        onClick={(e) => e.stopPropagation()}
      >
        📊 DEX
        {!compact && <ExternalLink className="h-2.5 w-2.5" />}
      </a>

      {/* Pump.fun — show for pump tokens */}
      {showPump && (
        <a
          href={getPumpFunUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass} bg-terminal-green/10 text-terminal-green border border-terminal-green/20 hover:bg-terminal-green/20`}
          onClick={(e) => e.stopPropagation()}
        >
          🟢 PUMP
          {!compact && <ExternalLink className="h-2.5 w-2.5" />}
        </a>
      )}

      {/* Bonk LaunchLab — show for bonk tokens */}
      {showBonk && (
        <a
          href={getBonkUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass} bg-terminal-amber/10 text-terminal-amber border border-terminal-amber/20 hover:bg-terminal-amber/20`}
          onClick={(e) => e.stopPropagation()}
        >
          🐕 BONK
          {!compact && <ExternalLink className="h-2.5 w-2.5" />}
        </a>
      )}
    </div>
  );
}

// Badge-only version for inline use in rows
export function PlatformBadge({ dexId, address }: { dexId?: string; address?: string }) {
  if (isPumpFun(dexId, address)) {
    return <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-terminal-green/10 text-terminal-green border border-terminal-green/20">PUMP</span>;
  }
  if (isBonk(dexId, address)) {
    return <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-terminal-amber/10 text-terminal-amber border border-terminal-amber/20">BONK</span>;
  }
  if (dexId === "raydium") {
    return <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-terminal-blue/10 text-terminal-blue border border-terminal-blue/20">RAY</span>;
  }
  if (dexId === "meteoradbc") {
    return <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/20">METEORA</span>;
  }
  return <span className="text-[7px] font-mono font-bold px-1 py-0.5 rounded bg-muted text-muted-foreground border border-border">{(dexId || "DEX").toUpperCase()}</span>;
}
