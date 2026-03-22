import { TerminalTopBar } from "@/components/layout/TerminalTopBar";
import { TerminalSidebar } from "@/components/layout/TerminalSidebar";
import { Outlet } from "react-router-dom";

const TerminalLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TerminalTopBar />
      <div className="flex-1 flex overflow-hidden">
        <TerminalSidebar />
        <main className="flex-1 p-3 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border px-4 py-1.5 shrink-0">
        <p className="text-[9px] font-mono text-muted-foreground text-center">
          TANNER TERMINAL v1.0.0 — Phase 1 — XRPL Native
        </p>
      </footer>
    </div>
  );
};

export default TerminalLayout;
