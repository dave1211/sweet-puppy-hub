import { Outlet } from "react-router-dom";
import { AppTopbar } from "./AppTopbar";
import { AppSidebar } from "./AppSidebar";
import { BottomStrip } from "./BottomStrip";
import { SidebarProvider } from "@/components/ui/sidebar";

export function AppShell() {
  return (
    <SidebarProvider>
      <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden w-full">
        <AppTopbar />
        <div className="flex-1 flex overflow-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto p-3 md:p-4">
            <Outlet />
          </main>
        </div>
        <BottomStrip />
      </div>
    </SidebarProvider>
  );
}
