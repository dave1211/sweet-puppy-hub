import { Copy, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CopyTradingPanel() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <Copy className="h-4 w-4 text-primary" />COPY TRADING
          <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-yellow/40 text-terminal-yellow">SIM</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4 space-y-1">
          <Copy className="h-5 w-5 text-muted-foreground/40 mx-auto" />
          <p className="text-[10px] font-mono text-muted-foreground">Enable copy trading to follow smart money</p>
        </div>
      </CardContent>
    </Card>
  );
}