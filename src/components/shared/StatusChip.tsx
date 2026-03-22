import { cn } from "@/lib/utils";

type ChipVariant = "success" | "danger" | "warning" | "info" | "muted" | "primary";

const VARIANTS: Record<ChipVariant, string> = {
  success: "bg-terminal-green/10 text-terminal-green border-terminal-green/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-terminal-amber/10 text-terminal-amber border-terminal-amber/20",
  info: "bg-primary/10 text-primary border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/10 text-primary border-primary/20",
};

interface StatusChipProps {
  variant: ChipVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export function StatusChip({ variant, children, className, dot }: StatusChipProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border", VARIANTS[variant], className)}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", variant === "success" ? "bg-terminal-green" : variant === "danger" ? "bg-destructive" : variant === "warning" ? "bg-terminal-amber" : "bg-primary")} />}
      {children}
    </span>
  );
}
