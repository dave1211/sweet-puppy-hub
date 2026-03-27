import { Outlet, useNavigate } from "react-router-dom";
import { AppTopbar } from "./AppTopbar";
import { AppSidebar } from "./AppSidebar";
import { BottomStrip } from "./BottomStrip";
import { PriceTickerBar } from "./PriceTickerBar";
import { useState, Component, type ReactNode, type ErrorInfo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, AlertTriangle, RefreshCw } from "lucide-react";

/** Inner error boundary so page crashes don't blank the whole shell */
class PageErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[PageError]", error.message, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-6">
          <div className="rounded-full bg-terminal-amber/10 p-4">
            <AlertTriangle className="h-8 w-8 text-terminal-amber" />
          </div>
          <p className="text-sm font-mono text-foreground">Something went wrong</p>
          <p className="text-[10px] font-mono text-muted-foreground max-w-sm text-center leading-relaxed">
            {this.state.error?.message || "Unknown error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mt-2"
          >
            <RefreshCw className="h-3 w-3" />
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isGuest, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden w-full">
      <AppTopbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      {isGuest && (
        <div className="bg-terminal-amber/5 border-b border-terminal-amber/15 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-terminal-amber" />
            <span className="text-[10px] font-mono text-terminal-amber/80">GUEST MODE — READ-ONLY</span>
          </div>
          <button
            onClick={() => { signOut(); navigate("/auth"); }}
            className="text-[10px] font-mono text-primary hover:text-primary/80 underline underline-offset-2"
          >
            SIGN IN
          </button>
        </div>
      )}
      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className={cn(
          "md:relative md:translate-x-0 transition-transform duration-200 z-40",
          "fixed top-12 bottom-0 left-0 md:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <AppSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-y-auto p-3 md:p-5">
          <PageErrorBoundary>
            <Outlet />
          </PageErrorBoundary>
        </main>
      </div>
      <PriceTickerBar />
      <BottomStrip />
    </div>
  );
}
