import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import type { IntelligenceReport } from "@/hooks/useIntelligenceReport";

interface Props {
  report: IntelligenceReport | undefined;
  isLoading: boolean;
  icon: React.ReactNode;
  title: string;
  accentColor: string;
}

export function IntelligenceReportPanel({ report, isLoading, icon, title, accentColor }: Props) {
  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            {icon} {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-[10px] font-mono text-muted-foreground">No report data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono flex items-center gap-2">
            {icon} {title}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] font-mono text-muted-foreground">
              {new Date(report.generated_at).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report.sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h4 className={cn("text-xs font-mono font-bold", accentColor)}>
              {section.title}
            </h4>

            {/* Metrics grid */}
            {Object.keys(section.metrics).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(section.metrics).map(([key, value]) => (
                  <div key={key} className="rounded border border-border bg-muted/20 p-2">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="text-sm font-mono font-bold text-foreground">
                      {typeof value === "number" ? value.toLocaleString() : value}
                      {key.includes("pct") && "%"}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {section.notes.length > 0 && (
              <div className="space-y-1">
                {section.notes.map((note, ni) => (
                  <div key={ni} className="flex items-start gap-2 text-[10px] font-mono">
                    {note.toLowerCase().includes("down") || note.toLowerCase().includes("investigate") || note.toLowerCase().includes("abuse") ? (
                      <AlertTriangle className="h-3 w-3 text-terminal-amber shrink-0 mt-0.5" />
                    ) : note.toLowerCase().includes("review") || note.toLowerCase().includes("consider") ? (
                      <TrendingUp className="h-3 w-3 text-terminal-cyan shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle className="h-3 w-3 text-terminal-green shrink-0 mt-0.5" />
                    )}
                    <span className="text-muted-foreground">{note}</span>
                  </div>
                ))}
              </div>
            )}

            {idx < report.sections.length - 1 && <div className="h-px bg-border" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
