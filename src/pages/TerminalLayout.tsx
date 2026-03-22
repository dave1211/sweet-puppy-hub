import { TerminalTopBar } from "@/components/layout/TerminalTopBar";
import { TerminalSidebar } from "@/components/layout/TerminalSidebar";
import { Outlet } from "react-router-dom";

const TerminalLayout = () => {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <TerminalTopBar />
      <div className="flex-1 flex overflow-hidden">
        <TerminalSidebar />
        <main className="flex-1 p-2 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <footer className="border-t border-border/40 px-4 py-1 shrink-0 bg-card/30">
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-mono text-muted-foreground/30 tracking-wider">
            TANNER TERMINAL — XRPL TRADING
          </p>
          <p className="text-[8px] font-mono text-muted-foreground/20 tracking-wider">
            BRIDGE
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TerminalLayout;
