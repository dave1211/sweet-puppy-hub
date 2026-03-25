import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Download, Share2, RefreshCw, Loader2, Image as ImageIcon, Type, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const STYLES = [
  { id: "dank", label: "Dank", emoji: "🔥" },
  { id: "classic", label: "Classic", emoji: "📸" },
  { id: "crypto", label: "Crypto", emoji: "📈" },
  { id: "wojak", label: "Wojak", emoji: "😭" },
  { id: "surreal", label: "Surreal", emoji: "🌀" },
];

const TEMPLATES = [
  { label: "Drake Approves", top: "Using mock data", bottom: "Using real live data" },
  { label: "Distracted BF", top: "New shitcoin launching", bottom: "My existing bags" },
  { label: "Galaxy Brain", top: "Buying the top", bottom: "Selling the bottom" },
  { label: "Stonks", top: "Portfolio down 90%", bottom: "But up 2% today" },
  { label: "This is Fine", top: "Market crashing", bottom: "Everything is fine" },
  { label: "To the Moon", top: "Diamond hands", bottom: "Never selling" },
];

const BG_COLORS = [
  "from-primary/20 to-terminal-cyan/20",
  "from-terminal-green/20 to-terminal-blue/20",
  "from-destructive/20 to-terminal-amber/20",
  "from-terminal-amber/20 to-primary/20",
  "from-terminal-cyan/20 to-destructive/20",
];

interface GeneratedMeme {
  id: string;
  prompt: string;
  style: string;
  topText: string | null;
  bottomText: string | null;
  createdAt: string;
  bgColor: string;
  imageUrl?: string | null;
}

export default function MemeGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [style, setStyle] = useState("crypto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [memes, setMemes] = useState<GeneratedMeme[]>([]);
  const [selectedMeme, setSelectedMeme] = useState<GeneratedMeme | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateMeme = async () => {
    if (!prompt.trim() && !topText.trim() && !bottomText.trim()) {
      toast.error("Enter a prompt or text for your meme");
      return;
    }
    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meme-generator`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt: prompt || `${topText} - ${bottomText}`, style, topText, bottomText }),
        }
      );

      if (!res.ok) throw new Error("Generation failed");
      const data = await res.json();

      const meme: GeneratedMeme = {
        ...data,
        bgColor: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
      };

      setMemes((prev) => [meme, ...prev]);
      setSelectedMeme(meme);
      toast.success("Meme generated! 🔥");
    } catch {
      // Fallback: generate locally
      const meme: GeneratedMeme = {
        id: crypto.randomUUID(),
        prompt: prompt || `${topText} - ${bottomText}`,
        style,
        topText: topText || null,
        bottomText: bottomText || null,
        createdAt: new Date().toISOString(),
        bgColor: BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)],
      };
      setMemes((prev) => [meme, ...prev]);
      setSelectedMeme(meme);
      toast.success("Meme created! 🎨");
    }

    setIsGenerating(false);
  };

  const downloadMeme = useCallback(() => {
    if (!selectedMeme) return;

    // If we have an AI-generated image URL, download that directly
    if (selectedMeme.imageUrl) {
      const link = document.createElement("a");
      link.download = `meme-${selectedMeme.id.slice(0, 8)}.png`;
      link.href = selectedMeme.imageUrl;
      link.click();
      toast.success("Meme downloaded!");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;

    const gradient = ctx.createLinearGradient(0, 0, 800, 800);
    gradient.addColorStop(0, "#0a0e1a");
    gradient.addColorStop(1, "#111827");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 800);

    ctx.fillStyle = style === "crypto" ? "rgba(59, 130, 246, 0.1)" : "rgba(34, 197, 94, 0.1)";
    ctx.fillRect(0, 0, 800, 800);

    if (selectedMeme.topText) {
      ctx.font = "bold 48px 'Impact', 'Arial Black', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.textAlign = "center";
      ctx.strokeText(selectedMeme.topText.toUpperCase(), 400, 80);
      ctx.fillText(selectedMeme.topText.toUpperCase(), 400, 80);
    }

    ctx.font = "bold 32px 'Arial', sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.textAlign = "center";
    const words = selectedMeme.prompt.split(" ");
    let line = "";
    let y = 350;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > 700) {
        ctx.fillText(line, 400, y);
        line = word + " ";
        y += 40;
      } else {
        line = test;
      }
    }
    ctx.fillText(line, 400, y);

    if (selectedMeme.bottomText) {
      ctx.font = "bold 48px 'Impact', 'Arial Black', sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 4;
      ctx.strokeText(selectedMeme.bottomText.toUpperCase(), 400, 740);
      ctx.fillText(selectedMeme.bottomText.toUpperCase(), 400, 740);
    }

    ctx.font = "12px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillText("TANNER TERMINAL", 400, 785);

    const link = document.createElement("a");
    link.download = `meme-${selectedMeme.id.slice(0, 8)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Meme downloaded!");
  }, [selectedMeme, style]);

  const shareMeme = () => {
    if (!selectedMeme) return;
    const text = `${selectedMeme.topText ?? ""} ${selectedMeme.bottomText ?? ""} — Made with Tanner Terminal 🔥`.trim();
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Meme text copied to clipboard!");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">MEME GENERATOR</h1>
          <p className="text-xs font-mono text-muted-foreground">Create & share crypto memes</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
          <Sparkles className="h-3 w-3" /> AI MEME ENGINE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Controls */}
        <div className="lg:col-span-5 space-y-3">
          {/* Style selector */}
          <div className="terminal-panel p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-2">
              <Palette className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Style</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono border transition-colors",
                    style === s.id
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted/20 text-muted-foreground border-border hover:text-foreground"
                  )}
                >
                  <span>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text inputs */}
          <div className="terminal-panel p-3 space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Type className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Text</span>
            </div>
            <Input value={topText} onChange={(e) => setTopText(e.target.value)} placeholder="Top text…" className="h-8 text-xs font-mono bg-background/50" maxLength={80} />
            <Input value={bottomText} onChange={(e) => setBottomText(e.target.value)} placeholder="Bottom text…" className="h-8 text-xs font-mono bg-background/50" maxLength={80} />
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your meme idea…" className="h-8 text-xs font-mono bg-background/50" maxLength={200} />
          </div>

          {/* Templates */}
          <div className="terminal-panel p-3 space-y-2">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Quick Templates</span>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => { setTopText(t.top); setBottomText(t.bottom); setPrompt(t.label); }}
                  className="text-left p-2 rounded bg-muted/20 border border-border/30 hover:bg-muted/30 hover:border-primary/20 transition-colors"
                >
                  <p className="text-[9px] font-mono font-bold text-foreground/80">{t.label}</p>
                  <p className="text-[7px] font-mono text-muted-foreground/50 mt-0.5 truncate">"{t.top}" / "{t.bottom}"</p>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateMeme} disabled={isGenerating} className="w-full h-10 font-mono text-xs bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20">
            {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating…</> : <><Sparkles className="h-4 w-4 mr-2" /> GENERATE MEME</>}
          </Button>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-3">
          {selectedMeme ? (
            <div className="terminal-panel overflow-hidden">
              <div className="terminal-panel-header">
                <span className="terminal-panel-title">Preview</span>
                <div className="flex items-center gap-1">
                  <button onClick={downloadMeme} className="p-1 hover:bg-muted/30 rounded transition-colors" title="Download"><Download className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
                  <button onClick={shareMeme} className="p-1 hover:bg-muted/30 rounded transition-colors" title="Share"><Share2 className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
                  <button onClick={generateMeme} className="p-1 hover:bg-muted/30 rounded transition-colors" title="Regenerate"><RefreshCw className="h-3 w-3 text-muted-foreground hover:text-foreground" /></button>
                </div>
              </div>
              {selectedMeme.imageUrl ? (
                <div className="aspect-square bg-background flex items-center justify-center">
                  <img src={selectedMeme.imageUrl} alt={selectedMeme.prompt} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className={cn("aspect-square flex flex-col items-center justify-between p-8 bg-gradient-to-br", selectedMeme.bgColor)}>
                  {selectedMeme.topText && (
                    <p className="text-xl sm:text-2xl font-bold text-foreground uppercase text-center font-mono tracking-wider" style={{ textShadow: "2px 2px 0 hsl(var(--background)), -1px -1px 0 hsl(var(--background))" }}>
                      {selectedMeme.topText}
                    </p>
                  )}
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-center text-muted-foreground/60 font-mono italic px-4">{selectedMeme.prompt}</p>
                  </div>
                  {selectedMeme.bottomText && (
                    <p className="text-xl sm:text-2xl font-bold text-foreground uppercase text-center font-mono tracking-wider" style={{ textShadow: "2px 2px 0 hsl(var(--background)), -1px -1px 0 hsl(var(--background))" }}>
                      {selectedMeme.bottomText}
                    </p>
                  )}
                </div>
              )}
              <div className="px-3 py-1.5 border-t border-border/30 flex items-center justify-between">
                <span className="text-[8px] font-mono text-muted-foreground/30">TANNER TERMINAL MEMES</span>
                <span className="text-[8px] font-mono text-muted-foreground/30">{selectedMeme.style.toUpperCase()}</span>
              </div>
            </div>
          ) : (
            <div className="terminal-panel p-8 flex flex-col items-center justify-center aspect-square">
              <ImageIcon className="h-10 w-10 text-muted-foreground/10 mb-3" />
              <p className="text-xs font-mono text-muted-foreground/30">Your meme will appear here</p>
              <p className="text-[9px] font-mono text-muted-foreground/20 mt-1">Choose a template or write your own</p>
            </div>
          )}

          {memes.length > 1 && (
            <div className="terminal-panel p-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Recent Memes</span>
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {memes.slice(0, 8).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMeme(m)}
                    className={cn(
                      "aspect-square rounded border p-1.5 transition-colors flex flex-col items-center justify-center text-center overflow-hidden",
                      selectedMeme?.id === m.id ? "border-primary/40 bg-primary/5" : "border-border/30 bg-muted/10 hover:bg-muted/20"
                    )}
                  >
                    {m.imageUrl ? (
                      <img src={m.imageUrl} alt="" className="w-full h-full object-cover rounded" />
                    ) : (
                      <p className="text-[7px] font-mono text-foreground/60 line-clamp-2">{m.topText ?? m.prompt.slice(0, 20)}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
