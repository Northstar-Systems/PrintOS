"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PrinterStatus } from "@/components/printer-status";
import { KpiCard } from "@/components/kpi-card";
import { TempChart } from "@/components/temp-chart";
import { StatusBadge } from "@/components/status-badge";
import { ItemModal } from "@/components/item-modal";
import { TimeRangeSelector, TimeRange } from "@/components/time-range-selector";
import {
  Clock,
  Layers,
  CheckCircle2,
  XCircle,
  Timer,
  Activity,
} from "lucide-react";

interface Kpis {
  total_prints: number;
  failed_prints: number;
  success_rate: number;
  total_hours: number;
}

interface PrintJob {
  id: string;
  ended_at: string;
  status: string;
  job_name: string;
  gcode_file: string;
  filament_grams: number;
  filament_type: string;
  layer_num: number;
  total_layers: number;
  total_cost: number;
  filament_cost: number;
  estimated_seconds: number;
  item_code: string | null;
}

function formatRelativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HomePage() {
  const router = useRouter();
  const [range, setRange] = useState<TimeRange>("30D");
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [prints, setPrints] = useState<PrintJob[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/kpis").then((r) => r.ok ? r.json() : Promise.reject("KPI fetch failed")).then(setKpis),
      fetch("/api/prints").then((r) => r.ok ? r.json() : Promise.reject("Prints fetch failed")).then(setPrints),
    ]).catch((e) => setError(typeof e === "string" ? e : "Failed to load dashboard data"));
  }, []);

  return (
    <div className="space-y-4">
      {/* Time range */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Overview
        </h2>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* Printer Status — hero card */}
      <PrinterStatus />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 stagger-children">
        <KpiCard
          title="Total Prints"
          value={kpis?.total_prints?.toString() ?? "0"}
          icon={CheckCircle2}
          gradient="from-emerald-500 to-green-700"
          loading={!kpis}
        />
        <KpiCard
          title="Success Rate"
          value={kpis ? `${kpis.success_rate}%` : "--"}
          icon={Activity}
          gradient="from-violet-500 to-purple-700"
          loading={!kpis}
        />
        <KpiCard
          title="Print Hours"
          value={kpis ? `${kpis.total_hours.toFixed(1)}h` : "--"}
          icon={Timer}
          gradient="from-blue-500 to-indigo-700"
          loading={!kpis}
        />
        <KpiCard
          title="Failed"
          value={kpis?.failed_prints?.toString() ?? "0"}
          icon={XCircle}
          gradient="from-rose-500 to-red-700"
          loading={!kpis}
        />
      </div>

      {/* Temperature Chart */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Temperature
          </div>
        </div>
        <TempChart minutes={30} showRangeSelector={true} />
        <div className="mt-3 h-1.5 w-full rounded-full opacity-80" style={{ background: "linear-gradient(to right, #22d3ee, #3b82f6, #a855f7, #ec4899, #f97316, #facc15)" }} />
        <div className="mt-3 flex gap-5 text-[10px] font-medium text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red" /> Nozzle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber" /> Bed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-blue" /> Chamber
          </span>
        </div>
      </div>

      {/* Recent Prints */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Recent Prints
        </div>
        {prints.length === 0 ? (
          <div className="py-10 text-center">
            <Layers className="mx-auto h-8 w-8 text-text-muted/20" />
            <p className="mt-3 text-sm text-text-muted">No prints detected yet</p>
            <p className="mt-1 text-xs text-text-muted/60">
              Start a print and it will appear here automatically
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {prints.slice(0, 5).map((p, i) => {
              const itemCode = p.item_code;
              return (
                <div
                  key={i}
                  onClick={() => p.id ? router.push(`/print/${p.id}`) : itemCode && setSelectedItem(itemCode)}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors cursor-pointer active:scale-[0.98] ${
                    p.status === "FAILED"
                      ? "bg-red/5 border border-red/10"
                      : "glass-raised hover:bg-surface-raised"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold truncate">
                        {p.job_name || "Unknown"}
                      </span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-text-muted">
                      {p.filament_grams > 0 && (
                        <span>{p.filament_grams}g {p.filament_type || ""}</span>
                      )}
                      {p.total_cost > 0 && (
                        <span className="text-green font-semibold">${Number(p.total_cost).toFixed(2)}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {p.layer_num}/{p.total_layers}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(p.ended_at)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      <ItemModal itemCode={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
