import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RugGuardPanel() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm font-mono"><ShieldAlert className="h-4 w-4 text-terminal-red" />RUG GUARD</CardTitle></CardHeader>
      <CardContent><div className="text-center py-3"><p className="text-[10px] font-mono text-muted-foreground">Select a token to run safety check</p></div></CardContent>
    </Card>
  );
}