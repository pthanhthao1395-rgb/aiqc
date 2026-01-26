import { ScanSearch, CheckCircle2, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { StatCard } from "./StatCard";
import { DefectChart } from "./DefectChart";
import { RecentInspections } from "./RecentInspections";
import { AccuracyTrend } from "./AccuracyTrend";

export function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quality Control Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time defect detection overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 border border-success/30">
            <Activity className="w-4 h-4 text-success animate-pulse" />
            <span className="text-sm font-medium text-success">System Online</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Inspections"
          value="1,247"
          subtitle="Today"
          icon={ScanSearch}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Defects Found"
          value="89"
          subtitle="7.1% rate"
          icon={AlertTriangle}
          variant="warning"
          trend={{ value: 3, isPositive: false }}
        />
        <StatCard
          title="AI Accuracy"
          value="94.2%"
          subtitle="Top-5 match"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 2.3, isPositive: true }}
        />
        <StatCard
          title="Confirmed"
          value="1,158"
          subtitle="92.9% rate"
          icon={CheckCircle2}
          variant="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AccuracyTrend />
        </div>
        <DefectChart />
      </div>

      {/* Recent Inspections */}
      <RecentInspections />
    </div>
  );
}
