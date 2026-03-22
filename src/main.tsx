import { createRoot } from "react-dom/client";
import "./lib/supabaseInit"; // Must be before App to inject device-id header
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
