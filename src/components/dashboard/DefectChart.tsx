import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const defectData = [
  { name: "Stain", value: 32, color: "hsl(0, 72%, 51%)" },
  { name: "Hole", value: 24, color: "hsl(38, 92%, 50%)" },
  { name: "Broken Stitch", value: 18, color: "hsl(173, 80%, 40%)" },
  { name: "Fabric Scratch", value: 14, color: "hsl(199, 89%, 48%)" },
  { name: "Misalignment", value: 12, color: "hsl(280, 65%, 60%)" },
];

export function DefectChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Defect Distribution</h3>
          <p className="text-sm text-muted-foreground">Today's detected defects by type</p>
        </div>
        <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          100 Total
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={defectData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {defectData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 14%)",
                border: "1px solid hsl(215, 28%, 25%)",
                borderRadius: "8px",
                color: "hsl(210, 40%, 98%)",
              }}
              formatter={(value: number) => [`${value} defects`, ""]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: "hsl(215, 20%, 65%)", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
