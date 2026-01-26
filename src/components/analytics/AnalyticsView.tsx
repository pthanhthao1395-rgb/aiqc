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
  Legend
} from "recharts";
import { Calendar, Download, Filter, TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export function AnalyticsView() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">AI performance metrics and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors">
            <Calendar className="w-4 h-4" />
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-accent transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" />
            Export
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
              <div className={`flex items-center gap-1 text-sm font-medium ${
                metric.isPositive ? "text-success" : "text-destructive"
              }`}>
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
                <Bar dataKey="stain" fill="hsl(0, 72%, 51%)" name="Stain" radius={[4, 4, 0, 0]} />
                <Bar dataKey="hole" fill="hsl(38, 92%, 50%)" name="Hole" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stitch" fill="hsl(173, 80%, 40%)" name="Stitch" radius={[4, 4, 0, 0]} />
                <Bar dataKey="scratch" fill="hsl(199, 89%, 48%)" name="Scratch" radius={[4, 4, 0, 0]} />
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
            <p className="text-sm text-muted-foreground">Commonly confused defect classifications</p>
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
              {confusionData.map((row, index) => (
                <tr key={index} className="hover:bg-accent/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{row.actual}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{row.predicted}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${
                      row.value >= 85 ? "text-success" : 
                      row.value >= 70 ? "text-warning" : "text-destructive"
                    }`}>
                      {row.value}%
                    </span>
                  </td>
                  <td className="px-4 py-3 w-48">
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          row.value >= 85 ? "bg-success" : 
                          row.value >= 70 ? "bg-warning" : "bg-destructive"
                        }`}
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
