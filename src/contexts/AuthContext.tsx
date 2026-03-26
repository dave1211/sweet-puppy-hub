import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type WalletSignInError = Error & { code?: string };

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  signInWithWallet: (
    walletAddress: string,
    signature: string,
    message: string,
    challengeToken: string,
    deviceId?: string,
    options?: { signal?: AbortSignal }
  ) => Promise<{ error: WalletSignInError | null }>;
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
  error?: { code?: string; message?: string };
}

type WalletAuthResponse = WalletAuthSuccess | WalletAuthFailure;
const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function createWalletSignInError(message: string, code?: string): WalletSignInError {
  const error = new Error(message) as WalletSignInError;
  if (code) error.code = code;
  return error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  const enterGuestMode = () => setIsGuest(true);

  const checkAdmin = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: userId,
        _role: "admin",
      });
      setIsAdmin(!error && Boolean(data));
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (nextUser?.id) {
        setTimeout(() => {
          void checkAdmin(nextUser.id);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info("[Auth] onAuthStateChange", { event, userId: nextSession?.user?.id ?? null });
      applySession(nextSession);
      setIsLoading(false);
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          console.warn("[Auth] getSession failed", error.message);
        }
        applySession(data.session ?? null);
      })
      .catch((error) => {
        console.error("[Auth] getSession exception", error);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    const timeout = setTimeout(() => {
      setIsLoading((prev) => {
        if (prev) console.warn("[Auth] Timed out waiting for auth init, forcing ready");
        return false;
      });
    }, 6000);

    return () => {
      active = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signInWithWallet = async (
    walletAddress: string,
    signature: string,
    message: string,
    challengeToken: string,
    deviceId?: string,
    options?: { signal?: AbortSignal }
  ) => {
    try {
      if (!walletAuthKey) {
        return { error: createWalletSignInError("Wallet auth key is missing", "CONFIGURATION_ERROR") };
      }

      const response = await fetch(walletAuthUrl, {
        method: "POST",
        signal: options?.signal,
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
      try { payload = (await response.json()) as WalletAuthResponse; } catch {
        return { error: createWalletSignInError("Wallet auth returned invalid response", "INVALID_RESPONSE") };
      }

      if (!response.ok || !payload || !payload.ok || !payload.data?.session) {
        const messageFromPayload = payload && "error" in payload ? payload.error?.message : undefined;
        const codeFromPayload = payload && "error" in payload ? payload.error?.code : undefined;
        return { error: createWalletSignInError(messageFromPayload || "Wallet auth failed", codeFromPayload || "WALLET_AUTH_FAILED") };
      }

      const { session: walletSession } = payload.data;
      if (!walletSession?.access_token) {
        return { error: createWalletSignInError("No session returned", "NO_SESSION") };
      }

      const { error: setErr } = await supabase.auth.setSession({
        access_token: walletSession.access_token,
        refresh_token: walletSession.refresh_token,
      });

      if (setErr) return { error: createWalletSignInError(setErr.message, "SESSION_SET_FAILED") };

      setIsGuest(false);
      return { error: null };
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { error: createWalletSignInError("Authentication request was cancelled", "REQUEST_ABORTED") };
      }
      const msg = err instanceof Error ? err.message : "Wallet auth failed";
      return { error: createWalletSignInError(msg, "WALLET_AUTH_FAILED") };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsGuest(false);
  };

  return (
    <AuthContext.Provider value={{
      user, session, isLoading, isAdmin, isGuest,
      enterGuestMode, signInWithWallet, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
