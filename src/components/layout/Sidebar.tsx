import { useState } from "react";
import { 
  LayoutDashboard, 
  ScanSearch, 
  BarChart3, 
  Settings, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import Logo from "@/assets/logo.jpg";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "inspection", label: "Inspection", icon: ScanSearch },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "taxonomy", label: "Taxonomy", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
          <img
            src={Logo}
            alt="QC AI Logo"
            className="w-6 h-6 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-lg font-bold text-foreground">AI QC Platform</h1>
            <p className="text-xs text-muted-foreground">Defect Detection</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary glow-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", isActive && "text-primary")} />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 flex items-center justify-center w-6 h-6 rounded-full bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Theme Toggle */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <ThemeToggle collapsed={collapsed} />
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">QC</span>
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="text-sm font-medium text-foreground">QC Inspector</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
