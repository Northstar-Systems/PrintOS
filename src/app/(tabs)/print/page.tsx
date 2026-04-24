"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTelemetry } from "@/lib/use-telemetry";
import { StatusBadge } from "@/components/status-badge";
import { TempChart } from "@/components/temp-chart";
import { Clock, Layers, Thermometer, Fan, Gauge, Printer, Package } from "lucide-react";

interface PrintJob {
  ended_at: string;
  status: string;
  job_name: string;
  layer_num: number;
  total_layers: number;
}

function ProgressRing({ percent, size = 120 }: { percent: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(223 20% 22% / 0.5)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#printProgressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="printProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(39 92% 58%)" />
            <stop offset="100%" stopColor="hsl(25 95% 53%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-extrabold tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

function formatTemp(val: number | string | null): string {
  if (val === null || val === undefined || val === "") return "--";
  return `${Number(val).toFixed(0)}°C`;
}

export default function PrintPage() {
  const { data } = useTelemetry();
  const [prints, setPrints] = useState<PrintJob[]>([]);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/prints").then((r) => r.json()).then(setPrints).catch(() => {});
  }, []);

  const isPrinting = data?.gcode_state === "RUNNING";
  const filteredPrints =
    filter === "All" ? prints : prints.filter((p) => p.status === filter);

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Printer</h2>
        <Link href="/print/products" className="flex items-center gap-1.5 rounded-xl glass-raised px-3 py-1.5 text-[10px] font-bold text-blue transition-all hover:bg-blue/10">
          <Package className="h-3 w-3" /> Product Catalog
        </Link>
      </div>

      {/* Live Printer Panel */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Live Printer
        </div>

        {isPrinting && data ? (
          <div className="space-y-5">
            <div className="flex items-center gap-6">
              <ProgressRing percent={data.mc_percent ?? 0} />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="text-lg font-extrabold truncate">
                  {data.subtask_name || "Unknown Job"}
                </div>
                <div className="flex items-center gap-1 text-sm text-text-secondary font-medium">
                  <Layers className="h-4 w-4" />
                  Layer {data.layer_num ?? "--"} / {data.total_layers ?? "--"}
                </div>
                <StatusBadge status="RUNNING" />
              </div>
            </div>

            <TempChart minutes={10} showRangeSelector={false} />

            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Thermometer, color: "text-red", label: "Nozzle", value: formatTemp(data.nozzle_temp) },
                { icon: Fan, color: "text-blue", label: "Fan", value: data.fan_speed ?? "--" },
                { icon: Gauge, color: "text-amber", label: "Bed", value: formatTemp(data.bed_temp) },
              ].map(({ icon: Icon, color, label, value }) => (
                <div key={label} className="glass-raised rounded-xl p-3 text-center">
                  <Icon className={`mx-auto h-4 w-4 ${color}`} />
                  <div className="mt-1.5 text-[10px] text-text-muted font-medium">{label}</div>
                  <div className="text-sm font-bold tabular-nums">{value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-text-muted">
            <div className="h-12 w-12 rounded-2xl bg-surface-raised/30 flex items-center justify-center">
              <Printer className="h-6 w-6 text-text-muted/30" />
            </div>
            <div className="mt-4 text-sm font-medium">
              {data?.gcode_state === "FINISH"
                ? `${data.subtask_name ?? "Last print"} — Complete`
                : "Printer idle"}
            </div>
            {data && (
              <div className="mt-1 text-xs text-text-muted/60">
                Nozzle {formatTemp(data.nozzle_temp)} · Bed {formatTemp(data.bed_temp)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2">
        {["All", "FINISH", "FAILED"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-1.5 text-[10px] font-bold tracking-wide transition-all ${
              filter === f
                ? "bg-blue/20 text-blue shadow-sm shadow-blue/10"
                : "glass-raised text-text-muted hover:text-text-secondary"
            }`}
          >
            {f === "FINISH" ? "Success" : f === "FAILED" ? "Failed" : f}
          </button>
        ))}
      </div>

      {/* Print History */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Print History
        </div>
        {filteredPrints.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-raised/30 flex items-center justify-center">
              <Layers className="h-6 w-6 text-text-muted/30" />
            </div>
            <p className="mt-4 text-sm font-medium text-text-muted">
              {prints.length === 0 ? "No completed prints yet" : "No prints match this filter"}
            </p>
            <p className="mt-1 text-xs text-text-muted/50">
              {prints.length === 0 && "Start printing and jobs will appear here automatically"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPrints.map((p, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-xl px-4 py-3.5 transition-colors ${
                  p.status === "FAILED"
                    ? "bg-red/5 border border-red/10"
                    : "glass-raised"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold truncate">
                      {p.job_name || "Unknown"}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text-muted">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      {p.layer_num}/{p.total_layers} layers
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(p.ended_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
