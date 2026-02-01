import { Check, X, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ✅ Local inspection thumbnails
import demo0 from "@/assets/inspection/demo.jpeg";
import demo1 from "@/assets/inspection/demo1.jpeg";
import demo2 from "@/assets/inspection/demo2.jpeg";
import demo3 from "@/assets/inspection/demo3.jpeg";

interface Inspection {
  id: string;
  imageUrl: string;
  defectType: string;
  confidence: number;
  status: "confirmed" | "rejected" | "pending";
  timestamp: string;
  productCode: string;
}

const recentInspections: Inspection[] = [
  {
    id: "INS-001",
    imageUrl: demo0,
    defectType: "Stain",
    confidence: 92,
    status: "confirmed",
    timestamp: "2 min ago",
    productCode: "SKU-A1234",
  },
  {
    id: "INS-002",
    imageUrl: demo1,
    defectType: "Broken Stitch",
    confidence: 86,
    status: "pending",
    timestamp: "5 min ago",
    productCode: "SKU-B5678",
  },
  {
    id: "INS-003",
    imageUrl: demo2,
    defectType: "Hole",
    confidence: 74,
    status: "rejected",
    timestamp: "8 min ago",
    productCode: "SKU-C9012",
  },
  {
    id: "INS-004",
    imageUrl: demo3,
    defectType: "Fabric Scratch",
    confidence: 91,
    status: "confirmed",
    timestamp: "12 min ago",
    productCode: "SKU-D3456",
  },
];

const statusConfig = {
  confirmed: {
    icon: Check,
    label: "Confirmed",
    className: "bg-success/20 text-success",
  },
  rejected: {
    icon: X,
    label: "Rejected",
    className: "bg-destructive/20 text-destructive",
  },
  pending: {
    icon: Clock,
    label: "Pending",
    className: "bg-warning/20 text-warning",
  },
};

function getConfidenceColor(confidence: number) {
  if (confidence >= 85) return "text-success";
  if (confidence >= 70) return "text-warning";
  return "text-destructive";
}

export function RecentInspections() {
  return (
    <div className="bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Inspections</h3>
          <p className="text-sm text-muted-foreground">Latest AI-detected defects</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
          View All
        </button>
      </div>

      <div className="divide-y divide-border">
        {recentInspections.map((inspection, index) => {
          const StatusIcon = statusConfig[inspection.status].icon;

          return (
            <div
              key={inspection.id}
              className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={inspection.imageUrl}
                  alt={inspection.defectType}
                  className="w-14 h-14 rounded-lg object-cover border border-border"
                />
                {inspection.status === "pending" && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full animate-pulse" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{inspection.defectType}</span>
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="font-mono">{inspection.productCode}</span>
                  <span>•</span>
                  <span>{inspection.timestamp}</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="text-right">
                <span className={cn("text-lg font-bold font-mono", getConfidenceColor(inspection.confidence))}>
                  {inspection.confidence}%
                </span>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>

              {/* Status Badge */}
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  statusConfig[inspection.status].className
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig[inspection.status].label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
