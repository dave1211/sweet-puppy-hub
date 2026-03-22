import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useMarketStore } from "@/stores/marketStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "1D", "1W"];

export function ChartPanel() {
  const { candles, activePair, lastPrice, change24h } = useMarketStore();
  const { chartTimeframe, setChartTimeframe } = useUIStore();
  const isPositive = change24h >= 0;

  const chartData =
    candles.length > 0
      ? candles.map((c) => ({ time: c.time, price: c.close, volume: c.volume }))
      : generateMockData(100, lastPrice || 2.35);

  return (
    <div className="terminal-panel flex flex-col h-full">
      {/* Header */}
      <div className="terminal-panel-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-3 w-3 text-muted-foreground/50" />
            <span className="terminal-panel-title">{activePair.label}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-base font-mono font-bold tabular-nums",
                isPositive ? "text-primary" : "text-destructive"
              )}
            >
              {lastPrice > 0 ? lastPrice.toFixed(5) : "—"}
            </span>
            {change24h !== 0 && (
              <div className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium",
                isPositive ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              )}>
                {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {isPositive ? "+" : ""}{change24h.toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* Timeframe */}
        <div className="flex gap-0.5 bg-muted/30 rounded p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setChartTimeframe(tf)}
              className={cn(
                "px-1.5 py-0.5 text-[8px] font-mono rounded transition-all",
                chartTimeframe === tf
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0 p-1.5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: "hsl(220, 12%, 35%)", fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) =>
                new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: "hsl(220, 12%, 35%)", fontFamily: "JetBrains Mono" }}
              width={48}
              tickFormatter={(v) => v.toFixed(4)}
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(225, 22%, 8%)",
                border: "1px solid hsl(225, 16%, 14%)",
                borderRadius: "4px",
                fontSize: "9px",
                fontFamily: "JetBrains Mono",
                boxShadow: "0 4px 12px hsl(225 25% 3% / 0.5)",
              }}
              labelFormatter={(v) => new Date(v).toLocaleString()}
              formatter={(v: number) => [v.toFixed(5), "Price"]}
              cursor={{ stroke: "hsl(220, 12%, 25%)", strokeDasharray: "3 3" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
              strokeWidth={1.5}
              fill="url(#priceGradient)"
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function generateMockData(count: number, basePrice: number) {
  const data = [];
  let p = basePrice;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    p += (Math.random() - 0.48) * 0.008;
    p = Math.max(0.001, p);
    data.push({
      time: now - (count - i) * 60_000,
      price: p,
      volume: Math.random() * 50000,
    });
  }
  return data;
}
