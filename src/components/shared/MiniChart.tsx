import { useMemo, forwardRef } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { cn } from "@/lib/utils";

interface MiniChartProps {
  data?: { time: number; value: number }[];
  baseValue?: number;
  change?: number;
  height?: number;
  type?: "area" | "bar";
  label?: string;
  className?: string;
}

function generateSyntheticData(base: number, change: number, points = 48): { time: number; value: number }[] {
  const data: { time: number; value: number }[] = [];
  const now = Date.now();
  const direction = change >= 0 ? 1 : -1;
  for (let i = 0; i < points; i++) {
    const progress = i / points;
    const noise = (Math.random() - 0.5) * base * 0.02;
    const trend = direction * progress * base * Math.abs(change / 100) * 0.8;
    const v = Math.max(0.0000001, base * (1 - (change / 100) * 0.5) + trend + noise);
    data.push({ time: now - (points - i) * 30 * 60_000, value: v });
  }
  return data;
}

export const MiniChart = forwardRef<HTMLDivElement, MiniChartProps>(
  ({ data, baseValue = 1, change = 0, height = 80, type = "area", label, className }, ref) => {
    const chartData = useMemo(() => {
      if (data && data.length > 0) return data;
      return generateSyntheticData(baseValue, change);
    }, [data, baseValue, change]);

    const isPositive = change >= 0;
    const strokeColor = isPositive ? "hsl(var(--terminal-green))" : "hsl(var(--destructive))";
    const fillId = useMemo(() => `miniGrad-${Math.random().toString(36).slice(2, 8)}`, []);

    return (
      <div ref={ref} className={cn("w-full", className)}>
        {label && <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-1">{label}</p>}
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "area" ? (
              <AreaChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "4px",
                    fontSize: "9px",
                    fontFamily: "JetBrains Mono, monospace",
                    padding: "4px 8px",
                  }}
                  labelFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  formatter={(v: number) => [v < 0.01 ? v.toFixed(8) : v.toFixed(4), "Value"]}
                  cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  fill={`url(#${fillId})`}
                  dot={false}
                  animationDuration={800}
                  animationEasing="ease-out"
                  isAnimationActive={true}
                />
              </AreaChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "4px",
                    fontSize: "9px",
                    fontFamily: "JetBrains Mono, monospace",
                    padding: "4px 8px",
                  }}
                  formatter={(v: number) => [v.toFixed(2), "Value"]}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" opacity={0.6} radius={[2, 2, 0, 0]} animationDuration={800} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);
MiniChart.displayName = "MiniChart";
