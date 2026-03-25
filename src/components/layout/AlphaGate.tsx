/**
 * Private alpha access gate.
 * When `private_alpha_mode` flag is enabled, requires invite code before granting app access.
 * Stores validated code in localStorage to avoid re-prompting.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ALPHA_KEY = "tt_alpha_access";

export function hasAlphaAccess(): boolean {
  return localStorage.getItem(ALPHA_KEY) === "granted";
}

export function AlphaGate({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [granted, setGranted] = useState(hasAlphaAccess);

  if (granted) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) {
      toast.error("Enter a valid invite code");
      return;
    }

    setChecking(true);
    try {
      // Check invite code via edge function (no direct table access for anon)
      const { data, error } = await supabase.functions.invoke("validate-invite", {
        body: { code: trimmed },
      });

      if (error || !data?.valid) {
        toast.error(data?.message ?? "Invalid or expired invite code");
        return;
      }

      localStorage.setItem(ALPHA_KEY, "granted");
      setGranted(true);
      toast.success("Welcome to the alpha!");
    } catch {
      toast.error("Failed to verify invite code");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-terminal-amber/30 bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-terminal-amber/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-terminal-amber" />
          </div>
          <CardTitle className="text-lg font-mono text-foreground">
            <span className="text-primary">PRIVATE</span> ALPHA
          </CardTitle>
          <p className="text-xs font-mono text-muted-foreground">
            Tanner Terminal is in private alpha. Enter your invite code to access.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="INVITE CODE"
              maxLength={32}
              className="font-mono text-center text-sm tracking-widest bg-muted/20 border-border"
            />
            <Button type="submit" disabled={checking} className="w-full font-mono text-sm">
              {checking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              VERIFY ACCESS
            </Button>
          </form>
          <p className="text-[8px] font-mono text-muted-foreground/60 text-center mt-4">
            Need an invite? Contact the team or wait for public launch.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
