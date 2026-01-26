import { useState } from "react";
import { 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Check, 
  X, 
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Target,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DefectSuggestion {
  id: string;
  name: string;
  confidence: number;
  description: string;
}

const mockSuggestions: DefectSuggestion[] = [
  { id: "1", name: "Stain - Oil Based", confidence: 92, description: "Dark oil stain on fabric surface" },
  { id: "2", name: "Stain - Dye Transfer", confidence: 78, description: "Color bleeding from adjacent fabric" },
  { id: "3", name: "Dirty Mark", confidence: 65, description: "Surface contamination, possibly dust" },
  { id: "4", name: "Water Mark", confidence: 52, description: "Dried water spot pattern" },
  { id: "5", name: "Fabric Discoloration", confidence: 41, description: "Uneven color in affected area" },
];

function getConfidenceColor(confidence: number) {
  if (confidence >= 80) return "bg-success text-success-foreground";
  if (confidence >= 60) return "bg-warning text-warning-foreground";
  return "bg-destructive/20 text-destructive";
}

function getConfidenceBarColor(confidence: number) {
  if (confidence >= 80) return "bg-success";
  if (confidence >= 60) return "bg-warning";
  return "bg-destructive";
}

export function InspectionPanel() {
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [zoom, setZoom] = useState(100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Defect Inspection</h1>
          <p className="text-muted-foreground mt-1">Review and confirm AI-detected defects</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors glow-primary">
          <Upload className="w-4 h-4" />
          Upload Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Viewer */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">SKU-A1234</span>
              <span className="text-sm text-muted-foreground">• Lot #78921</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  showOverlay 
                    ? "bg-primary/20 text-primary" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="w-4 h-4" />
                AI Overlay
              </button>
              <div className="h-6 w-px bg-border" />
              <button
                onClick={() => setZoom(Math.max(50, zoom - 25))}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono text-muted-foreground w-12 text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 25))}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div className="relative aspect-video bg-background/50 flex items-center justify-center overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop"
              alt="Garment inspection"
              className="max-w-full max-h-full object-contain"
              style={{ transform: `scale(${zoom / 100})` }}
            />
            
            {/* Defect Overlay */}
            {showOverlay && (
              <>
                {/* Bounding box */}
                <div
                  className="defect-overlay border-warning"
                  style={{
                    left: "35%",
                    top: "25%",
                    width: "120px",
                    height: "80px",
                  }}
                >
                  <div className="absolute -top-7 left-0 px-2 py-1 bg-warning text-warning-foreground text-xs font-medium rounded">
                    Stain • 92%
                  </div>
                </div>

                {/* Heatmap overlay effect */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: "32%",
                    top: "22%",
                    width: "140px",
                    height: "100px",
                    background: "radial-gradient(ellipse at center, hsla(0, 72%, 51%, 0.3), transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />
              </>
            )}

            {/* Scan line animation */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div 
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-line"
              />
            </div>
          </div>

          {/* Info Bar */}
          <div className="flex items-center gap-6 px-4 py-3 border-t border-border bg-secondary/30">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Region:</span>
              <span className="font-mono text-foreground">x:245, y:180</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Area:</span>
              <span className="font-mono text-foreground">9,600 px²</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Model:</span>
              <span className="font-mono text-foreground">Qwen-VL v2.1</span>
            </div>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Suggestions</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Top-5 defect classifications</p>
          </div>

          <div className="divide-y divide-border">
            {mockSuggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => setSelectedSuggestion(suggestion.id)}
                className={cn(
                  "w-full p-4 text-left transition-colors animate-slide-in",
                  selectedSuggestion === suggestion.id
                    ? "bg-primary/10 border-l-2 border-primary"
                    : "hover:bg-accent/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{suggestion.name}</span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                          Best Match
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {suggestion.description}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold font-mono",
                    getConfidenceColor(suggestion.confidence)
                  )}>
                    {suggestion.confidence}%
                  </span>
                </div>
                
                {/* Confidence bar */}
                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", getConfidenceBarColor(suggestion.confidence))}
                    style={{ width: `${suggestion.confidence}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border space-y-3">
            <button
              disabled={!selectedSuggestion}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
                selectedSuggestion
                  ? "bg-success text-success-foreground hover:bg-success/90 glow-success"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              <Check className="w-5 h-5" />
              Confirm Selection
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-secondary text-foreground hover:bg-accent transition-colors">
                <ChevronDown className="w-4 h-4" />
                Other
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                <X className="w-4 h-4" />
                No Defect
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
