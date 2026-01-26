import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { InspectionPanel } from "@/components/inspection/InspectionPanel";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { TaxonomyView } from "@/components/taxonomy/TaxonomyView";
import { SettingsView } from "@/components/settings/SettingsView";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "inspection":
        return <InspectionPanel />;
      case "analytics":
        return <AnalyticsView />;
      case "taxonomy":
        return <TaxonomyView />;
      case "settings":
        return <SettingsView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
