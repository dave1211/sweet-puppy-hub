import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useMarketStore } from "@/stores/marketStore";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "1D", "1W"];

export function ChartPanel() {
  const { candles, activePair, lastPrice, change24h } = useMarketStore();
  const { chartTimeframe, setChartTimeframe } = useUIStore();
  const isPositive = change24h >= 0;

  // Generate mock candle data if empty
  const chartData =
    candles.length > 0
      ? candles.map((c) => ({ time: c.time, price: c.close, volume: c.volume }))
      : generateMockData(80, lastPrice || 2.35);

  return (
    <div className="border border-border rounded bg-card flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-foreground">
            {activePair.label}
          </span>
          <span
            className={cn(
              "text-lg font-mono font-bold",
              isPositive ? "text-primary" : "text-destructive"
            )}
          >
            {lastPrice > 0 ? lastPrice.toFixed(5) : "—"}
          </span>
          {change24h !== 0 && (
            <span
              className={cn(
                "text-[10px] font-mono",
                isPositive ? "text-primary" : "text-destructive"
              )}
            >
              {isPositive ? "+" : ""}
              {change24h.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Timeframe selector */}
        <div className="flex gap-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setChartTimeframe(tf)}
              className={cn(
                "px-2 py-1 text-[9px] font-mono rounded transition-colors",
                chartTimeframe === tf
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[200px] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "hsl(215, 15%, 50%)", fontFamily: "JetBrains Mono" }}
              tickFormatter={(v) =>
                new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              }
            />
            <YAxis
              domain={["auto", "auto"]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: "hsl(215, 15%, 50%)", fontFamily: "JetBrains Mono" }}
              width={55}
              tickFormatter={(v) => v.toFixed(4)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(220, 18%, 10%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "4px",
                fontSize: "10px",
                fontFamily: "JetBrains Mono",
              }}
              labelFormatter={(v) => new Date(v).toLocaleString()}
              formatter={(v: number) => [v.toFixed(5), "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "hsl(142, 70%, 45%)" : "hsl(0, 72%, 51%)"}
              strokeWidth={1.5}
              fill="url(#priceGradient)"
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
    p += (Math.random() - 0.48) * 0.01;
    data.push({
      time: now - (count - i) * 60_000,
      price: Math.max(0.001, p),
      volume: Math.random() * 50000,
    });
  }
  return data;
}
