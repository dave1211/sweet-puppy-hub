/**
 * Admin invite code management panel for War Room.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Key, Plus, Copy, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { writeAuditLog } from "@/services/auditService";

interface InviteCode {
  id: string;
  code: string;
  max_uses: number;
  current_uses: number;
  active: boolean;
  label: string | null;
  expires_at: string | null;
  created_at: string;
}

export function InviteCodeManager() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState("");
  const [newMaxUses, setNewMaxUses] = useState(3);
  const [creating, setCreating] = useState(false);

  const fetchCodes = async () => {
    const { data } = await supabase
      .from("invite_codes" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setCodes((data as any as InviteCode[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleCreate = async () => {
    const code = newCode.trim().toUpperCase() || `ALPHA${Date.now().toString(36).toUpperCase().slice(-5)}`;
    if (code.length < 4) { toast.error("Code too short"); return; }

    setCreating(true);
    const { error } = await (supabase.from("invite_codes" as any) as any).insert({
      code,
      max_uses: newMaxUses,
      label: "Manual",
    });

    if (error) {
      toast.error(error.message?.includes("duplicate") ? "Code already exists" : "Failed to create");
    } else {
      await writeAuditLog({ action: "invite_code_created", target_type: "invite_code", target_id: code });
      toast.success(`Code ${code} created`);
      setNewCode("");
      fetchCodes();
    }
    setCreating(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  if (loading) {
    return <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;
  }

  const activeCount = codes.filter(c => c.active && c.current_uses < c.max_uses).length;
  const totalUsed = codes.reduce((sum, c) => sum + c.current_uses, 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-primary" />
          <span className="text-xs font-mono text-muted-foreground">
            {activeCount} active codes
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-terminal-green" />
          <span className="text-xs font-mono text-muted-foreground">
            {totalUsed} total uses
          </span>
        </div>
      </div>

      {/* Create new */}
      <div className="flex gap-2">
        <Input
          value={newCode}
          onChange={e => setNewCode(e.target.value.toUpperCase())}
          placeholder="CODE (auto if empty)"
          maxLength={20}
          className="font-mono text-xs flex-1 bg-muted/20 border-border"
        />
        <Input
          type="number"
          value={newMaxUses}
          onChange={e => setNewMaxUses(Math.max(1, parseInt(e.target.value) || 1))}
          className="font-mono text-xs w-16 bg-muted/20 border-border"
          min={1}
          max={100}
        />
        <Button onClick={handleCreate} disabled={creating} size="sm" className="font-mono text-xs">
          {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        </Button>
      </div>

      {/* Codes list */}
      <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
        {codes.map(c => (
          <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card/50">
            <div className="flex items-center gap-3">
              <button onClick={() => copyCode(c.code)} className="hover:opacity-70 transition-opacity">
                <Copy className="h-3 w-3 text-muted-foreground" />
              </button>
              <span className="font-mono text-xs text-foreground font-semibold tracking-wider">{c.code}</span>
              {c.label && (
                <Badge variant="outline" className="text-[8px] border-border text-muted-foreground">{c.label}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">
                {c.current_uses}/{c.max_uses}
              </span>
              {c.current_uses >= c.max_uses ? (
                <Badge variant="destructive" className="text-[8px]">FULL</Badge>
              ) : c.active ? (
                <Badge className="text-[8px] bg-terminal-green/10 text-terminal-green border-terminal-green/30">ACTIVE</Badge>
              ) : (
                <Badge variant="outline" className="text-[8px]">DISABLED</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
