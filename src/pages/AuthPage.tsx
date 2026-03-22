import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";

export default function AuthPage() {
  const { user, isLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
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
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
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
            </div>
            <div className="space-y-1">
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
            </div>
            <Button type="submit" disabled={submitting} className="w-full font-mono text-sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
