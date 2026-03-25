import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Widget-level error boundary for dashboard panels.
 * Isolates failures so one broken widget doesn't crash the whole page.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Widget:${this.props.name ?? "unknown"}]`, error.message, info.componentStack?.slice(0, 200));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-border/50 bg-card/30 p-4 flex flex-col items-center justify-center gap-2 min-h-[80px]">
          <AlertTriangle className="h-4 w-4 text-terminal-amber" />
          <p className="text-[10px] font-mono text-muted-foreground text-center">
            {this.props.name ? `${this.props.name} failed to load` : "Widget error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-1 text-[9px] font-mono text-primary hover:text-primary/80 transition-colors"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
