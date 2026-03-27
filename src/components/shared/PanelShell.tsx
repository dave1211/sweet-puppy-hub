import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

type GlowVariant = "blue" | "green" | "red" | "amber" | "cyan" | "none";

interface PanelShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
  glow?: GlowVariant;
  status?: "live" | "warn" | "error" | "offline";
}

const glowMap: Record<GlowVariant, string> = {
  blue: "glow-blue",
  green: "glow-green",
  red: "glow-red",
  amber: "glow-amber",
  cyan: "glow-cyan",
  none: "",
};

const statusDotMap: Record<string, string> = {
  live: "status-dot-live",
  warn: "status-dot-warn",
  error: "status-dot-error",
  offline: "status-dot-offline",
};

export const PanelShell = forwardRef<HTMLDivElement, PanelShellProps>(
  ({ title, subtitle, actions, children, className, noPad, glow = "none", status }, ref) => {
    return (
      <div ref={ref} className={cn("terminal-panel", glowMap[glow], className)}>
        <div className="terminal-panel-header">
          <div className="flex items-center gap-2 min-w-0">
            {status && <div className={cn("status-dot shrink-0", statusDotMap[status])} />}
            <div className="min-w-0">
              <h3 className="terminal-panel-title">{title}</h3>
              {subtitle && <p className="terminal-panel-subtitle mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        <div className={cn(noPad ? "" : "p-4")}>{children}</div>
      </div>
    );
  }
);
PanelShell.displayName = "PanelShell";
