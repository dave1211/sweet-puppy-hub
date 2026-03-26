import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, AlertTriangle, RefreshCw, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type BootState = "checking" | "ready" | "session_restore_failed" | "app_boot_failed";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isGuest, signOut } = useAuth();
  const [bootState, setBootState] = useState<BootState>("checking");
  const [bootErrorMessage, setBootErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const verifyBoot = async () => {
      if (!user) {
        if (!cancelled) {
          setBootState("checking");
          setBootErrorMessage(null);
        }
        return;
      }

      if (!cancelled) {
        setBootState("checking");
        setBootErrorMessage(null);
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        const session = data.session;

        if (error || !session || session.user.id !== user.id) {
          if (!cancelled) {
            setBootState("session_restore_failed");
            setBootErrorMessage("Session restore failed. Refresh your session to continue.");
          }
          return;
        }

        const { data: hasAccess, error: accessError } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "user",
        });

        if (!accessError && hasAccess === false) {
          if (!cancelled) {
            setBootState("app_boot_failed");
            setBootErrorMessage("Access assignment is incomplete. Reconnect your wallet to repair access.");
          }
          return;
        }

        if (!cancelled) setBootState("ready");
      } catch {
        if (!cancelled) {
          setBootState("app_boot_failed");
          setBootErrorMessage("App boot failed. Refresh the session or sign in again.");
        }
      }
    };

    void verifyBoot();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleRefreshSession = async () => {
    setBootState("checking");
    setBootErrorMessage(null);
    await supabase.auth.refreshSession();
    window.location.reload();
  };

  const handleSignInAgain = async () => {
    await signOut();
    window.location.href = "/auth";
  };

  if (isLoading || (user && bootState === "checking")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/auth" replace />;

  if (user && bootState !== "ready") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background px-4">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-mono text-foreground">
                {bootState === "session_restore_failed" ? "Session restore failed" : "Tanner Terminal boot failed"}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground">
                {bootErrorMessage ?? "Please refresh session and retry."}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button onClick={() => void handleRefreshSession()} className="font-mono text-xs">
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh session
            </Button>
            <Button variant="outline" onClick={() => void handleSignInAgain()} className="font-mono text-xs">
              <LogOut className="h-3.5 w-3.5 mr-1" /> Sign in again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
