import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("[404] Route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        <AlertTriangle className="h-10 w-10 text-terminal-amber mx-auto" />
        <h1 className="text-3xl font-mono font-bold text-foreground">404</h1>
        <p className="text-sm font-mono text-muted-foreground">Route not found</p>
        <p className="text-[10px] font-mono text-muted-foreground/60 break-all">{location.pathname}</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 text-xs font-mono bg-primary text-primary-foreground rounded hover:bg-primary/80 transition-colors"
        >
          BACK TO TERMINAL
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
