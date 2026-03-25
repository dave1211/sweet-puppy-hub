import { useReferralInvites } from "@/hooks/useReferralInvites";
import { Button } from "@/components/ui/button";
import { Copy, Gift, Users, Loader2, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export function ReferralPanel() {
  const { invites, used, remaining, createInvite, isLoading } = useReferralInvites();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    const url = `${window.location.origin}/auth?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Invite link copied!");
  };

  const shareCode = (code: string) => {
    const url = `${window.location.origin}/auth?ref=${code}`;
    const text = `🚀 Join me on Tanner Terminal — the Solana intelligence platform. Use my invite: ${url}`;
    if (navigator.share) {
      navigator.share({ title: "Tanner Terminal Invite", text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Share text copied!");
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-terminal-amber" />
          <h3 className="text-xs font-mono font-bold text-foreground">INVITE FRIENDS</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
          <Users className="h-3 w-3" />
          {used} joined · {remaining} left
        </div>
      </div>

      <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">
        Share your invite codes. When friends sign up, you both earn rewards. You get {remaining > 0 ? remaining : 0} more invites.
      </p>

      {remaining > 0 && (
        <Button
          onClick={() => createInvite.mutate()}
          disabled={createInvite.isPending}
          size="sm"
          className="w-full font-mono text-[10px]"
        >
          {createInvite.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Gift className="h-3 w-3 mr-1" />}
          GENERATE INVITE CODE
        </Button>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
      ) : invites.length === 0 ? (
        <p className="text-[9px] font-mono text-muted-foreground text-center py-2">No invites yet. Generate one above.</p>
      ) : (
        <div className="space-y-1.5">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-muted/30 border border-border/50">
              <div>
                <span className="text-[10px] font-mono font-bold text-foreground">{inv.invite_code}</span>
                {inv.used_by ? (
                  <span className="ml-2 text-[8px] font-mono text-terminal-green">✓ USED</span>
                ) : (
                  <span className="ml-2 text-[8px] font-mono text-terminal-amber">AVAILABLE</span>
                )}
              </div>
              {!inv.used_by && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyCode(inv.invite_code, inv.id)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Copy link"
                  >
                    {copiedId === inv.id ? <Check className="h-3 w-3 text-terminal-green" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => shareCode(inv.invite_code)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Share"
                  >
                    <Share2 className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
