import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Wallet, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import bs58 from "@/lib/bs58Shim";

interface WalletWindow extends Window {
  solana?: { isPhantom?: boolean; providers?: Array<{ isPhantom?: boolean; isSolflare?: boolean }> };
  phantom?: { solana?: { isPhantom?: boolean } };
  solflare?: unknown;
  backpack?: unknown;
}

function detectWallets(): { phantom: boolean; solflare: boolean; backpack: boolean } {
  const win = window as unknown as WalletWindow;
  const hasPhantom = !!(
    win.phantom?.solana?.isPhantom ||
    win.solana?.isPhantom ||
    win.solana?.providers?.some((p) => p?.isPhantom)
  );
  const hasSolflare = !!(
    win.solflare ||
    (win.solana && "isSolflare" in win.solana && win.solana.isSolflare) ||
    win.solana?.providers?.some((p) => p?.isSolflare)
  );
  const hasBackpack = !!win.backpack;
  return { phantom: hasPhantom, solflare: hasSolflare, backpack: hasBackpack };
}

/** Detect if running inside Phantom's in-app browser */
function isPhantomBrowser(): boolean {
  const win = window as unknown as WalletWindow;
  return !!(win.phantom?.solana?.isPhantom || win.solana?.isPhantom);
}

const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WalletChallengeSuccess {
  ok: true;
  data: { nonce: string; challengeToken: string; expiresAt: number };
}
interface WalletChallengeFailure {
  ok: false;
  error?: { code?: string; message?: string };
}
type WalletChallengeResponse = WalletChallengeSuccess | WalletChallengeFailure;

async function requestWalletChallenge(walletAddress: string): Promise<WalletChallengeSuccess["data"]> {
  if (!walletAuthKey) throw new Error("Auth configuration missing");

  const response = await fetch(walletAuthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: walletAuthKey,
      authorization: `Bearer ${walletAuthKey}`,
    },
    body: JSON.stringify({ action: "challenge", walletAddress }),
  });

  let data: WalletChallengeResponse | null = null;
  try {
    data = (await response.json()) as WalletChallengeResponse;
  } catch {
    throw new Error("Auth service returned invalid response");
  }

  if (!response.ok || !data || !data.ok || !data.data?.nonce || !data.data?.challengeToken) {
    const message = data && "error" in data ? data.error?.message : "Failed to get challenge";
    throw new Error(message || "Failed to get challenge");
  }

  return data.data;
}

export default function AuthPage() {
  const { user, isLoading, isGuest, enterGuestMode, signIn, signUp, signInWithWallet } = useAuth();
  const { connect, walletAddress, isConnected, provider, getWalletObject } = useWallet();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<"phantom" | "solflare" | "backpack" | null>(null);
  const [detected, setDetected] = useState({ phantom: true, solflare: true, backpack: true });
  const [authError, setAuthError] = useState<string | null>(null);
  const inPhantomBrowser = isPhantomBrowser();

  useEffect(() => {
    const timer = setTimeout(() => setDetected(detectWallets()), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Authenticated → dashboard (NEVER redirect externally)
  if (user || isGuest) return <Navigate to="/" replace />;

  const handleWalletAuth = async (providerType: "phantom" | "solflare" | "backpack") => {
    setSubmitting(true);
    setConnectingProvider(providerType);
    setAuthError(null);

    try {
      let address = walletAddress;
      if (!isConnected || !walletAddress || provider !== providerType) {
        address = await connect(providerType);
      }

      const wallet = getWalletObject();
      if (!address || !wallet?.publicKey) throw new Error("Wallet not connected");
      if (!wallet.signMessage) throw new Error("Wallet does not support message signing");

      const challenge = await requestWalletChallenge(address);
      const message = `Sign in to Tanner Terminal\nWallet: ${address}\nNonce: ${challenge.nonce}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      const { signature } = await wallet.signMessage(messageBytes);
      const signatureB58 = bs58.encode(signature);

      const { error } = await signInWithWallet(address, signatureB58, message, challenge.challengeToken);
      if (error) {
        setAuthError(error.message);
        toast.error(error.message);
      } else {
        toast.success("Authenticated — entering terminal");
        // Navigate handled by the redirect check above on re-render
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      const normalizedMessage = /rejected|denied/i.test(msg) ? "Signature rejected by wallet" : msg;
      setAuthError(normalizedMessage);
      toast.error(normalizedMessage);
    } finally {
      setSubmitting(false);
      setConnectingProvider(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) { toast.error("Email and password required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setSubmitting(true);
    const { error } = mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);

    if (error) {
      setAuthError(error.message);
      toast.error(error.message);
    } else if (mode === "signup") {
      toast.success("Account created — entering terminal");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-xl font-mono font-bold text-foreground">
            <span className="text-primary">TANNER</span> TERMINAL
          </CardTitle>
          <p className="text-[10px] font-mono text-muted-foreground">
            {inPhantomBrowser ? "Wallet detected — authenticate below" : "Connect your Solana wallet to enter"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error display with retry */}
          {authError && (
            <div className="flex items-start gap-2 rounded border border-destructive/30 bg-destructive/5 p-2">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] font-mono text-destructive">{authError}</p>
                <button
                  onClick={() => setAuthError(null)}
                  className="text-[9px] font-mono text-muted-foreground hover:text-foreground mt-1 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Primary: Wallet connect — all in-app, no redirects */}
          <div className="space-y-2">
            <Button
              onClick={() => handleWalletAuth("phantom")}
              disabled={submitting}
              className="w-full font-mono text-sm"
            >
              {connectingProvider === "phantom" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
              {inPhantomBrowser ? "AUTHENTICATE WITH PHANTOM" : "CONNECT PHANTOM"}
            </Button>

            {!inPhantomBrowser && (
              <>
                <Button
                  onClick={() => handleWalletAuth("solflare")}
                  disabled={submitting}
                  variant="outline"
                  className="w-full font-mono text-sm border-terminal-amber/30 text-terminal-amber hover:bg-terminal-amber/10"
                >
                  {connectingProvider === "solflare" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                  CONNECT SOLFLARE
                </Button>
                <Button
                  onClick={() => handleWalletAuth("backpack")}
                  disabled={submitting}
                  variant="outline"
                  className="w-full font-mono text-sm border-terminal-cyan/30 text-terminal-cyan hover:bg-terminal-cyan/10"
                >
                  {connectingProvider === "backpack" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                  CONNECT BACKPACK
                </Button>
              </>
            )}
          </div>

          {/* Guest mode */}
          <Button
            onClick={enterGuestMode}
            variant="ghost"
            className="w-full font-mono text-xs text-muted-foreground hover:text-foreground border border-dashed border-border"
          >
            BROWSE AS GUEST (READ-ONLY)
          </Button>

          {/* Email fallback — NO OAuth, NO external redirects */}
          {!inPhantomBrowser && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] font-mono text-muted-foreground">OR</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={() => setShowEmail(!showEmail)}
                className="flex items-center justify-center gap-2 w-full text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <Mail className="h-3 w-3" />
                {showEmail ? "HIDE" : "USE"} EMAIL / PASSWORD
                {showEmail ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showEmail && (
                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 font-mono text-sm bg-muted/20 border-border"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 font-mono text-sm bg-muted/20 border-border"
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full font-mono text-sm">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setMode(mode === "login" ? "signup" : "login")}
                      className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
                    >
                      {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </CardContent>
        <div className="px-6 pb-4">
          <p className="text-[8px] font-mono text-muted-foreground/60 text-center leading-relaxed">
            Tanner Terminal is a self-contained application. All authentication happens inside the app.
            No external redirects. Install a Solana wallet extension to connect.
          </p>
        </div>
      </Card>
    </div>
  );
}
