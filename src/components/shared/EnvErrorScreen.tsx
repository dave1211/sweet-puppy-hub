import { AlertTriangle } from "lucide-react";

interface EnvErrorScreenProps {
  missing: string[];
}

/**
 * Visible error screen when required env vars are missing.
 * Prevents white screen by showing a clear message.
 */
export function EnvErrorScreen({ missing }: EnvErrorScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(220,20%,4%)] text-[hsl(210,15%,92%)] p-6 gap-4">
      <AlertTriangle className="h-10 w-10 text-[hsl(38,92%,50%)]" />
      <h1 className="text-lg font-mono font-bold">Configuration Error</h1>
      <p className="text-xs font-mono text-[hsl(220,10%,45%)] text-center max-w-md">
        Tanner Terminal cannot start because required configuration is missing.
      </p>
      <div className="bg-[hsl(220,18%,7%)] border border-[hsl(220,14%,12%)] rounded-lg p-4 max-w-sm w-full">
        <p className="text-[10px] font-mono text-[hsl(220,10%,45%)] mb-2">Missing variables:</p>
        {missing.map((key) => (
          <p key={key} className="text-[10px] font-mono text-[hsl(0,72%,51%)]">• {key}</p>
        ))}
      </div>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-xs font-mono bg-[hsl(217,91%,60%)] text-[hsl(220,20%,4%)] rounded hover:opacity-80 transition-opacity"
      >
        RETRY
      </button>
    </div>
  );
}
