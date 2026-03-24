import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Returns a wrapper that blocks the action for guest users,
 * showing a sign-in prompt instead. Authenticated users pass through.
 *
 * Usage:
 *   const guard = useGuardedAction();
 *   <Button onClick={guard(() => doSomething(), "add to watchlist")}>
 */
export function useGuardedAction() {
  const { isGuest } = useAuth();

  return useCallback(
    (action: () => void, featureLabel?: string) => {
      return () => {
        if (isGuest) {
          toast.error(
            featureLabel
              ? `Sign in to ${featureLabel}`
              : "Sign in to use this feature",
            { description: "Guest mode is read-only." }
          );
          return;
        }
        action();
      };
    },
    [isGuest]
  );
}
