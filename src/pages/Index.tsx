import { TerminalHeader } from "@/components/terminal/TerminalHeader";
import { Outlet } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <TerminalHeader />
      <main className="flex-1 p-3 md:p-6 max-w-[1600px] mx-auto w-full">
        <Outlet />
      </main>
      <footer className="border-t border-border px-4 py-2">
        <p className="text-[10px] font-mono text-muted-foreground text-center">
          TANNER TERMINAL v2.0 — SOLANA LAUNCHPAD & RUG PROTECTION
        </p>
      </footer>
    </div>
  );
};

export default Index;
