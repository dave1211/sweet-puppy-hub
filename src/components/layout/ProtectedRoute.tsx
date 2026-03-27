import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute — guards authenticated routes.
 * 
 * SIMPLIFIED: removed aggressive has_role("user") boot check that was
 * causing login loops. The role is assigned during wallet-auth; if it
 * races, the user still has a valid session and should not be blocked.
 * Role-gated features are handled by TierContext, not route guards.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isGuest } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user && !isGuest) return <Navigate to="/auth" replace />;

  return <>{children}</>;
}
