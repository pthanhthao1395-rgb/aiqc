import { useState } from "react";
import { Search, ChevronRight, ChevronDown, Image, FileText, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface DefectCategory {
  id: string;
  name: string;
  count: number;
  children?: DefectCategory[];
}

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

function CategoryItem({ category, level = 0 }: { category: DefectCategory; level?: number }) {
  const [expanded, setExpanded] = useState(level === 0);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left",
          level > 0 && "border-l border-border ml-4"
        )}
        style={{ paddingLeft: `${(level * 16) + 16}px` }}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )
        ) : (
          <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        )}
        <span className={cn(
          "flex-1 font-medium",
          level === 0 ? "text-foreground" : "text-muted-foreground"
        )}>
          {category.name}
        </span>
        <span className="px-2 py-0.5 bg-secondary rounded-full text-xs font-mono text-muted-foreground">
          {category.count}
        </span>
      </button>
      
      {expanded && hasChildren && (
        <div className="animate-fade-in">
          {category.children!.map((child) => (
            <CategoryItem key={child.id} category={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaxonomyView() {
  const [searchQuery, setSearchQuery] = useState("");

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
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
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
              <CategoryItem key={category.id} category={category} />
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
                <h3 className="font-semibold text-foreground">Oil Stain</h3>
                <p className="text-sm text-muted-foreground">Surface Defects</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm text-foreground">
                  Dark or visible oil-based contamination on fabric surface. Often appears as irregular dark patches with defined edges.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Visual Characteristics</p>
                <ul className="text-sm text-foreground space-y-1">
                  <li>• Dark, irregular patches</li>
                  <li>• Defined edges with possible spreading</li>
                  <li>• May show fabric darkening or wetness</li>
                </ul>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Common Causes</p>
                <ul className="text-sm text-foreground space-y-1">
                  <li>• Machine oil leakage</li>
                  <li>• Handling contamination</li>
                  <li>• Storage environment issues</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Example Images */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Example Images</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-secondary border border-border overflow-hidden hover:border-primary transition-colors cursor-pointer"
                >
                  <img
                    src={`https://images.unsplash.com/photo-${1558171813 + i}-4c088753af8f?w=200&h=200&fit=crop`}
                    alt={`Example ${i}`}
                    className="w-full h-full object-cover"
                  />
                </div>
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
            <button className="text-sm text-primary hover:underline">
              Open Classification Guide →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
