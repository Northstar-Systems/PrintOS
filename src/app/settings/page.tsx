"use client";

import { useEffect, useState } from "react";
import { useTelemetry } from "@/lib/use-telemetry";
import { Header } from "@/components/header";
import { BottomNav } from "@/components/bottom-nav";
import {
  Wifi,
  WifiOff,
  Database,
  Zap,
  DollarSign,
  Printer,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Server,
} from "lucide-react";

function StatusIndicator({ ok }: { ok: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs font-semibold ${ok ? "text-green" : "text-red"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {ok ? "Connected" : "Disconnected"}
    </div>
  );
}

export default function SettingsPage() {
  const { data, connected } = useTelemetry();
  const [dbOk, setDbOk] = useState<boolean | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/telemetry")
      .then((r) => {
        setDbOk(r.ok);
        return r.json();
      })
      .then(() => fetch("/api/telemetry/history?minutes=9999999"))
      .then((r) => r.json())
      .then((rows) => setRowCount(Array.isArray(rows) ? rows.length : null))
      .catch(() => setDbOk(false));
  }, []);

  const sections = [
    {
      title: "Printer",
      icon: Printer,
      rows: [
        { label: "Model", value: "Bambu Lab P1S" },
        { label: "Serial", value: "01P00C5C3003346", mono: true },
        { label: "IP Address", value: "192.168.1.74", mono: true },
        { label: "Nozzle", value: "0.4mm Stainless Steel" },
        { label: "Purchase Price", value: "$560.00", bold: true },
        { label: "Expected Lifetime", value: "5,000 hours" },
      ],
    },
    {
      title: "Cost Rates",
      icon: Zap,
      rows: [
        { label: "Electricity Rate", value: "$0.12/kWh", icon: Zap, iconColor: "text-amber" },
        { label: "Depreciation Rate", value: "$0.112/hr", icon: Server, iconColor: "text-cyan" },
        { label: "Labor Rate", value: "$0.00/hr", icon: DollarSign, iconColor: "text-blue" },
      ],
      footer: "With these rates, a 2-hour print costs $0.26 in electricity + depreciation.",
    },
  ];

  return (
    <>
      <Header />
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-20 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Settings
        </h2>

        {sections.map(({ title, rows, footer }) => (
          <div key={title} className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
              {title}
            </div>
            <div className="space-y-3">
              {rows.map(({ label, value, ...opts }: { label: string; value: string; mono?: boolean; bold?: boolean; icon?: unknown; iconColor?: string }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">{label}</span>
                  <span className={`text-sm tabular-nums ${
                    opts.mono ? "font-mono text-xs text-text-muted" :
                    opts.bold ? "font-bold" : "font-semibold"
                  }`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {footer && (
              <div className="mt-4 rounded-xl glass-raised p-3">
                <div className="text-xs text-text-muted">{footer}</div>
              </div>
            )}
          </div>
        ))}

        {/* Integrations */}
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
            Integrations
          </div>
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
              <a
                href="https://erp.northstarsystems.duckdns.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue font-medium hover:underline"
              >
                Open <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="glass gradient-border rounded-2xl p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
            About
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Version</span>
              <span className="text-xs font-mono text-text-muted">0.1.0-dev</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Telemetry Rows</span>
              <span className="text-xs font-mono text-text-muted tabular-nums">
                {rowCount !== null ? rowCount.toLocaleString() : "loading..."}
              </span>
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
