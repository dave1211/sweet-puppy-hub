import { Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useTelegramAlert } from "@/hooks/useTelegramAlert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const TG_CHAT_ID_KEY = "tanner_tg_chat_id";

export function TelegramAlertButton({ signal }: { signal?: string }) {
  const [chatId, setChatId] = useState(() => localStorage.getItem(TG_CHAT_ID_KEY) || "");
  const [open, setOpen] = useState(false);
  const sendAlert = useTelegramAlert();

  useEffect(() => {
    if (chatId.trim()) localStorage.setItem(TG_CHAT_ID_KEY, chatId.trim());
  }, [chatId]);

  const handleSend = () => {
    if (!chatId.trim()) return;
    sendAlert.mutate(
      { chatId: chatId.trim(), message: signal || "🚨 Tanner Terminal Alert — check your dashboard!" },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-terminal-blue/10 text-terminal-blue hover:bg-terminal-blue/20 border border-terminal-blue/30 transition-colors">
          <Send className="h-3 w-3" />TG
        </button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono">Send Telegram Alert</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono text-muted-foreground">Chat ID or Channel @username</label>
            <input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="@mychannel or 123456789"
              className="w-full mt-1 px-3 py-2 rounded-md bg-muted border border-border text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {chatId.trim() && <p className="text-[9px] font-mono text-muted-foreground mt-1">✓ Auto-saved</p>}
          </div>
          <div className="bg-muted/50 rounded-md p-2 border border-border">
            <p className="text-[10px] font-mono text-muted-foreground">Preview:</p>
            <p className="text-[11px] font-mono text-foreground mt-1">{signal || "🚨 Tanner Terminal Alert"}</p>
          </div>
          <button
            onClick={handleSend}
            disabled={sendAlert.isPending || !chatId.trim()}
            className="w-full py-2 rounded-md bg-terminal-blue text-background text-xs font-mono font-bold hover:bg-terminal-blue/80 transition-colors disabled:opacity-50"
          >
            {sendAlert.isPending ? "SENDING…" : "SEND ALERT"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
