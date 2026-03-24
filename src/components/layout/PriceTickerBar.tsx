import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TickerCoin {
  id: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const COINS = "solana,bitcoin,ethereum,dogecoin,bonk,jupiter-exchange-solana,raydium,jito-governance-token";

function useTickerPrices() {
  return useQuery<TickerCoin[]>({
    queryKey: ["ticker-prices"],
    queryFn: async () => {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COINS}&order=market_cap_desc&sparkline=false`
      );
      if (!res.ok) throw new Error("CoinGecko fetch failed");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}

export function PriceTickerBar() {
  const { data: coins } = useTickerPrices();

  if (!coins || coins.length === 0) return null;

  const items = coins.map((c) => ({
    symbol: c.symbol.toUpperCase(),
    price: c.current_price,
    change: c.price_change_percentage_24h ?? 0,
  }));

  return (
    <div className="border-t border-border/40 bg-card/50 overflow-hidden h-7 flex items-center shrink-0">
      <div className="ticker-scroll flex items-center gap-8 text-[10px] font-mono tracking-wider">
        {[...items, ...items].map((item, i) => {
          const up = item.change >= 0;
          return (
            <div key={i} className="flex items-center gap-1.5 shrink-0">
              {up ? (
                <TrendingUp className="h-2.5 w-2.5 text-terminal-green" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5 text-destructive" />
              )}
              <span className="text-foreground/70 font-semibold">{item.symbol}</span>
              <span className="text-muted-foreground">
                ${item.price >= 1 ? item.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : item.price.toFixed(6)}
              </span>
              <span className={cn("font-semibold", up ? "text-terminal-green" : "text-destructive")}>
                {up ? "+" : ""}{item.change.toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-scroll { display: flex; animation: ticker-scroll 40s linear infinite; width: max-content; }
        .ticker-scroll:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
