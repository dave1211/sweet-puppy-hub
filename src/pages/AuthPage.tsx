import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Lock, Mail, Wallet, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import bs58 from "@/lib/bs58Shim";

interface WalletWindow extends Window {
  solana?: { isPhantom?: boolean; providers?: Array<{ isPhantom?: boolean; isSolflare?: boolean }> };
  phantom?: { solana?: { isPhantom?: boolean } };
  solflare?: unknown;
}

function detectWallets(): { phantom: boolean; solflare: boolean } {
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
  return { phantom: hasPhantom, solflare: hasSolflare };
}

const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WalletChallengeSuccess {
  ok: true;
  data: {
    nonce: string;
    challengeToken: string;
    expiresAt: number;
  };
}

interface WalletChallengeFailure {
  ok: false;
  error?: {
    code?: string;
    message?: string;
  };
}

type WalletChallengeResponse = WalletChallengeSuccess | WalletChallengeFailure;

async function requestWalletChallenge(walletAddress: string): Promise<WalletChallengeSuccess["data"]> {
  console.info("[WalletAuth] challenge start", { walletAddress });

  if (!walletAuthKey) {
    throw new Error("Wallet auth key is missing");
  }

  const response = await fetch(walletAuthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: walletAuthKey,
      authorization: `Bearer ${walletAuthKey}`,
    },
    body: JSON.stringify({
      action: "challenge",
      walletAddress,
    }),
  });

  let data: WalletChallengeResponse | null = null;
  try {
    data = (await response.json()) as WalletChallengeResponse;
  } catch {
    console.error("[WalletAuth] challenge invalid json", { status: response.status });
    throw new Error("Wallet auth challenge returned invalid response");
  }

  console.info("[WalletAuth] challenge response", {
    status: response.status,
    ok: response.ok,
    payloadOk: Boolean(data && data.ok),
  });

  if (!response.ok || !data || !data.ok || !data.data?.nonce || !data.data?.challengeToken) {
    const message = data && "error" in data ? data.error?.message : "Failed to get wallet challenge";
    console.error("[WalletAuth] challenge failure", {
      status: response.status,
      payload: data,
    });
    throw new Error(message || "Failed to get wallet challenge");
  }

  console.info("[WalletAuth] challenge success", {
    walletAddress,
    expiresAt: data.data.expiresAt,
  });

  return data.data;
}

export default function AuthPage() {
  const { user, isLoading, signIn, signUp, signInWithWallet } = useAuth();
  const { connect, walletAddress, isConnected, provider, getWalletObject } = useWallet();
  const [showEmail, setShowEmail] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<"phantom" | "solflare" | null>(null);
  const [detected, setDetected] = useState<{ phantom: boolean; solflare: boolean }>({ phantom: true, solflare: true });

  useEffect(() => {
    // Wallet extensions inject after DOMContentLoaded; give them a moment
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

  if (user) return <Navigate to="/" replace />;

  const handleWalletAuth = async (providerType: "phantom" | "solflare") => {
    setSubmitting(true);
    setConnectingProvider(providerType);

    try {
      console.info("[WalletAuth] connect start", { provider: providerType });

      let address = walletAddress;
      if (!isConnected || !walletAddress || provider !== providerType) {
        address = await connect(providerType);
      }

      const wallet = getWalletObject();

      if (!address || !wallet?.publicKey) {
        throw new Error("Wallet not connected");
      }

      if (!wallet.signMessage) {
        throw new Error("Connected wallet does not support message signing");
      }

      const challenge = await requestWalletChallenge(address);

      const message = `Sign in to Tanner Terminal\nWallet: ${address}\nNonce: ${challenge.nonce}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      console.info("[WalletAuth] sign start", { walletAddress: address });
      const { signature } = await wallet.signMessage(messageBytes);
      console.info("[WalletAuth] sign success", { walletAddress: address });

      const signatureB58 = bs58.encode(signature);

      const { error } = await signInWithWallet(address, signatureB58, message, challenge.challengeToken);
      if (error) {
        console.error("[WalletAuth] auth failure", { walletAddress: address, error: error.message });
        toast.error(error.message);
      } else {
        toast.success("Signed in with wallet");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wallet auth failed";
      const normalizedMessage = /rejected|denied/i.test(msg) ? "Signature rejected by wallet" : msg;
      console.error("[WalletAuth] sign/auth failure", { provider: providerType, error: msg });
      toast.error(normalizedMessage);
    } finally {
      setSubmitting(false);
      setConnectingProvider(null);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Email and password required"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }

    setSubmitting(true);
    const { error } = mode === "login" ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else if (mode === "signup") {
      toast.success("Account created! You're now signed in.");
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
            Connect your wallet to get started
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary: Wallet connect */}
          <div className="space-y-2">
            <Button
              onClick={() => handleWalletAuth("phantom")}
              disabled={submitting}
              className="w-full font-mono text-sm"
            >
              {connectingProvider === "phantom" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
              CONNECT PHANTOM
            </Button>
            {!detected.phantom && (
              <div className="flex flex-col items-center gap-0.5 py-0.5">
                <span className="text-[9px] font-mono text-terminal-amber">Phantom not detected — Install:</span>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {[
                    { label: "Chrome / Brave / Edge", href: "https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa" },
                    { label: "Firefox", href: "https://addons.mozilla.org/en-US/firefox/addon/phantom-app/" },
                    { label: "iOS / Android", href: "https://phantom.app/download" },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[8px] font-mono text-primary/80 hover:text-primary underline underline-offset-2 transition-colors"
                    >
                      <ExternalLink className="h-2 w-2 shrink-0" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <Button
              onClick={() => handleWalletAuth("solflare")}
              disabled={submitting}
              variant="outline"
              className="w-full font-mono text-sm border-terminal-amber/30 text-terminal-amber hover:bg-terminal-amber/10"
            >
              {connectingProvider === "solflare" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
              CONNECT SOLFLARE
            </Button>
            {!detected.solflare && (
              <a
                href="https://solflare.com/download"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-[9px] font-mono text-terminal-amber hover:text-primary transition-colors py-0.5"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Solflare not detected — Install extension
              </a>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Secondary: Email fallback (collapsed) */}
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
        </CardContent>
        {(!detected.phantom || !detected.solflare) && (
          <div className="px-6 pb-4">
            <p className="text-[8px] font-mono text-muted-foreground/60 text-center leading-relaxed">
              Works on Chrome, Brave, Firefox, Edge & mobile wallet browsers.
              Install a Solana wallet extension to connect.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
