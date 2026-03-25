import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "bg-terminal-red/20 text-terminal-red border-terminal-red/30",
  high: "bg-terminal-amber/20 text-terminal-amber border-terminal-amber/30",
  medium: "bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/30",
  low: "bg-muted text-muted-foreground border-border",
};

const STATUS_ICONS: Record<string, typeof AlertTriangle> = {
  open: AlertTriangle,
  investigating: Clock,
  resolved: CheckCircle,
};

export function AnomalyMonitorPanel() {
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");

  const { data: anomalies, isLoading } = useQuery({
    queryKey: ["anomaly-events", filter],
    queryFn: async () => {
      let q = supabase
        .from("anomaly_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter === "open") q = q.in("status", ["open", "investigating"]);
      if (filter === "resolved") q = q.eq("status", "resolved");

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {(["all", "open", "resolved"] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="font-mono text-[10px] h-6 px-2"
          >
            {f.toUpperCase()}
          </Button>
        ))}
      </div>

      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
      ) : !anomalies?.length ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span className="text-xs font-mono">No anomalies detected</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {anomalies.map(a => {
            const StatusIcon = STATUS_ICONS[a.status] ?? AlertTriangle;
            return (
              <Card key={a.id} className="border-border bg-card">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <StatusIcon className={cn("h-4 w-4 shrink-0 mt-0.5",
                        a.status === "resolved" ? "text-terminal-green" : "text-terminal-amber"
                      )} />
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-bold text-foreground truncate">{a.event_type}</p>
                        {a.description && (
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5 line-clamp-2">{a.description}</p>
                        )}
                        <p className="text-[9px] font-mono text-muted-foreground mt-1">
                          {new Date(a.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-mono shrink-0", SEVERITY_COLORS[a.severity] ?? SEVERITY_COLORS.low)}>
                      {a.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
