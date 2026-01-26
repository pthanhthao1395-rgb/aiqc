import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const trendData = [
  { day: "Mon", accuracy: 82, inspections: 45 },
  { day: "Tue", accuracy: 85, inspections: 52 },
  { day: "Wed", accuracy: 84, inspections: 48 },
  { day: "Thu", accuracy: 88, inspections: 61 },
  { day: "Fri", accuracy: 91, inspections: 55 },
  { day: "Sat", accuracy: 89, inspections: 38 },
  { day: "Sun", accuracy: 93, inspections: 42 },
];

export function AccuracyTrend() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">AI Accuracy Trend</h3>
          <p className="text-sm text-muted-foreground">Weekly model performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Accuracy %</span>
          </div>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(173, 80%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(215, 28%, 25%)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[70, 100]}
              stroke="hsl(215, 20%, 65%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 14%)",
                border: "1px solid hsl(215, 28%, 25%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
              }}
              formatter={(value: number) => [`${value}%`, "Accuracy"]}
            />
            <Area
              type="monotone"
              dataKey="accuracy"
              stroke="hsl(173, 80%, 40%)"
              strokeWidth={2}
              fill="url(#accuracyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
