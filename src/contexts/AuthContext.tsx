import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithWallet: (
    walletAddress: string,
    signature: string,
    message: string,
    challengeToken: string,
    deviceId?: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface WalletAuthSuccess {
  ok: true;
  data: {
    session: {
      access_token: string;
      refresh_token: string;
      expires_in?: number;
      token_type?: string;
    };
  };
}

interface WalletAuthFailure {
  ok: false;
  error?: {
    code?: string;
    message?: string;
  };
}

type WalletAuthResponse = WalletAuthSuccess | WalletAuthFailure;
const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const enterGuestMode = () => setIsGuest(true);

  const checkAdmin = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.info("[Auth] onAuthStateChange", { event, userId: session?.user?.id ?? null });
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (session?.user?.id) {
          setTimeout(() => checkAdmin(session.user.id), 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    const timeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) {
          console.warn("[Auth] Timed out waiting for INITIAL_SESSION, forcing ready");
        }
        return false;
      });
    }, 3000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (_email: string, _password: string) => {
    return { error: new Error("Email signup is disabled. Use Phantom wallet authentication.") };
  };

  const signIn = async (_email: string, _password: string) => {
    return { error: new Error("Email login is disabled. Use Phantom wallet authentication.") };
  };

  const signInWithWallet = async (
    walletAddress: string,
    signature: string,
    message: string,
    challengeToken: string,
    deviceId?: string
  ) => {
    try {
      if (!walletAuthKey) {
        return { error: new Error("Wallet auth key is missing") };
      }

      const response = await fetch(walletAuthUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: walletAuthKey,
          authorization: `Bearer ${walletAuthKey}`,
        },
        body: JSON.stringify({
          action: "verify",
          walletAddress,
          signature,
          message,
          challengeToken,
          deviceId,
          host: window.location.hostname,
          userAgent: navigator.userAgent,
        }),
      });

      let payload: WalletAuthResponse | null = null;
      try {
        payload = (await response.json()) as WalletAuthResponse;
      } catch {
        return { error: new Error("Wallet auth returned invalid response") };
      }

      if (!response.ok || !payload || !payload.ok || !payload.data?.session) {
        const messageFromPayload = payload && "error" in payload ? payload.error?.message : undefined;
        return { error: new Error(messageFromPayload || "Wallet auth failed") };
      }

      const { session: walletSession } = payload.data;
      if (!walletSession?.access_token) {
        return { error: new Error("No session returned") };
      }

      const { error: setErr } = await supabase.auth.setSession({
        access_token: walletSession.access_token,
        refresh_token: walletSession.refresh_token,
      });

      if (setErr) {
        return { error: new Error(setErr.message) };
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wallet auth failed";
      return { error: new Error(msg) };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, isGuest, enterGuestMode, signUp, signIn, signInWithWallet, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
