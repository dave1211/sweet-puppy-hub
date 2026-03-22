import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}

export const PanelShell = forwardRef<HTMLDivElement, PanelShellProps>(
  ({ title, subtitle, actions, children, className, noPad }, ref) => {
    return (
      <div ref={ref} className={cn("terminal-panel", className)}>
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
);
PanelShell.displayName = "PanelShell";
