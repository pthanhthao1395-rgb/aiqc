import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Calendar,
  Download,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type DatePreset = "last_7" | "last_30" | "last_90" | "custom";

type FilterState = {
  defects: string[]; // allowed defect labels
  minMatchRate: number; // 0..100
};

const confusionData = [
  { actual: "Stain", predicted: "Stain", value: 89 },
  { actual: "Stain", predicted: "Dirty", value: 8 },
  { actual: "Stain", predicted: "Other", value: 3 },
  { actual: "Hole", predicted: "Hole", value: 92 },
  { actual: "Hole", predicted: "Tear", value: 6 },
  { actual: "Stitch", predicted: "Stitch", value: 85 },
  { actual: "Stitch", predicted: "Loose", value: 12 },
];

const weeklyData = [
  { week: "W1", accuracy: 84, overrideRate: 18, inspections: 312 },
  { week: "W2", accuracy: 86, overrideRate: 15, inspections: 345 },
  { week: "W3", accuracy: 89, overrideRate: 12, inspections: 378 },
  { week: "W4", accuracy: 91, overrideRate: 10, inspections: 401 },
];

const defectByLine = [
  { line: "Line A", stain: 23, hole: 12, stitch: 8, scratch: 5 },
  { line: "Line B", stain: 18, hole: 15, stitch: 11, scratch: 7 },
  { line: "Line C", stain: 31, hole: 9, stitch: 14, scratch: 3 },
  { line: "Line D", stain: 14, hole: 21, stitch: 6, scratch: 9 },
];

const metrics = [
  { label: "Top-5 Accuracy", value: "94.2%", trend: 2.3, isPositive: true },
  { label: "Override Rate", value: "8.4%", trend: -1.2, isPositive: true },
  { label: "Avg. Latency", value: "1.2s", trend: -0.1, isPositive: true },
  { label: "False Positive", value: "3.1%", trend: 0.4, isPositive: false },
];

const DEFECT_OPTIONS = ["Stain", "Dirty", "Hole", "Tear", "Stitch", "Loose", "Other", "Scratch"] as const;

function formatDateLabel(preset: DatePreset, from?: string, to?: string) {
  if (preset === "last_7") return "Last 7 Days";
  if (preset === "last_30") return "Last 30 Days";
  if (preset === "last_90") return "Last 90 Days";
  if (preset === "custom") {
    if (from && to) return `${from} → ${to}`;
    if (from) return `From ${from}`;
    if (to) return `Until ${to}`;
    return "Custom Range";
  }
  return "Last 30 Days";
}

function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, any>[], columns: string[]) {
  const esc = (v: any) => {
    const s = String(v ?? "");
    // CSV escaping
    if (/[",\n]/.test(s)) return `"${s.replaceAll('"', '""')}"`;
    return s;
  };

  const header = columns.map(esc).join(",");
  const body = rows
    .map((r) => columns.map((c) => esc(r[c])).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}

export function AnalyticsView() {
  // Date filter state (UI + export metadata)
  const [dateOpen, setDateOpen] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30");
  const [dateFrom, setDateFrom] = useState<string>(""); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState<string>(""); // YYYY-MM-DD

  // Filter panel state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    defects: ["Stain", "Hole", "Stitch", "Dirty", "Other"], // default
    minMatchRate: 0,
  });

  const dateLabel = useMemo(
    () => formatDateLabel(datePreset, dateFrom, dateTo),
    [datePreset, dateFrom, dateTo]
  );

  // Apply filters to confusion table
  const filteredConfusion = useMemo(() => {
    const allowed = new Set(filters.defects);
    return confusionData.filter((r) => {
      const okDefect = allowed.has(r.actual) || allowed.has(r.predicted);
      const okRate = r.value >= filters.minMatchRate;
      return okDefect && okRate;
    });
  }, [filters.defects, filters.minMatchRate]);

  // Bar chart: show only selected defect keys (stain/hole/stitch/scratch) based on filters
  const barKeys = useMemo(() => {
    // Map UI defect names to bar data keys
    const map: Record<string, "stain" | "hole" | "stitch" | "scratch"> = {
      Stain: "stain",
      Hole: "hole",
      Stitch: "stitch",
      Scratch: "scratch",
    };
    const keys = new Set<"stain" | "hole" | "stitch" | "scratch">();
    for (const d of filters.defects) {
      if (map[d]) keys.add(map[d]);
    }
    // default fallback if user unchecks all relevant ones
    if (keys.size === 0) return ["stain", "hole", "stitch", "scratch"] as const;
    return Array.from(keys);
  }, [filters.defects]);

  function toggleDefect(d: string) {
    setFilters((prev) => {
      const has = prev.defects.includes(d);
      const next = has ? prev.defects.filter((x) => x !== d) : [...prev.defects, d];
      return { ...prev, defects: next };
    });
  }

  function exportCsv() {
    // Export what user is looking at (filtered confusion)
    const rows = filteredConfusion.map((r) => ({
      date_range: dateLabel,
      actual: r.actual,
      predicted: r.predicted,
      match_rate_percent: r.value,
    }));

    const csv = toCsv(rows, ["date_range", "actual", "predicted", "match_rate_percent"]);
    downloadTextFile(`confusion_export_${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">AI performance metrics and insights</p>
        </div>

        <div className="flex items-center gap-3 relative">
          {/* Date Picker */}
          <div className="relative">
            <button
              onClick={() => setDateOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              <Calendar className="w-4 h-4" />
              {dateLabel}
            </button>

            {dateOpen && (
              <div className="absolute right-0 mt-2 w-[360px] rounded-xl border border-border bg-card shadow-xl z-20">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="font-semibold text-foreground">Date Range</div>
                  <button
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setDateOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "last_7", label: "7D" },
                      { key: "last_30", label: "30D" },
                      { key: "last_90", label: "90D" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => {
                          setDatePreset(p.key as DatePreset);
                          setDateFrom("");
                          setDateTo("");
                        }}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm border transition-colors",
                          datePreset === p.key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-foreground hover:bg-accent"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}

                    <button
                      onClick={() => setDatePreset("custom")}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm border transition-colors col-span-3",
                        datePreset === "custom"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-foreground hover:bg-accent"
                      )}
                    >
                      Custom Range
                    </button>
                  </div>

                  {datePreset === "custom" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">From</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">To</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="mt-1 w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={() => setDateOpen(false)}
                        className="col-span-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        Apply
                      </button>
                      <p className="col-span-2 text-xs text-muted-foreground">
                        (Demo) Date range updates labels + export metadata. Hook your backend query here later.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Filter */}
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>

          {/* Export */}
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className="bg-card border border-border rounded-xl p-5 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-bold font-mono text-foreground">{metric.value}</span>
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  metric.isPositive ? "text-success" : "text-destructive"
                )}
              >
                {metric.trend === 0 ? (
                  <Minus className="w-4 h-4" />
                ) : metric.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(metric.trend)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Weekly Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 25%)" />
                <XAxis dataKey="week" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 14%)",
                    border: "1px solid hsl(215, 28%, 25%)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(173, 80%, 40%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(173, 80%, 40%)" }}
                  name="Accuracy %"
                />
                <Line
                  type="monotone"
                  dataKey="overrideRate"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(38, 92%, 50%)" }}
                  name="Override Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defects by Production Line */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Defects by Production Line</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectByLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 28%, 25%)" vertical={false} />
                <XAxis dataKey="line" stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <YAxis stroke="hsl(215, 20%, 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 14%)",
                    border: "1px solid hsl(215, 28%, 25%)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />

                {barKeys.includes("stain") && (
                  <Bar dataKey="stain" fill="hsl(0, 72%, 51%)" name="Stain" radius={[4, 4, 0, 0]} />
                )}
                {barKeys.includes("hole") && (
                  <Bar dataKey="hole" fill="hsl(38, 92%, 50%)" name="Hole" radius={[4, 4, 0, 0]} />
                )}
                {barKeys.includes("stitch") && (
                  <Bar dataKey="stitch" fill="hsl(173, 80%, 40%)" name="Stitch" radius={[4, 4, 0, 0]} />
                )}
                {barKeys.includes("scratch") && (
                  <Bar dataKey="scratch" fill="hsl(199, 89%, 48%)" name="Scratch" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Confusion Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Commonly confused defect classifications • Showing{" "}
              <span className="font-mono text-foreground">{filteredConfusion.length}</span> rows
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actual Defect</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">AI Prediction</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Match Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredConfusion.map((row, index) => (
                <tr key={index} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{row.actual}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{row.predicted}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "font-mono font-bold",
                        row.value >= 85 ? "text-success" : row.value >= 70 ? "text-warning" : "text-destructive"
                      )}
                    >
                      {row.value}%
                    </span>
                  </td>
                  <td className="px-4 py-3 w-48">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          row.value >= 85 ? "bg-success" : row.value >= 70 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}

              {filteredConfusion.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No rows match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Modal */}
      {filterOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setFilterOpen(false)}
            aria-label="Close filter"
          />
          <div className="relative w-[920px] max-w-[94vw] rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <div className="font-semibold text-foreground">Filters</div>
                <div className="text-xs text-muted-foreground">Apply to charts + confusion table + CSV export</div>
              </div>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setFilterOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Defect filters */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Defect Types</div>
                <div className="grid grid-cols-2 gap-2">
                  {DEFECT_OPTIONS.map((d) => {
                    const checked = filters.defects.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDefect(d)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors",
                          checked
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-foreground hover:bg-accent"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-flex h-4 w-4 items-center justify-center rounded border",
                            checked ? "border-primary bg-primary/20" : "border-border bg-card"
                          )}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </span>
                        {d}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setFilters((p) => ({ ...p, defects: [...DEFECT_OPTIONS] as unknown as string[] }))}
                    className="text-sm text-primary hover:underline"
                  >
                    Select all
                  </button>
                  <button
                    onClick={() => setFilters((p) => ({ ...p, defects: [] }))}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Threshold */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-foreground">Confusion Table Threshold</div>
                <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">Min Match Rate</div>
                    <div className="font-mono font-bold text-foreground">{filters.minMatchRate}%</div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={filters.minMatchRate}
                    onChange={(e) => setFilters((p) => ({ ...p, minMatchRate: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    Only show rows where Match Rate ≥ this threshold (also affects CSV export).
                  </div>
                </div>

                <div className="bg-secondary/40 border border-border rounded-xl p-4">
                  <div className="text-sm text-muted-foreground">
                    (Demo) You can extend filters later: production line, SKU, model version, etc.
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setFilters({ defects: ["Stain", "Hole", "Stitch", "Dirty", "Other"], minMatchRate: 0 });
                }}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => setFilterOpen(false)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
