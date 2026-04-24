"use client";

import { useEffect, useState } from "react";
import { useTelemetry } from "@/lib/use-telemetry";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import {
  Wifi, WifiOff, Database, Zap, DollarSign, Server,
  CheckCircle2, XCircle, ExternalLink, Save, Loader2, Printer,
} from "lucide-react";

interface Config {
  [key: string]: string;
}

function StatusIndicator({ ok }: { ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${ok ? "text-green" : "text-red"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {ok ? "Connected" : "Disconnected"}
    </div>
  );
}

function ConfigInput({ label, configKey, config, onChange, suffix, type = "text" }: {
  label: string; configKey: string; config: Config; onChange: (key: string, val: string) => void; suffix?: string; type?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type={type}
          value={config[configKey] || ""}
          onChange={(e) => onChange(configKey, e.target.value)}
          className="w-40 text-right text-sm font-semibold tabular-nums bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue rounded px-1"
        />
        {suffix && <span className="text-xs text-text-muted">{suffix}</span>}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { connected } = useTelemetry();
  const [config, setConfig] = useState<Config>({});
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then(setConfig).catch(() => {});
    fetch("/api/telemetry").then((r) => setDbOk(r.ok)).catch(() => setDbOk(false));
  }, []);

  const updateConfig = (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaved(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      setSaved(true);
      setDirty(false);
    } catch {}
    setSaving(false);
  };

  // Calculate live preview
  const elecRate = parseFloat(config.electricity_rate_kwh || "0.12");
  const wattage = parseFloat(config.printer_wattage || "150");
  const previewCost = 2 * (wattage / 1000) * elecRate;

  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Settings</h2>
          {dirty && (
            <button
              onClick={saveConfig}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-1.5 text-[10px] font-bold text-white shadow-lg transition-all"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
          {saved && !dirty && (
            <span className="flex items-center gap-1 text-xs text-green font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Saved
            </span>
          )}
        </div>

        {/* Printer */}
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Printer</div>
          <div className="space-y-3">
            <ConfigInput label="Printer Name" configKey="printer_name" config={config} onChange={updateConfig} />
            <ConfigInput label="Serial Number" configKey="printer_serial" config={config} onChange={updateConfig} />
            <ConfigInput label="IP Address" configKey="printer_ip" config={config} onChange={updateConfig} />
            <ConfigInput label="Nozzle Size" configKey="nozzle_size" config={config} onChange={updateConfig} suffix="mm" />
            <ConfigInput label="Nozzle Type" configKey="nozzle_type" config={config} onChange={updateConfig} />
          </div>
        </div>

        {/* Cost Rates */}
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Cost Rates</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber" /> Electricity Rate
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={config.electricity_rate_kwh || ""}
                  onChange={(e) => updateConfig("electricity_rate_kwh", e.target.value)}
                  className="w-20 text-right text-sm font-semibold tabular-nums bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue rounded px-1"
                />
                <span className="text-xs text-text-muted">/kWh</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary flex items-center gap-2">
                <Printer className="h-4 w-4 text-blue" /> Printer Wattage
              </span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={config.printer_wattage || ""}
                  onChange={(e) => updateConfig("printer_wattage", e.target.value)}
                  className="w-20 text-right text-sm font-semibold tabular-nums bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue rounded px-1"
                />
                <span className="text-xs text-text-muted">W</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green" /> Labor Rate
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-text-muted">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={config.labor_rate_hr || ""}
                  onChange={(e) => updateConfig("labor_rate_hr", e.target.value)}
                  className="w-20 text-right text-sm font-semibold tabular-nums bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue rounded px-1"
                />
                <span className="text-xs text-text-muted">/hr</span>
              </div>
            </div>
            <ConfigInput label="Purchase Price" configKey="printer_purchase_price" config={config} onChange={updateConfig} type="number" />
            <ConfigInput label="Expected Lifetime" configKey="printer_expected_hours" config={config} onChange={updateConfig} suffix="hrs" type="number" />
          </div>
          <div className="mt-4 rounded-xl glass-raised p-3">
            <div className="text-xs text-text-muted">
              A 2-hour print costs <strong className="text-text-secondary">${previewCost.toFixed(2)}</strong> in electricity at these rates.
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">Integrations</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                {connected ? <Wifi className="h-4 w-4 text-green" /> : <WifiOff className="h-4 w-4 text-red" />}
                MQTT Telemetry
              </span>
              <StatusIndicator ok={connected} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                <Database className="h-4 w-4 text-purple" />
                TimescaleDB
              </span>
              <StatusIndicator ok={dbOk ?? false} />
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-text-secondary">
                <Server className="h-4 w-4 text-blue" />
                ERPNext
              </span>
              <a href={`https://${process.env.NEXT_PUBLIC_ERPNEXT_DOMAIN || "erp.northstarsystems.duckdns.org"}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue font-medium hover:underline">
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">About</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Version</span>
              <span className="text-xs font-mono text-text-muted">0.2.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Stack</span>
              <span className="text-xs text-text-muted">Next.js · TimescaleDB · Mosquitto · ERPNext</span>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
