import { useState } from "react";
import { 
  Cpu, 
  Bell, 
  Shield, 
  Database, 
  Sliders, 
  Users, 
  Globe,
  ChevronRight,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsSections = [
  { id: "model", label: "AI Model", icon: Cpu, description: "Configure model version and inference settings" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alert preferences and thresholds" },
  { id: "security", label: "Security", icon: Shield, description: "Authentication and access control" },
  { id: "data", label: "Data Management", icon: Database, description: "Storage and retention policies" },
  { id: "inference", label: "Inference Settings", icon: Sliders, description: "Confidence thresholds and Top-K" },
  { id: "users", label: "User Management", icon: Users, description: "Inspector accounts and permissions" },
  { id: "integration", label: "Integrations", icon: Globe, description: "External system connections" },
];

export function SettingsView() {
  const [activeSection, setActiveSection] = useState("inference");
  const [topK, setTopK] = useState(5);
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);
  const [autoConfirm, setAutoConfirm] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure system preferences and behavior</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      isActive 
                        ? "bg-primary/10 border-l-2 border-primary" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {section.label}
                    </span>
                    {isActive && <ChevronRight className="w-4 h-4 text-primary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === "inference" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Inference Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure AI prediction behavior and thresholds
                </p>
              </div>

              {/* Top-K Setting */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">Top-K Suggestions</label>
                    <p className="text-sm text-muted-foreground">Number of classification suggestions to display</p>
                  </div>
                  <span className="text-2xl font-bold font-mono text-primary">{topK}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-medium text-foreground">Confidence Threshold</label>
                    <p className="text-sm text-muted-foreground">Minimum confidence to highlight as suggestion</p>
                  </div>
                  <span className="text-2xl font-bold font-mono text-primary">{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50%</span>
                  <span>70%</span>
                  <span>95%</span>
                </div>
              </div>

              {/* Auto-confirm Toggle */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <label className="font-medium text-foreground">Auto-confirm High Confidence</label>
                  <p className="text-sm text-muted-foreground">
                    Automatically confirm predictions above 95% confidence
                  </p>
                </div>
                <button
                  onClick={() => setAutoConfirm(!autoConfirm)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    autoConfirm ? "bg-primary" : "bg-muted"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      autoConfirm ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Model Version */}
              <div className="space-y-3">
                <label className="font-medium text-foreground">Active Model Version</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "qwen-vl-2.1", name: "Qwen-VL v2.1", status: "active" },
                    { id: "qwen-vl-2.0", name: "Qwen-VL v2.0", status: "stable" },
                  ].map((model) => (
                    <div
                      key={model.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-colors",
                        model.status === "active"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-muted-foreground"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{model.name}</span>
                        {model.status === "active" && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 capitalize">{model.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-border">
                <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors glow-primary">
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {activeSection !== "inference" && (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                <Sliders className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {settingsSections.find(s => s.id === activeSection)?.label}
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                {settingsSections.find(s => s.id === activeSection)?.description}
              </p>
              <p className="text-sm text-muted-foreground mt-4">Configuration coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
