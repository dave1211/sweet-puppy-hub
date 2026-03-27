import { createRoot } from "react-dom/client";

// Initialize logging and safe startup
console.info("[App] Starting Tanner Terminal...");

try {
  // Must be imported before App to inject device-id header
  import("./lib/supabaseInit").then(() => {
    console.info("[App] Supabase initialized");
  }).catch((err) => {
    console.error("[App] Supabase initialization failed:", err);
  });
} catch (err) {
  console.error("[App] Supabase import failed:", err);
}

import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) {
  const errorMsg = "Root element not found - invalid DOM state";
  console.error("[App]", errorMsg);
  document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#000;color:#fff;font-family:monospace;text-align:center"><div><h1 style="color:#ff0000;margin:0">FATAL ERROR</h1><p style="margin:10px 0;">${errorMsg}</p></div></div>`;
  throw new Error(errorMsg);
}

console.info("[App] Rendering React app...");
createRoot(rootElement).render(<App />);
console.info("[App] React render complete");
