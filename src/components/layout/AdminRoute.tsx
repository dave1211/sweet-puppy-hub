import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Wraps admin-only pages. Redirects non-admin users to home.
 * Guests are also blocked (they have no session, so isAdmin is false).
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isGuest } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Guests or non-admin authenticated users are redirected
  if (isGuest || !user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
