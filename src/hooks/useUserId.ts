import { useAuth } from "@/contexts/AuthContext";

export function useUserId(): string {
  const { user } = useAuth();
  if (!user) throw new Error("useUserId requires authenticated user");
  return user.id;
}
