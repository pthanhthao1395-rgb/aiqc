import { useMemo, useState } from "react";
import {
  Search,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  FileText,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Local sample images (src/assets/sample-images)
import img0 from "@/assets/sample-images/image.jpg";
import img1 from "@/assets/sample-images/image1.jpg";
import img2 from "@/assets/sample-images/image2.jpg";
import img3 from "@/assets/sample-images/image3.jpg";

interface DefectCategory {
  id: string;
  name: string;
  count: number;
  children?: DefectCategory[];
}

type LeafDefect = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
};

const taxonomyData: DefectCategory[] = [
  {
    id: "surface",
    name: "Surface Defects",
    count: 847,
    children: [
      { id: "stain-oil", name: "Oil Stain", count: 234 },
      { id: "stain-dye", name: "Dye Transfer", count: 189 },
      { id: "stain-water", name: "Water Mark", count: 156 },
      { id: "dirty", name: "Dirty Mark", count: 142 },
      { id: "discolor", name: "Discoloration", count: 126 },
    ],
  },
  {
    id: "structural",
    name: "Structural Defects",
    count: 523,
    children: [
      { id: "hole", name: "Hole", count: 198 },
      { id: "tear", name: "Tear", count: 145 },
      { id: "worn", name: "Worn Area", count: 98 },
      { id: "damage", name: "Physical Damage", count: 82 },
    ],
  },
  {
    id: "stitching",
    name: "Stitching Defects",
    count: 412,
    children: [
      { id: "broken-stitch", name: "Broken Stitch", count: 167 },
      { id: "loose-thread", name: "Loose Thread", count: 123 },
      { id: "skip-stitch", name: "Skipped Stitch", count: 78 },
      { id: "uneven", name: "Uneven Stitching", count: 44 },
    ],
  },
  {
    id: "alignment",
    name: "Alignment Issues",
    count: 289,
    children: [
      { id: "misaligned", name: "Misaligned Seam", count: 134 },
      { id: "asymmetric", name: "Asymmetric Pattern", count: 98 },
      { id: "twisted", name: "Twisted Construction", count: 57 },
    ],
  },
];

// ✅ Optional: content for details panel per defect leaf
const DEFECT_DETAILS: Record<
  string,
  {
    description: string;
    visual: string[];
    causes: string[];
  }
> = {
  "stain-oil": {
    description:
      "Dark or visible oil-based contamination on fabric surface. Often appears as irregular dark patches with defined edges.",
    visual: ["Dark, irregular patches", "Defined edges with possible spreading", "May show fabric darkening or wetness"],
    causes: ["Machine oil leakage", "Handling contamination", "Storage environment issues"],
  },
  hole: {
    description: "A puncture or missing fabric area. Often small but clearly visible when stretched or backlit.",
    visual: ["Visible missing fabric", "Sharp or frayed edges", "May expand under tension"],
    causes: ["Needle damage", "Sharp object contact", "Handling/transport impact"],
  },
  "broken-stitch": {
    description: "Stitch line interrupted or broken, causing seam integrity issues and potential opening.",
    visual: ["Interrupted stitch line", "Loose ends present", "Potential seam opening under stress"],
    causes: ["Thread break", "Incorrect machine tension", "Needle wear / setup issues"],
  },
};

const SAMPLE_IMAGES = [
  { id: 0, src: img0 },
  { id: 1, src: img1 },
  { id: 2, src: img2 },
  { id: 3, src: img3 },
];

function flattenLeaves(data: DefectCategory[]): LeafDefect[] {
  const out: LeafDefect[] = [];
  for (const parent of data) {
    for (const child of parent.children ?? []) {
      out.push({
        id: child.id,
        name: child.name,
        categoryId: parent.id,
        categoryName: parent.name,
      });
    }
  }
  return out;
}

function highlight(text: string, query: string) {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  const before = text.slice(0, idx);
  const mid = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <>
      {before}
      <span className="bg-primary/20 text-primary px-1 rounded">{mid}</span>
      {after}
    </>
  );
}

function CategoryItem({
  category,
  level = 0,
  searchQuery,
  selectedLeafId,
  onSelectLeaf,
}: {
  category: DefectCategory;
  level?: number;
  searchQuery: string;
  selectedLeafId: string | null;
  onSelectLeaf: (leaf: LeafDefect) => void;
}) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = (category.children?.length ?? 0) > 0;

  // Filter children by search
  const filteredChildren = useMemo(() => {
    if (!hasChildren) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return category.children!;
    return category.children!.filter((c) => c.name.toLowerCase().includes(q));
  }, [category.children, hasChildren, searchQuery]);

  // If searching, auto expand categories that have matches
  const autoExpanded = useMemo(() => {
    if (!searchQuery.trim()) return expanded;
    return filteredChildren.length > 0;
  }, [searchQuery, filteredChildren.length, expanded]);

  const effectiveExpanded = autoExpanded;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left",
          level > 0 && "border-l border-border ml-4"
        )}
        style={{ paddingLeft: `${level * 16 + 16}px` }}
      >
        {hasChildren ? (
          effectiveExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )
        ) : (
          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        )}

        <span
          className={cn("flex-1 font-medium", level === 0 ? "text-foreground" : "text-muted-foreground")}
        >
          {highlight(category.name, searchQuery)}
        </span>

        <span className="px-2 py-0.5 bg-secondary rounded-full text-xs font-mono text-muted-foreground">
          {category.count}
        </span>
      </button>

      {effectiveExpanded && hasChildren && (
        <div className="animate-fade-in">
          {(searchQuery.trim() ? filteredChildren : category.children!)!.map((child) => {
            const isSelected = selectedLeafId === child.id;
            return (
              <button
                key={child.id}
                onClick={() =>
                  onSelectLeaf({
                    id: child.id,
                    name: child.name,
                    categoryId: category.id,
                    categoryName: category.name,
                  })
                }
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left border-l border-border ml-4",
                  isSelected && "bg-primary/10 border-l-2 border-primary"
                )}
                style={{ paddingLeft: `${(level + 1) * 16 + 16}px` }}
              >
                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                <span className={cn("flex-1 font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                  {highlight(child.name, searchQuery)}
                </span>

                <span className="px-2 py-0.5 bg-secondary rounded-full text-xs font-mono text-muted-foreground">
                  {child.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      <div className="relative w-[900px] max-w-[92vw] rounded-2xl border border-border bg-card shadow-xl">
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

export function TaxonomyView() {
  const [searchQuery, setSearchQuery] = useState("");
  const leaves = useMemo(() => flattenLeaves(taxonomyData), []);
  const [selected, setSelected] = useState<LeafDefect>(() => leaves[0]);

  // Sample image preview modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const details = DEFECT_DETAILS[selected.id] ?? {
    description: "No details added yet. You can extend DEFECT_DETAILS to provide structured guidance.",
    visual: ["—"],
    causes: ["—"],
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Defect Taxonomy</h1>
          <p className="text-muted-foreground mt-1">Hierarchical classification of defect types</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Tree */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search defect types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Tree View */}
          <div className="divide-y divide-border">
            {taxonomyData.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                searchQuery={searchQuery}
                selectedLeafId={selected?.id ?? null}
                onSelectLeaf={(leaf) => setSelected(leaf)}
              />
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div className="space-y-6">
          {/* Selected Defect Info */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-warning/20">
                <Tag className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selected.name}</h3>
                <p className="text-sm text-muted-foreground">{selected.categoryName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">{details.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Visual Characteristics</p>
                <ul className="text-sm text-foreground space-y-1">
                  {details.visual.map((v, idx) => (
                    <li key={idx}>• {v}</li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Common Causes</p>
                <ul className="text-sm text-foreground space-y-1">
                  {details.causes.map((c, idx) => (
                    <li key={idx}>• {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Example Images (LOCAL) */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-1">
              <ImageIcon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Example Images</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Reference samples (not AI detections). Click an image to preview.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {SAMPLE_IMAGES.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    setPreviewSrc(img.src);
                    setPreviewOpen(true);
                  }}
                  className="aspect-square rounded-lg bg-secondary border border-border overflow-hidden hover:border-primary transition-colors cursor-pointer"
                  title="Open preview"
                >
                  <img
                    src={img.src}
                    alt={`Sample image ${img.id + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Documentation Link */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-info" />
              <h3 className="font-semibold text-foreground">Documentation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              View detailed classification guidelines and inspection procedures.
            </p>
            <button className="text-sm text-primary hover:underline">Open Classification Guide →</button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title="Sample Image Preview"
        onClose={() => {
          setPreviewOpen(false);
          setPreviewSrc(null);
        }}
      >
        <div className="space-y-3">
          {/* <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{selected.name}</span>{" "}
            <span>• {selected.categoryName}</span>
          </div> */}

          <div className="rounded-xl border border-border bg-secondary/20 overflow-hidden">
            {previewSrc ? (
              <img src={previewSrc} alt="Preview" className="w-full max-h-[70vh] object-contain bg-black/5" />
            ) : (
              <div className="p-8 text-sm text-muted-foreground">No image selected.</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
