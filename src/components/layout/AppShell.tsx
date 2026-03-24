import { Outlet, useNavigate } from "react-router-dom";
import { AppTopbar } from "./AppTopbar";
import { AppSidebar } from "./AppSidebar";
import { BottomStrip } from "./BottomStrip";
import { PriceTickerBar } from "./PriceTickerBar";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Eye } from "lucide-react";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isGuest, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden w-full">
      <AppTopbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      {isGuest && (
        <div className="bg-terminal-amber/10 border-b border-terminal-amber/20 px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-3 w-3 text-terminal-amber" />
            <span className="text-[10px] font-mono text-terminal-amber">GUEST MODE — READ-ONLY</span>
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
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}
        <div className={cn(
          "md:relative md:translate-x-0 transition-transform duration-200 z-40",
          "fixed top-12 bottom-0 left-0 md:static",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          <AppSidebar onNavigate={() => setSidebarOpen(false)} />
        </div>
        <main className="flex-1 overflow-y-auto p-3 md:p-4">
          <Outlet />
        </main>
      </div>
      <PriceTickerBar />
      <BottomStrip />
    </div>
  );
}
