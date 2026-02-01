import { useEffect, useMemo, useRef, useState } from "react";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Target,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** ========= Types ========= */
interface DefectSuggestion {
  id: string;
  name: string;
  confidence: number;
  description: string;
  category: "Surface Defects" | "Structural Defects" | "Stitching Defects";
}

type DecisionStatus = "pending" | "confirmed" | "no_defect";

interface ConfirmedDecision {
  id: string;
  timestamp: number;
  status: DecisionStatus;
  defectName: string;
  confidence?: number;
  notes?: string;
  fileName?: string;
  region: { x: number; y: number; width: number; height: number; areaPx2: number };
}

type DetectionPreset = {
  // top suggestions shown on the right panel
  suggestions: DefectSuggestion[];
  // overlay label & bbox/heatmap
  overlay: {
    label: string;
    bbox: { leftPct: number; topPct: number; wPx: number; hPx: number };
    heat: { leftPct: number; topPct: number; wPx: number; hPx: number };
  };
  // which suggestion should be auto-selected
  bestSuggestionName: string;
};

/** ========= Defect taxonomy (for "Other" + realistic set) ========= */
const DEFECT_GROUPS: Array<{
  group: "Surface Defects" | "Structural Defects" | "Stitching Defects";
  items: Array<{ name: string; description: string }>;
}> = [
  {
    group: "Surface Defects",
    items: [
      { name: "Oil Stain", description: "Dark oil stain on fabric surface" },
      { name: "Dye Transfer", description: "Color bleeding from adjacent fabric" },
      { name: "Water Mark", description: "Dried water spot pattern" },
      { name: "Dirty Mark", description: "Surface contamination (dust/soil)" },
      { name: "Discoloration", description: "Uneven color in affected area" },
    ],
  },
  {
    group: "Structural Defects",
    items: [
      { name: "Hole", description: "Missing fabric / puncture" },
      { name: "Tear", description: "Split fabric with visible rip line" },
      { name: "Worn Area", description: "Thinned fabric due to abrasion" },
      { name: "Physical Damage", description: "Visible damage/deformation on material" },
    ],
  },
  {
    group: "Stitching Defects",
    items: [
      { name: "Broken Stitch", description: "Stitch line interrupted / broken" },
      { name: "Loose Thread", description: "Thread ends not secured" },
      { name: "Skipped Stitch", description: "Missing stitches along seam" },
      { name: "Uneven Stitching", description: "Inconsistent stitch length/spacing" },
    ],
  },
];

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

/** ========= Default suggestions (like demo.jpeg) ========= */
const DEFAULT_SUGGESTIONS: DefectSuggestion[] = [
  {
    id: "s1",
    name: "Oil Stain",
    confidence: 92,
    description: "Dark oil stain on fabric surface",
    category: "Surface Defects",
  },
  {
    id: "s2",
    name: "Dye Transfer",
    confidence: 78,
    description: "Color bleeding from adjacent fabric",
    category: "Surface Defects",
  },
  {
    id: "s3",
    name: "Dirty Mark",
    confidence: 65,
    description: "Surface contamination (dust/soil)",
    category: "Surface Defects",
  },
  {
    id: "s4",
    name: "Water Mark",
    confidence: 52,
    description: "Dried water spot pattern",
    category: "Surface Defects",
  },
  {
    id: "s5",
    name: "Discoloration",
    confidence: 41,
    description: "Uneven color in affected area",
    category: "Surface Defects",
  },
];

const DEFAULT_PRESET: DetectionPreset = {
  suggestions: DEFAULT_SUGGESTIONS,
  bestSuggestionName: "Oil Stain",
  overlay: {
    label: "Stain • 92%",
    bbox: { leftPct: 35, topPct: 25, wPx: 120, hPx: 80 },
    heat: { leftPct: 32, topPct: 22, wPx: 140, hPx: 100 },
  },
};

/** ========= 3 demo files presets =========
 * - demo.jpeg  -> Stain (92%) (default)
 * - demo1.jpeg -> Hole (86%)
 * - demo2.jpeg -> Broken Stitch (74%)
 * - others     -> same as demo.jpeg (default)
 */
const DETECTION_BY_FILENAME: Record<string, DetectionPreset> = {
  "demo.jpeg": DEFAULT_PRESET,

  "demo1.jpeg": {
    suggestions: [
      {
        id: "d1_1",
        name: "Hole",
        confidence: 86,
        description: "Missing fabric / puncture",
        category: "Structural Defects",
      },
      {
        id: "d1_2",
        name: "Tear",
        confidence: 63,
        description: "Split fabric with visible rip line",
        category: "Structural Defects",
      },
      {
        id: "d1_3",
        name: "Physical Damage",
        confidence: 49,
        description: "Visible damage/deformation on material",
        category: "Structural Defects",
      },
      {
        id: "d1_4",
        name: "Worn Area",
        confidence: 38,
        description: "Thinned fabric due to abrasion",
        category: "Structural Defects",
      },
      {
        id: "d1_5",
        name: "Dirty Mark",
        confidence: 31,
        description: "Surface contamination (dust/soil)",
        category: "Surface Defects",
      },
    ],
    bestSuggestionName: "Hole",
    overlay: {
      label: "Hole • 86%",
      bbox: { leftPct: 45.43, topPct: 48.57, wPx: 100, hPx: 70 }, 
      heat: { leftPct: 42.43, topPct: 45.57, wPx: 140, hPx: 110 },
    },
  },

  "demo2.jpeg": {
    suggestions: [
      {
        id: "d2_1",
        name: "Broken Stitch",
        confidence: 74,
        description: "Stitch line interrupted / broken",
        category: "Stitching Defects",
      },
      {
        id: "d2_2",
        name: "Loose Thread",
        confidence: 61,
        description: "Thread ends not secured",
        category: "Stitching Defects",
      },
      {
        id: "d2_3",
        name: "Skipped Stitch",
        confidence: 47,
        description: "Missing stitches along seam",
        category: "Stitching Defects",
      },
      {
        id: "d2_4",
        name: "Uneven Stitching",
        confidence: 33,
        description: "Inconsistent stitch length/spacing",
        category: "Stitching Defects",
      },
      {
        id: "d2_5",
        name: "Oil Stain",
        confidence: 29,
        description: "Dark oil stain on fabric surface",
        category: "Surface Defects",
      },
    ],
    bestSuggestionName: "Broken Stitch",
    overlay: {
      label: "Broken Stitch • 74%",
      bbox: { leftPct: 43.14, topPct: 46.71, wPx: 155, hPx: 70 }, // 140 × 80 = 11,200
      heat: { leftPct: 40.14, topPct: 43.71, wPx: 180, hPx: 140 },
    },
  },

  // Optional: nếu bạn có demo.jpg thay vì demo.jpeg thì add thêm:
  // "demo.jpg": DEFAULT_PRESET,
  // "demo1.jpg": ...,
  // "demo2.jpg": ...,
};

/** ========= Small Toast (no dependency) ========= */
function Toast({
  open,
  title,
  description,
  variant = "default",
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed right-4 top-4 z-50">
      <div
        className={cn(
          "w-[360px] max-w-[90vw] rounded-xl border px-4 py-3 shadow-lg backdrop-blur",
          variant === "destructive"
            ? "border-destructive/30 bg-destructive/10"
            : "border-border bg-card/90"
        )}
      >
        <div className="flex items-start gap-3">
          {variant === "destructive" ? (
            <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-foreground">{title}</div>
            {description && <div className="text-sm text-muted-foreground mt-0.5">{description}</div>}
          </div>
          <button
            className="ml-auto text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close toast"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** ========= Lightweight Modal (no dependency) ========= */
function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close modal" />
      <div className="relative w-[640px] max-w-[92vw] rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="font-semibold text-foreground">{title}</div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/** ========= Main Component ========= */
export function InspectionPanel() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);

  // Mock metadata (you can wire later)
  const sku = "SKU-A1234";
  const lot = "Lot #78921";

  // image state
  const [imageUrl, setImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop"
  );
  const [imageFileName, setImageFileName] = useState<string | undefined>(undefined);

  // UI controls
  const [showOverlay, setShowOverlay] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // detection state
  const [suggestions, setSuggestions] = useState<DefectSuggestion[]>(DEFAULT_PRESET.suggestions);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);

  // overlay state
  const [overlayLabel, setOverlayLabel] = useState(DEFAULT_PRESET.overlay.label);
  const [region, setRegion] = useState(DEFAULT_PRESET.overlay.bbox);
  const [heatmap, setHeatmap] = useState(DEFAULT_PRESET.overlay.heat);

  // decision & history
  const [decisionStatus, setDecisionStatus] = useState<DecisionStatus>("pending");
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<ConfirmedDecision[]>([]);

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTitle, setToastTitle] = useState("");
  const [toastDesc, setToastDesc] = useState<string | undefined>(undefined);
  const [toastVariant, setToastVariant] = useState<"default" | "destructive">("default");

  const toast = (title: string, description?: string, variant: "default" | "destructive" = "default") => {
    setToastTitle(title);
    setToastDesc(description);
    setToastVariant(variant);
    setToastOpen(true);
  };

  // Other modal
  const [otherOpen, setOtherOpen] = useState(false);
  const [selectedOther, setSelectedOther] = useState<{
    group: DefectSuggestion["category"];
    name: string;
    description: string;
  } | null>(null);

  // Cleanup blob URL
  useEffect(() => {
    return () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  const selectedSuggestion = useMemo(
    () => suggestions.find((s) => s.id === selectedSuggestionId) ?? null,
    [suggestions, selectedSuggestionId]
  );

  const regionMeta = useMemo(() => {
    // demo coordinate math (you can replace with real pixel math if you track img size)
    const x = Math.round(region.leftPct * 7);
    const y = Math.round(region.topPct * 7);
    const areaPx2 = region.wPx * region.hPx;
    return { x, y, width: region.wPx, height: region.hPx, areaPx2 };
  }, [region]);

  const applyPreset = (preset: DetectionPreset, fileName?: string) => {
    // suggestions
    setSuggestions(preset.suggestions);

    // overlay region
    setOverlayLabel(preset.overlay.label);
    setRegion(preset.overlay.bbox);
    setHeatmap(preset.overlay.heat);

    // auto-select best match
    const best = preset.suggestions.find((s) => s.name === preset.bestSuggestionName) ?? preset.suggestions[0];
    setSelectedSuggestionId(best?.id ?? null);

    // reset decision
    setDecisionStatus("pending");
    setNotes("");

    if (fileName) toast("Detection loaded", `Applied preset for ${fileName}.`);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Invalid file", "Please upload an image file.", "destructive");
      return;
    }

    // cleanup previous blob
    if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);

    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setImageFileName(file.name);

    // preset logic: only 3 demo files have different detections; others use default
    const preset = DETECTION_BY_FILENAME[file.name] ?? DEFAULT_PRESET;
    applyPreset(preset, file.name);

    // reset view
    setZoom(100);
    setRotation(0);
  };

  // viewer interactions
  const onViewerClick = (e: React.MouseEvent) => {
    // Move bbox for demo realism (you can remove if you don't want)
    if (!viewerRef.current) return;
    const rect = viewerRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const leftPct = clamp(px * 100 - 5, 0, 90);
    const topPct = clamp(py * 100 - 5, 0, 90);

    setRegion((r) => ({ ...r, leftPct, topPct }));
    setHeatmap((h) => ({ ...h, leftPct: clamp(leftPct - 3, 0, 90), topPct: clamp(topPct - 3, 0, 90) }));
  };

  // zoom/rotate
  const zoomIn = () => setZoom((z) => Math.min(200, z + 25));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 25));
  const rotateCW = () => setRotation((r) => (r + 90) % 360);
  const rotateCCW = () => setRotation((r) => (r + 270) % 360);
  const resetView = () => {
    setZoom(100);
    setRotation(0);
  };

  // selecting suggestion also updates overlay label (so it “feels” reactive)
  useEffect(() => {
    if (!selectedSuggestion) return;
    setOverlayLabel(`${selectedSuggestion.name} • ${selectedSuggestion.confidence}%`);
  }, [selectedSuggestion]);

  // decisions
  const confirmSelection = () => {
    if (!selectedSuggestion) return;

    const record: ConfirmedDecision = {
      id: uid("confirm"),
      timestamp: Date.now(),
      status: "confirmed",
      defectName: selectedSuggestion.name,
      confidence: selectedSuggestion.confidence,
      notes: notes.trim() ? notes.trim() : undefined,
      fileName: imageFileName,
      region: {
        x: regionMeta.x,
        y: regionMeta.y,
        width: regionMeta.width,
        height: regionMeta.height,
        areaPx2: regionMeta.areaPx2,
      },
    };

    setHistory((h) => [record, ...h]);
    setDecisionStatus("confirmed");
    toast("Confirmed", `Saved: ${selectedSuggestion.name} (${selectedSuggestion.confidence}%).`);
  };

  const markNoDefect = () => {
    const record: ConfirmedDecision = {
      id: uid("nodefect"),
      timestamp: Date.now(),
      status: "no_defect",
      defectName: "No Defect",
      notes: notes.trim() ? notes.trim() : undefined,
      fileName: imageFileName,
      region: {
        x: regionMeta.x,
        y: regionMeta.y,
        width: regionMeta.width,
        height: regionMeta.height,
        areaPx2: regionMeta.areaPx2,
      },
    };

    setHistory((h) => [record, ...h]);
    setDecisionStatus("no_defect");
    setSelectedSuggestionId(null);
    toast("Marked as No Defect", "Saved decision: No defect found.");
  };

  // Other defect: pick from taxonomy and add/select into suggestions
  const addOtherToSuggestions = () => {
    if (!selectedOther) {
      toast("Select a defect", "Please choose a defect from the list.", "destructive");
      return;
    }

    const newItem: DefectSuggestion = {
      id: uid("other"),
      name: selectedOther.name,
      confidence: 55, // default for manual
      description: selectedOther.description,
      category: selectedOther.group,
    };

    setSuggestions((prev) => [newItem, ...prev]);
    setSelectedSuggestionId(newItem.id);
    setDecisionStatus("pending");
    setOtherOpen(false);
    toast("Added (Other)", `Selected: ${newItem.name}`);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Toast
        open={toastOpen}
        title={toastTitle}
        description={toastDesc}
        variant={toastVariant}
        onClose={() => setToastOpen(false)}
      />

      {/* Hidden uploader */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Defect Inspection</h1>
          <p className="text-muted-foreground mt-1">Review and confirm AI-detected defects</p>
        </div>
        <button
          onClick={triggerUpload}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors glow-primary"
        >
          <Upload className="w-4 h-4" />
          Upload Image
        </button>
      </div>

      {/* Status banner */}
      {decisionStatus !== "pending" && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl border",
            decisionStatus === "confirmed"
              ? "bg-success/10 border-success/30 text-foreground"
              : "bg-secondary border-border text-foreground"
          )}
        >
          {decisionStatus === "confirmed" ? (
            <Check className="w-5 h-5 text-success" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          )}
          <div className="text-sm">
            {decisionStatus === "confirmed" ? (
              <>
                <span className="font-medium">Confirmed:</span>{" "}
                <span className="text-muted-foreground">
                  {history[0]?.defectName} {history[0]?.confidence ? `(${history[0]?.confidence}%)` : ""}
                </span>
              </>
            ) : (
              <>
                <span className="font-medium">Saved:</span>{" "}
                <span className="text-muted-foreground">No Defect</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => {
                setDecisionStatus("pending");
                toast("Back to review", "Decision reset to pending.");
              }}
              className="px-3 py-1.5 rounded-lg text-sm bg-secondary hover:bg-accent transition-colors"
            >
              Re-open
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image Viewer */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{sku}</span>
              <span className="text-sm text-muted-foreground">• {lot}</span>
              {imageFileName && <span className="text-xs text-muted-foreground ml-2">• {imageFileName}</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  showOverlay ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="w-4 h-4" />
                AI Overlay
              </button>

              <div className="h-6 w-px bg-border" />

              <button
                onClick={zoomOut}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono text-muted-foreground w-12 text-center">{zoom}%</span>
              <button
                onClick={zoomIn}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                onClick={rotateCCW}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={rotateCW}
                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={resetView}
                className="px-3 py-1.5 rounded-lg text-sm bg-secondary text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div
            ref={viewerRef}
            onClick={onViewerClick}
            className="relative aspect-video bg-background/50 flex items-center justify-center overflow-hidden cursor-crosshair"
            title="Click to move bbox (demo)"
          >
            <img
              src={imageUrl}
              alt="Garment inspection"
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: "center",
              }}
            />

            {/* Overlay */}
            {showOverlay && (
              <>
                {/* Bounding box */}
                <div
                  style={{
                    position: "absolute",
                    left: `${region.leftPct}%`,
                    top: `${region.topPct}%`,
                    width: `${region.wPx}px`,
                    height: `${region.hPx}px`,
                    borderWidth: 2,
                    borderStyle: "solid",
                    borderRadius: 12,
                  }}
                  className="border-warning"
                >
                  <div className="absolute -top-7 left-0 px-2 py-1 bg-warning text-warning-foreground text-xs font-medium rounded">
                    {overlayLabel}
                  </div>
                </div>

                {/* Heatmap */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${heatmap.leftPct}%`,
                    top: `${heatmap.topPct}%`,
                    width: `${heatmap.wPx}px`,
                    height: `${heatmap.hPx}px`,
                    background: "radial-gradient(ellipse at center, hsla(0, 72%, 51%, 0.30), transparent 70%)",
                    filter: "blur(8px)",
                  }}
                />
              </>
            )}

            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-scan-line" />
            </div>
          </div>

          {/* Notes */}
          <div className="px-4 py-3 border-t border-border bg-card">
            <label className="text-sm font-medium text-foreground">Inspector Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes (optional): root cause, severity, operator feedback..."
              className="mt-2 w-full min-h-[90px] rounded-lg border border-border bg-background/60 p-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Info Bar */}
          <div className="flex items-center gap-6 px-4 py-3 border-t border-border bg-secondary/30">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Region:</span>
              <span className="font-mono text-foreground">
                x:{regionMeta.x}, y:{regionMeta.y}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Area:</span>
              <span className="font-mono text-foreground">{regionMeta.areaPx2.toLocaleString()} px²</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Model:</span>
              <span className="font-mono text-foreground">Qwen-VL v2.1</span>
            </div>
          </div>

          {/* History */}
          <div className="px-4 py-3 border-t border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-foreground">Decision History</div>
              <button
                onClick={() => {
                  setHistory([]);
                  toast("Cleared history", "All local decisions removed.");
                }}
                className="text-xs px-2 py-1 rounded-lg bg-secondary hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>

            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground mt-2">No decisions yet.</div>
            ) : (
              <div className="mt-2 max-h-32 overflow-auto pr-2 space-y-2">
                {history.slice(0, 12).map((h) => (
                  <div key={h.id} className="flex items-start justify-between gap-3 p-2 rounded-lg bg-secondary/40">
                    <div className="min-w-0">
                      <div className="text-sm text-foreground font-medium">
                        {h.status === "confirmed" ? "Confirmed" : "No Defect"} •{" "}
                        <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {h.defectName}
                        {h.confidence ? ` • ${h.confidence}%` : ""} • region {h.region.x},{h.region.y}
                        {h.notes ? ` • note: ${h.notes}` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setDecisionStatus(h.status);
                        setNotes(h.notes ?? "");
                        toast("Loaded decision", "Restored decision to UI state.");
                      }}
                      className="text-xs px-2 py-1 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Suggestions Panel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">AI Suggestions</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Top-5 defect classifications</p>
          </div>

          <div className="divide-y divide-border">
            {suggestions.map((s, index) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedSuggestionId(s.id);
                  setDecisionStatus("pending");
                }}
                className={cn(
                  "w-full p-4 text-left transition-colors animate-slide-in",
                  selectedSuggestionId === s.id ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent/50"
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{s.name}</span>
                      {index === 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded">
                          Best Match
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">• {s.category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{s.description}</p>
                  </div>
                  <span className={cn("px-2 py-1 rounded-full text-xs font-bold font-mono", getConfidenceColor(s.confidence))}>
                    {s.confidence}%
                  </span>
                </div>

                <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", getConfidenceBarColor(s.confidence))}
                    style={{ width: `${s.confidence}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-border space-y-3">
            <button
              onClick={confirmSelection}
              disabled={!selectedSuggestionId}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all",
                selectedSuggestionId
                  ? "bg-success text-success-foreground hover:bg-success/90 glow-success"
                  : "bg-secondary text-muted-foreground cursor-not-allowed"
              )}
            >
              <Check className="w-5 h-5" />
              Confirm Selection
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setOtherOpen(true);
                  setSelectedOther(null);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-secondary text-foreground hover:bg-accent transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
                Other
              </button>

              <button
                onClick={markNoDefect}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <X className="w-4 h-4" />
                No Defect
              </button>
            </div>

            {/* Quick actions */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Quick actions</span>

                <button
                  onClick={() => {
                    // demo "re-detect": randomize bbox; keep suggestions
                    setRegion((r) => ({
                      ...r,
                      leftPct: 20 + Math.random() * 55,
                      topPct: 15 + Math.random() * 55,
                      wPx: 110 + Math.round(Math.random() * 70),
                      hPx: 70 + Math.round(Math.random() * 60),
                    }));
                    setHeatmap((h) => ({
                      ...h,
                      leftPct: clamp(region.leftPct - 3, 0, 90),
                      topPct: clamp(region.topPct - 3, 0, 90),
                    }));
                    setDecisionStatus("pending");
                    toast("Re-detected (demo)", "Overlay region updated.");
                  }}
                  className="px-2 py-1 rounded-md bg-secondary hover:bg-accent transition-colors"
                >
                  Re-detect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OTHER MODAL */}
      <Modal open={otherOpen} title="Choose a defect (Other)" onClose={() => setOtherOpen(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: taxonomy list */}
          <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border text-sm font-semibold text-foreground">
              Defect taxonomy
            </div>

            <div className="max-h-[360px] overflow-auto">
              {DEFECT_GROUPS.map((g) => (
                <div key={g.group} className="border-b border-border last:border-b-0">
                  <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {g.group}
                  </div>
                  <div className="space-y-1 pb-3">
                    {g.items.map((it) => {
                      const active = selectedOther?.name === it.name && selectedOther?.group === g.group;
                      return (
                        <button
                          key={it.name}
                          onClick={() =>
                            setSelectedOther({
                              group: g.group,
                              name: it.name,
                              description: it.description,
                            })
                          }
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-accent/40 transition-colors",
                            active && "bg-primary/10"
                          )}
                        >
                          <span className="w-2 h-2 rounded-full bg-primary/70" />
                          <div className="min-w-0">
                            <div className="text-sm text-foreground">{it.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{it.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: preview & actions */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-sm font-semibold text-foreground">Selection</div>
            <div className="mt-2">
              {selectedOther ? (
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Defect:</span>{" "}
                    <span className="font-semibold text-foreground">{selectedOther.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Category:</span>{" "}
                    <span className="text-foreground">{selectedOther.group}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Description:</span>{" "}
                    <span className="text-foreground">{selectedOther.description}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    This will be added into suggestions with default confidence 55% (manual).
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Pick a defect on the left.</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setOtherOpen(false)}
                className="px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={addOtherToSuggestions}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add & Select
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
