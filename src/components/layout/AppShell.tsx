import { Outlet, useNavigate } from "react-router-dom";
import { AppTopbar } from "./AppTopbar";
import { AppSidebar } from "./AppSidebar";
import { BottomStrip } from "./BottomStrip";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Eye } from "lucide-react";

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden w-full">
      <AppTopbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
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
      <BottomStrip />
    </div>
  );
}
