import { useEffect, useMemo, useState } from "react";
import {
  Cpu,
  Bell,
  Shield,
  Database,
  Sliders,
  Users,
  Globe,
  ChevronRight,
  Check,
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  RefreshCw,
  Link2,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

/** ---------------------------
 * Types
 * --------------------------*/
type SectionId =
  | "model"
  | "notifications"
  | "security"
  | "data"
  | "inference"
  | "users"
  | "integration";

type ModelId = "qwen-vl-2.1" | "qwen-vl-2.0" | "gpt-4o-mini-vision";
type Role = "admin" | "inspector" | "viewer";

type SettingsState = {
  model: {
    activeModelId: ModelId;
    device: "cpu" | "gpu";
    batchSize: number; // 1..16
    maxImageSide: number; // 640..2048
    enableHeatmap: boolean;
    enableBBox: boolean;
  };

  notifications: {
    enableEmail: boolean;
    enableSlack: boolean;
    enableInApp: boolean;
    slackWebhook: string;
    emailRecipients: string; // comma-separated
    alertOnHighSeverity: boolean;
    confidenceAlertThreshold: number; // 50..99
    dailyDigest: boolean;
  };

  security: {
    ssoEnabled: boolean;
    mfaRequired: boolean;
    passwordPolicy: "standard" | "strict";
    sessionTimeoutMin: number; // 15..240
    ipAllowlistEnabled: boolean;
    ipAllowlist: string; // newline list
    apiKey: string;
    apiKeyLastRotated: string; // ISO
  };

  data: {
    storageProvider: "local" | "s3" | "azure-blob";
    retentionDays: number; // 7..365
    autoPurgeEnabled: boolean;
    storeOriginalImages: boolean;
    storeDerivedArtifacts: boolean; // heatmap/crops
    encryptionAtRest: boolean;
    exportFormat: "csv" | "json";
  };

  inference: {
    topK: number; // 1..10
    confidenceThreshold: number; // 50..95
    autoConfirmEnabled: boolean;
    autoConfirmThreshold: number; // 90..99
    showOverlayDefault: boolean;
  };

  users: {
    allowSelfSignup: boolean;
    defaultRole: Role;
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: Role;
      active: boolean;
    }>;
  };

  integration: {
    erp: { enabled: boolean; baseUrl: string; apiToken: string };
    mes: { enabled: boolean; baseUrl: string; apiToken: string };
    webhook: { enabled: boolean; url: string; secret: string };
    auditLog: { enabled: boolean; destination: "db" | "s3"; bucketOrTable: string };
  };
};

/** ---------------------------
 * UI config
 * --------------------------*/
const settingsSections: Array<{
  id: SectionId;
  label: string;
  icon: any;
  description: string;
}> = [
  { id: "model", label: "AI Model", icon: Cpu, description: "Configure model version and runtime behavior" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alert preferences, thresholds, and channels" },
  { id: "security", label: "Security", icon: Shield, description: "SSO/MFA, session control, API keys, allowlist" },
  { id: "data", label: "Data Management", icon: Database, description: "Storage, retention, export, encryption policies" },
  { id: "inference", label: "Inference Settings", icon: Sliders, description: "Top-K, confidence, auto-confirm, overlays" },
  { id: "users", label: "User Management", icon: Users, description: "Inspector accounts, roles, access" },
  { id: "integration", label: "Integrations", icon: Globe, description: "ERP/MES/Webhooks/Audit log connections" },
];

const STORAGE_KEY = "qa_settings_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randomKey(prefix = "sk_") {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 28; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}${s}`;
}

function FieldLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <label className="font-medium text-foreground">{title}</label>
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  label,
  description,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
      <div>
        <label className="font-medium text-foreground">{label}</label>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn("relative w-12 h-6 rounded-full transition-colors", value ? "bg-primary" : "bg-muted")}
        aria-label={label}
      >
        <div
          className={cn(
            "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
            value ? "translate-x-7" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}

/** ---------------------------
 * Default Settings
 * --------------------------*/
const DEFAULT_SETTINGS: SettingsState = {
  model: {
    activeModelId: "qwen-vl-2.1",
    device: "gpu",
    batchSize: 4,
    maxImageSide: 1024,
    enableHeatmap: true,
    enableBBox: true,
  },
  notifications: {
    enableEmail: false,
    enableSlack: false,
    enableInApp: true,
    slackWebhook: "",
    emailRecipients: "",
    alertOnHighSeverity: true,
    confidenceAlertThreshold: 90,
    dailyDigest: false,
  },
  security: {
    ssoEnabled: false,
    mfaRequired: false,
    passwordPolicy: "standard",
    sessionTimeoutMin: 60,
    ipAllowlistEnabled: false,
    ipAllowlist: "",
    apiKey: randomKey(),
    apiKeyLastRotated: new Date().toISOString(),
  },
  data: {
    storageProvider: "local",
    retentionDays: 30,
    autoPurgeEnabled: true,
    storeOriginalImages: true,
    storeDerivedArtifacts: true,
    encryptionAtRest: true,
    exportFormat: "csv",
  },
  inference: {
    topK: 5,
    confidenceThreshold: 70,
    autoConfirmEnabled: false,
    autoConfirmThreshold: 95,
    showOverlayDefault: true,
  },
  users: {
    allowSelfSignup: false,
    defaultRole: "inspector",
    users: [
      { id: "u1", name: "Linh Nguyen", email: "linh@factory.com", role: "admin", active: true },
      { id: "u2", name: "Hieu Tran", email: "hieu@factory.com", role: "inspector", active: true },
      { id: "u3", name: "Mai Pham", email: "mai@factory.com", role: "viewer", active: true },
    ],
  },
  integration: {
    erp: { enabled: false, baseUrl: "", apiToken: "" },
    mes: { enabled: false, baseUrl: "", apiToken: "" },
    webhook: { enabled: false, url: "", secret: "" },
    auditLog: { enabled: true, destination: "db", bucketOrTable: "qa_audit_logs" },
  },
};

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as SettingsState;
    // minimal fallback safety
    return parsed ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: SettingsState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

/** ---------------------------
 * Component
 * --------------------------*/
export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SectionId>("inference");

  const [settings, setSettings] = useState<SettingsState>(() => {
    // safe: localStorage exists in browser
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    return loadSettings();
  });

  const [draft, setDraft] = useState<SettingsState>(settings);
  const [savedToast, setSavedToast] = useState<string | null>(null);

  const [showApiKey, setShowApiKey] = useState(false);
  const [showErpToken, setShowErpToken] = useState(false);
  const [showMesToken, setShowMesToken] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState<Role>("inspector");

  // keep draft synced when settings loaded changes
  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  // auto-hide toast
  useEffect(() => {
    if (!savedToast) return;
    const t = setTimeout(() => setSavedToast(null), 2200);
    return () => clearTimeout(t);
  }, [savedToast]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);

  function onSave() {
    // sanitize / clamp
    const next: SettingsState = {
      ...draft,
      model: {
        ...draft.model,
        batchSize: clamp(draft.model.batchSize, 1, 16),
        maxImageSide: clamp(draft.model.maxImageSide, 640, 2048),
      },
      notifications: {
        ...draft.notifications,
        confidenceAlertThreshold: clamp(draft.notifications.confidenceAlertThreshold, 50, 99),
      },
      security: {
        ...draft.security,
        sessionTimeoutMin: clamp(draft.security.sessionTimeoutMin, 15, 240),
      },
      data: {
        ...draft.data,
        retentionDays: clamp(draft.data.retentionDays, 7, 365),
      },
      inference: {
        ...draft.inference,
        topK: clamp(draft.inference.topK, 1, 10),
        confidenceThreshold: clamp(draft.inference.confidenceThreshold, 50, 95),
        autoConfirmThreshold: clamp(draft.inference.autoConfirmThreshold, 90, 99),
      },
    };

    setSettings(next);
    saveSettings(next);
    setSavedToast("Settings saved");
  }

  function onReset() {
    const loaded = loadSettings();
    setSettings(loaded);
    setDraft(loaded);
    setSavedToast("Reverted to saved settings");
  }

  function onResetToDefault() {
    setSettings(DEFAULT_SETTINGS);
    setDraft(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    setSavedToast("Reset to defaults");
  }

  function testNotification() {
    const channels = [
      draft.notifications.enableInApp ? "In-app" : null,
      draft.notifications.enableEmail ? "Email" : null,
      draft.notifications.enableSlack ? "Slack" : null,
    ].filter(Boolean);
    setSavedToast(`Test notification sent via: ${channels.length ? channels.join(", ") : "None"}`);
  }

  function regenerateApiKey() {
    setDraft((prev) => ({
      ...prev,
      security: {
        ...prev.security,
        apiKey: randomKey(),
        apiKeyLastRotated: new Date().toISOString(),
      },
    }));
    setSavedToast("API key regenerated (draft)");
  }

  function addUser() {
    const name = userName.trim();
    const email = userEmail.trim();
    if (!name || !email) {
      setSavedToast("Please input name & email");
      return;
    }
    setDraft((prev) => ({
      ...prev,
      users: {
        ...prev.users,
        users: [
          ...prev.users.users,
          { id: `u_${Date.now()}`, name, email, role: userRole, active: true },
        ],
      },
    }));
    setUserName("");
    setUserEmail("");
    setUserRole("inspector");
    setSavedToast("User added (draft)");
  }

  function removeUser(id: string) {
    setDraft((prev) => ({
      ...prev,
      users: { ...prev.users, users: prev.users.users.filter((u) => u.id !== id) },
    }));
    setSavedToast("User removed (draft)");
  }

  function updateUser(id: string, patch: Partial<SettingsState["users"]["users"][number]>) {
    setDraft((prev) => ({
      ...prev,
      users: {
        ...prev.users,
        users: prev.users.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      },
    }));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system preferences and behavior</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onResetToDefault}
            className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
          >
            Defaults
          </button>
          <button
            onClick={onSave}
            disabled={!dirty}
            className={cn(
              "px-5 py-2 rounded-lg font-medium transition-colors",
              dirty
                ? "bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Toast */}
      {savedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-card border border-border shadow-xl rounded-xl px-4 py-3 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="text-sm text-foreground">{savedToast}</div>
          </div>
        </div>
      )}

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
                      isActive ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-accent/50"
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
        <div className="lg:col-span-3 space-y-6">
          {/* ========== AI MODEL ========== */}
          {activeSection === "model" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI Model</h2>
                <p className="text-sm text-muted-foreground mt-1">Model selection + runtime and overlay options</p>
              </div>

              {/* Model selection */}
              <div className="space-y-3">
                <label className="font-medium text-foreground">Active Model Version</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { id: "qwen-vl-2.1", name: "Qwen-VL v2.1", tag: "active-ready" },
                    { id: "qwen-vl-2.0", name: "Qwen-VL v2.0", tag: "stable" },
                    { id: "gpt-4o-mini-vision", name: "GPT-4o-mini Vision", tag: "experimental" },
                  ].map((m) => {
                    const selected = draft.model.activeModelId === (m.id as ModelId);
                    return (
                      <button
                        key={m.id}
                        onClick={() => setDraft((p) => ({ ...p, model: { ...p.model, activeModelId: m.id as ModelId } }))}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-colors",
                          selected ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{m.name}</span>
                          {selected && (
                            <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{m.tag}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Runtime */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <FieldLabel title="Runtime Device" subtitle="Choose CPU/GPU for inference execution" />
                  <div className="flex gap-2">
                    {(["gpu", "cpu"] as const).map((d) => {
                      const active = draft.model.device === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setDraft((p) => ({ ...p, model: { ...p.model, device: d } }))}
                          className={cn(
                            "px-3 py-2 rounded-lg border text-sm transition-colors",
                            active ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:bg-accent"
                          )}
                        >
                          {d.toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <FieldLabel title="Max Image Side" subtitle="Resize long edge before inference (px)" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-xl font-bold font-mono text-primary">{draft.model.maxImageSide}px</span>
                  </div>
                  <input
                    type="range"
                    min={640}
                    max={2048}
                    step={64}
                    value={draft.model.maxImageSide}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, model: { ...p.model, maxImageSide: Number(e.target.value) } }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>640</span>
                    <span>1024</span>
                    <span>2048</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                  <FieldLabel title="Batch Size" subtitle="Higher batch improves throughput (GPU recommended)" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-xl font-bold font-mono text-primary">{draft.model.batchSize}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={16}
                    value={draft.model.batchSize}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, model: { ...p.model, batchSize: Number(e.target.value) } }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1</span>
                    <span>8</span>
                    <span>16</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Toggle
                    value={draft.model.enableBBox}
                    onChange={(v) => setDraft((p) => ({ ...p, model: { ...p.model, enableBBox: v } }))}
                    label="Enable Bounding Box"
                    description="Render predicted defect bounding boxes on overlay"
                  />
                  <Toggle
                    value={draft.model.enableHeatmap}
                    onChange={(v) => setDraft((p) => ({ ...p, model: { ...p.model, enableHeatmap: v } }))}
                    label="Enable Heatmap"
                    description="Render attention/heat overlay for detected region"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== NOTIFICATIONS ========== */}
          {activeSection === "notifications" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground mt-1">Alerts, thresholds and notification channels</p>
                </div>
                <button
                  onClick={testNotification}
                  className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
                >
                  Test Notification
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  value={draft.notifications.enableInApp}
                  onChange={(v) => setDraft((p) => ({ ...p, notifications: { ...p.notifications, enableInApp: v } }))}
                  label="In-app Notifications"
                  description="Show notifications inside the dashboard"
                />
                <Toggle
                  value={draft.notifications.enableEmail}
                  onChange={(v) => setDraft((p) => ({ ...p, notifications: { ...p.notifications, enableEmail: v } }))}
                  label="Email Alerts"
                  description="Send alerts to configured recipients"
                />
                <Toggle
                  value={draft.notifications.enableSlack}
                  onChange={(v) => setDraft((p) => ({ ...p, notifications: { ...p.notifications, enableSlack: v } }))}
                  label="Slack Alerts"
                  description="Post alerts to Slack via webhook"
                />
                <Toggle
                  value={draft.notifications.dailyDigest}
                  onChange={(v) => setDraft((p) => ({ ...p, notifications: { ...p.notifications, dailyDigest: v } }))}
                  label="Daily Digest"
                  description="Send daily summary (demo)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Confidence Alert Threshold" subtitle="Trigger alert when confidence ≥ threshold" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-xl font-bold font-mono text-primary">
                      {draft.notifications.confidenceAlertThreshold}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={99}
                    value={draft.notifications.confidenceAlertThreshold}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        notifications: { ...p.notifications, confidenceAlertThreshold: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>50%</span>
                    <span>90%</span>
                    <span>99%</span>
                  </div>
                </div>

                <Toggle
                  value={draft.notifications.alertOnHighSeverity}
                  onChange={(v) =>
                    setDraft((p) => ({ ...p, notifications: { ...p.notifications, alertOnHighSeverity: v } }))
                  }
                  label="Alert on High Severity"
                  description="Always alert for severe defects (demo flag)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Email Recipients" subtitle="Comma-separated list" />
                  <input
                    value={draft.notifications.emailRecipients}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, notifications: { ...p.notifications, emailRecipients: e.target.value } }))
                    }
                    placeholder="qa@factory.com, lead@factory.com"
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Slack Webhook" subtitle="Used when Slack Alerts enabled" />
                  <input
                    value={draft.notifications.slackWebhook}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, notifications: { ...p.notifications, slackWebhook: e.target.value } }))
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== SECURITY ========== */}
          {activeSection === "security" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Security</h2>
                <p className="text-sm text-muted-foreground mt-1">Access control, SSO/MFA, API keys and allowlists</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  value={draft.security.ssoEnabled}
                  onChange={(v) => setDraft((p) => ({ ...p, security: { ...p.security, ssoEnabled: v } }))}
                  label="Enable SSO"
                  description="Use SAML/OIDC SSO (demo)"
                />
                <Toggle
                  value={draft.security.mfaRequired}
                  onChange={(v) => setDraft((p) => ({ ...p, security: { ...p.security, mfaRequired: v } }))}
                  label="Require MFA"
                  description="Require multi-factor authentication"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Password Policy" subtitle="Controls password complexity (demo)" />
                  <select
                    value={draft.security.passwordPolicy}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        security: { ...p.security, passwordPolicy: e.target.value as any },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="standard">Standard</option>
                    <option value="strict">Strict</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Session Timeout" subtitle="Auto logout after inactivity (minutes)" />
                  <input
                    type="number"
                    min={15}
                    max={240}
                    value={draft.security.sessionTimeoutMin}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        security: { ...p.security, sessionTimeoutMin: Number(e.target.value) },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground">Allowed range: 15–240</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  value={draft.security.ipAllowlistEnabled}
                  onChange={(v) => setDraft((p) => ({ ...p, security: { ...p.security, ipAllowlistEnabled: v } }))}
                  label="IP Allowlist"
                  description="Restrict access to approved IP ranges"
                />

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Allowlist (one per line)" subtitle="Example: 203.0.113.0/24" />
                  <textarea
                    value={draft.security.ipAllowlist}
                    onChange={(e) => setDraft((p) => ({ ...p, security: { ...p.security, ipAllowlist: e.target.value } }))}
                    placeholder={"203.0.113.10\n203.0.113.0/24"}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* API Key */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-foreground">API Key</div>
                    <div className="text-sm text-muted-foreground">
                      Used by external services to send inspection data (demo). Last rotated:{" "}
                      <span className="font-mono text-foreground">{new Date(draft.security.apiKeyLastRotated).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={regenerateApiKey}
                      className="px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </button>
                    <button
                      onClick={() => setShowApiKey((v) => !v)}
                      className="p-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
                      aria-label="Toggle API key visibility"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <input
                  readOnly
                  value={showApiKey ? draft.security.apiKey : "•".repeat(28)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground font-mono focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* ========== DATA MANAGEMENT ========== */}
          {activeSection === "data" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Data Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Storage provider, retention and export policies</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Storage Provider" subtitle="Where inspection assets are stored" />
                  <select
                    value={draft.data.storageProvider}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, data: { ...p.data, storageProvider: e.target.value as any } }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="local">Local</option>
                    <option value="s3">Amazon S3</option>
                    <option value="azure-blob">Azure Blob</option>
                  </select>
                </div>

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Export Format" subtitle="Default export format" />
                  <select
                    value={draft.data.exportFormat}
                    onChange={(e) => setDraft((p) => ({ ...p, data: { ...p.data, exportFormat: e.target.value as any } }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Retention Days" subtitle="How long to keep inspection history" />
                  <input
                    type="number"
                    min={7}
                    max={365}
                    value={draft.data.retentionDays}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, data: { ...p.data, retentionDays: Number(e.target.value) } }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p className="text-xs text-muted-foreground">Allowed range: 7–365</p>
                </div>

                <Toggle
                  value={draft.data.autoPurgeEnabled}
                  onChange={(v) => setDraft((p) => ({ ...p, data: { ...p.data, autoPurgeEnabled: v } }))}
                  label="Auto Purge"
                  description="Automatically purge data older than retention policy"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  value={draft.data.storeOriginalImages}
                  onChange={(v) => setDraft((p) => ({ ...p, data: { ...p.data, storeOriginalImages: v } }))}
                  label="Store Original Images"
                  description="Keep original uploaded images"
                />
                <Toggle
                  value={draft.data.storeDerivedArtifacts}
                  onChange={(v) => setDraft((p) => ({ ...p, data: { ...p.data, storeDerivedArtifacts: v } }))}
                  label="Store Derived Artifacts"
                  description="Keep crops/heatmaps/overlays for audit"
                />
              </div>

              <Toggle
                value={draft.data.encryptionAtRest}
                onChange={(v) => setDraft((p) => ({ ...p, data: { ...p.data, encryptionAtRest: v } }))}
                label="Encryption at Rest"
                description="Encrypt stored artifacts in persistent storage"
              />
            </div>
          )}

          {/* ========== INFERENCE SETTINGS ========== */}
          {activeSection === "inference" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Inference Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">Configure AI prediction behavior and thresholds</p>
              </div>

              {/* Top-K */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FieldLabel title="Top-K Suggestions" subtitle="Number of classification suggestions to display" />
                  <span className="text-2xl font-bold font-mono text-primary">{draft.inference.topK}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={draft.inference.topK}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, inference: { ...p.inference, topK: Number(e.target.value) } }))
                  }
                  className="w-full accent-primary"
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
                  <FieldLabel title="Confidence Threshold" subtitle="Minimum confidence to highlight as suggestion" />
                  <span className="text-2xl font-bold font-mono text-primary">{draft.inference.confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={50}
                  max={95}
                  step={5}
                  value={draft.inference.confidenceThreshold}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      inference: { ...p.inference, confidenceThreshold: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>50%</span>
                  <span>70%</span>
                  <span>95%</span>
                </div>
              </div>

              <Toggle
                value={draft.inference.showOverlayDefault}
                onChange={(v) => setDraft((p) => ({ ...p, inference: { ...p.inference, showOverlayDefault: v } }))}
                label="Show Overlay by Default"
                description="Enable AI overlay in inspection view by default"
              />

              {/* Auto-confirm */}
              <Toggle
                value={draft.inference.autoConfirmEnabled}
                onChange={(v) => setDraft((p) => ({ ...p, inference: { ...p.inference, autoConfirmEnabled: v } }))}
                label="Auto-confirm High Confidence"
                description="Automatically confirm predictions above threshold"
              />

              {draft.inference.autoConfirmEnabled && (
                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Auto-confirm Threshold" subtitle="Predictions ≥ threshold will be auto-confirmed" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value</span>
                    <span className="text-xl font-bold font-mono text-primary">{draft.inference.autoConfirmThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min={90}
                    max={99}
                    value={draft.inference.autoConfirmThreshold}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        inference: { ...p.inference, autoConfirmThreshold: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>90%</span>
                    <span>95%</span>
                    <span>99%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== USER MANAGEMENT ========== */}
          {activeSection === "users" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">User Management</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage inspector accounts and permissions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle
                  value={draft.users.allowSelfSignup}
                  onChange={(v) => setDraft((p) => ({ ...p, users: { ...p.users, allowSelfSignup: v } }))}
                  label="Allow Self Signup"
                  description="Allow users to create accounts (demo)"
                />

                <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-2">
                  <FieldLabel title="Default Role" subtitle="Role assigned to newly created accounts" />
                  <select
                    value={draft.users.defaultRole}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, users: { ...p.users, defaultRole: e.target.value as Role } }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="inspector">Inspector</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>

              {/* Add user */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Full name"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="email@factory.com"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as Role)}
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="admin">Admin</option>
                    <option value="inspector">Inspector</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    onClick={addUser}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>

              {/* Users table */}
              <div className="overflow-x-auto border border-border rounded-xl">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/30">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {draft.users.users.map((u) => (
                      <tr key={u.id} className="hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 text-sm text-foreground">{u.name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{u.email}</td>
                        <td className="px-4 py-3">
                          <select
                            value={u.role}
                            onChange={(e) => updateUser(u.id, { role: e.target.value as Role })}
                            className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          >
                            <option value="admin">Admin</option>
                            <option value="inspector">Inspector</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => updateUser(u.id, { active: !u.active })}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium",
                              u.active ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
                            )}
                          >
                            {u.active ? "Active" : "Disabled"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => removeUser(u.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-foreground hover:bg-accent transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {draft.users.users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                          No users. Add one above.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========== INTEGRATIONS ========== */}
          {activeSection === "integration" && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
                <p className="text-sm text-muted-foreground mt-1">Connect with ERP/MES, webhooks and audit log sinks</p>
              </div>

              {/* ERP */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">ERP Connector</div>
                      <div className="text-sm text-muted-foreground">Push inspection results to ERP</div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        integration: { ...p.integration, erp: { ...p.integration.erp, enabled: !p.integration.erp.enabled } },
                      }))
                    }
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors",
                      draft.integration.erp.enabled
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    )}
                  >
                    {draft.integration.erp.enabled ? "Connected" : "Connect"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={draft.integration.erp.baseUrl}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, integration: { ...p.integration, erp: { ...p.integration.erp, baseUrl: e.target.value } } }))
                    }
                    placeholder="ERP Base URL (e.g. https://erp.company.com/api)"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="relative">
                    <input
                      value={showErpToken ? draft.integration.erp.apiToken : "•".repeat(20)}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, integration: { ...p.integration, erp: { ...p.integration.erp, apiToken: e.target.value } } }))
                      }
                      placeholder="ERP API Token"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowErpToken((v) => !v)}
                      type="button"
                      aria-label="Toggle ERP token visibility"
                    >
                      {showErpToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* MES */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">MES Connector</div>
                      <div className="text-sm text-muted-foreground">Sync defect events to MES</div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        integration: { ...p.integration, mes: { ...p.integration.mes, enabled: !p.integration.mes.enabled } },
                      }))
                    }
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors",
                      draft.integration.mes.enabled
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    )}
                  >
                    {draft.integration.mes.enabled ? "Connected" : "Connect"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={draft.integration.mes.baseUrl}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, integration: { ...p.integration, mes: { ...p.integration.mes, baseUrl: e.target.value } } }))
                    }
                    placeholder="MES Base URL"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <div className="relative">
                    <input
                      value={showMesToken ? draft.integration.mes.apiToken : "•".repeat(20)}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, integration: { ...p.integration, mes: { ...p.integration.mes, apiToken: e.target.value } } }))
                      }
                      placeholder="MES API Token"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowMesToken((v) => !v)}
                      type="button"
                      aria-label="Toggle MES token visibility"
                    >
                      {showMesToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Webhook */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Webhook</div>
                      <div className="text-sm text-muted-foreground">POST inspection events to your endpoint</div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        integration: {
                          ...p.integration,
                          webhook: { ...p.integration.webhook, enabled: !p.integration.webhook.enabled },
                        },
                      }))
                    }
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors",
                      draft.integration.webhook.enabled
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    )}
                  >
                    {draft.integration.webhook.enabled ? "Enabled" : "Enable"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={draft.integration.webhook.url}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, integration: { ...p.integration, webhook: { ...p.integration.webhook, url: e.target.value } } }))
                    }
                    placeholder="https://your-system.com/webhook"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />

                  <div className="relative">
                    <input
                      value={showWebhookSecret ? draft.integration.webhook.secret : "•".repeat(16)}
                      onChange={(e) =>
                        setDraft((p) => ({ ...p, integration: { ...p.integration, webhook: { ...p.integration.webhook, secret: e.target.value } } }))
                      }
                      placeholder="Signing secret"
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowWebhookSecret((v) => !v)}
                      type="button"
                      aria-label="Toggle webhook secret visibility"
                    >
                      {showWebhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Audit log */}
              <div className="p-4 rounded-xl border border-border bg-secondary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-medium text-foreground">Audit Log</div>
                      <div className="text-sm text-muted-foreground">Store actions for traceability</div>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setDraft((p) => ({
                        ...p,
                        integration: {
                          ...p.integration,
                          auditLog: { ...p.integration.auditLog, enabled: !p.integration.auditLog.enabled },
                        },
                      }))
                    }
                    className={cn(
                      "px-3 py-2 rounded-lg border transition-colors",
                      draft.integration.auditLog.enabled
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-foreground hover:bg-accent"
                    )}
                  >
                    {draft.integration.auditLog.enabled ? "Enabled" : "Enable"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={draft.integration.auditLog.destination}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        integration: {
                          ...p.integration,
                          auditLog: { ...p.integration.auditLog, destination: e.target.value as any },
                        },
                      }))
                    }
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="db">Database</option>
                    <option value="s3">S3</option>
                  </select>

                  <input
                    value={draft.integration.auditLog.bucketOrTable}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        integration: {
                          ...p.integration,
                          auditLog: { ...p.integration.auditLog, bucketOrTable: e.target.value },
                        },
                      }))
                    }
                    placeholder="Table name or bucket path"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========== FALLBACK ========== */}
          {activeSection !== "model" &&
            activeSection !== "notifications" &&
            activeSection !== "security" &&
            activeSection !== "data" &&
            activeSection !== "inference" &&
            activeSection !== "users" &&
            activeSection !== "integration" && (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
                  <Sliders className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Coming soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">This section is not configured yet.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
