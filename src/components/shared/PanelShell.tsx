import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}

export function PanelShell({ title, subtitle, actions, children, className, noPad }: PanelShellProps) {
  return (
    <div className={cn("terminal-panel", className)}>
      <div className="terminal-panel-header">
        <div>
          <h3 className="terminal-panel-title">{title}</h3>
          {subtitle && <p className="terminal-panel-subtitle mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className={cn(noPad ? "" : "p-4")}>{children}</div>
    </div>
  );
}
