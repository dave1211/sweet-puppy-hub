import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_COLORS: Record<string, string> = {
  "feature_flag.toggle": "text-terminal-amber",
  "anomaly.resolve": "text-terminal-green",
  "invite.create": "text-terminal-cyan",
  "kill_switch": "text-terminal-red",
};

export function AuditLogFeed() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
        <FileText className="h-4 w-4" />
        <span className="text-xs font-mono">No audit events yet</span>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-1">
      <div className="space-y-1.5">
        {logs.map(log => {
          const actionColor = Object.entries(ACTION_COLORS).find(([k]) => log.action.includes(k))?.[1] ?? "text-foreground";
          const details = log.details as Record<string, unknown> | null;

          return (
            <Card key={log.id} className="border-border bg-card">
              <CardContent className="p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn("text-[11px] font-mono font-bold truncate", actionColor)}>
                      {log.action}
                    </p>
                    {details && Object.keys(details).length > 0 && (
                      <p className="text-[9px] font-mono text-muted-foreground truncate mt-0.5">
                        {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
