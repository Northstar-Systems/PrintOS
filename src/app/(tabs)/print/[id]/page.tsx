"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TempChart } from "@/components/temp-chart";
import { StatusBadge } from "@/components/status-badge";
import {
  ArrowLeft, Clock, Layers, Thermometer, DollarSign,
  Package, Zap, AlertTriangle, CheckCircle2,
} from "lucide-react";

interface PrintJob {
  id: string;
  started_at: string;
  completed_at: string;
  status: string;
  gcode_file: string;
  subtask_name: string;
  object_name: string;
  filament_type: string;
  filament_color: string;
  filament_grams: number;
  layer_height_mm: number;
  total_layers: number;
  nozzle_diameter: number;
  bed_type: string;
  has_support: boolean;
  estimated_seconds: number;
  actual_seconds: number;
  filament_cost: number;
  electricity_cost: number;
  depreciation_cost: number;
  total_cost: number;
  temperature_history: Array<{ time: string; nozzle: number; bed: number; chamber: number }>;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function CostRow({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof DollarSign; color: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <Icon className={`h-4 w-4 ${color}`} />
        {label}
      </span>
      <span className="text-sm font-bold tabular-nums">${value.toFixed(4)}</span>
    </div>
  );
}

export default function PrintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [job, setJob] = useState<PrintJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/prints/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setJob)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const displayName = job?.object_name || job?.subtask_name || job?.gcode_file || "Unknown";
  const isFailed = job?.status === "FAILED";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-surface-raised">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">Print Detail</h2>
      </div>

      {loading && (
        <div className="glass gradient-border rounded-2xl p-8 text-center">
          <div className="h-6 w-48 mx-auto rounded bg-surface-raised animate-pulse" />
        </div>
      )}

      {error && (
        <div className="glass gradient-border glow-red rounded-2xl p-6 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red" />
          <p className="mt-2 text-sm text-red">{error}</p>
        </div>
      )}

      {job && (
        <>
          {/* Header card */}
          <div className={`glass gradient-border rounded-2xl p-5 ${isFailed ? "glow-red" : "glow-green"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-bold">{displayName}</div>
                <div className="mt-1 text-xs text-text-muted font-mono">{job.gcode_file}</div>
              </div>
              <StatusBadge status={job.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(job.actual_seconds || job.estimated_seconds)}
              </span>
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" />
                {job.total_layers} layers @ {job.layer_height_mm}mm
              </span>
              {job.filament_grams > 0 && (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {job.filament_grams}g {job.filament_type}
                </span>
              )}
              {job.has_support && <span>+ supports</span>}
              <span>{job.bed_type?.replace("_", " ")}</span>
              <span>{job.nozzle_diameter}mm nozzle</span>
            </div>
            {job.estimated_seconds > 0 && job.actual_seconds > 0 && (
              <div className="mt-2 text-xs text-text-muted">
                Est. {formatDuration(job.estimated_seconds)} → Actual {formatDuration(job.actual_seconds)}
                {job.actual_seconds > job.estimated_seconds * 1.1 && (
                  <span className="text-amber ml-1">({Math.round((job.actual_seconds / job.estimated_seconds - 1) * 100)}% over)</span>
                )}
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          {job.total_cost > 0 && (
            <div className="glass gradient-border rounded-2xl p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
                Cost Breakdown
              </div>
              <CostRow label="Filament" value={job.filament_cost || 0} icon={Package} color="text-purple" />
              <CostRow label="Electricity" value={job.electricity_cost || 0} icon={Zap} color="text-amber" />
              {(job.depreciation_cost || 0) > 0 && (
                <CostRow label="Depreciation" value={job.depreciation_cost} icon={Thermometer} color="text-cyan" />
              )}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />
              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-bold">Total Cost</span>
                <span className="text-lg font-extrabold tabular-nums text-green">${Number(job.total_cost).toFixed(2)}</span>
              </div>
              {job.filament_grams > 0 && (
                <div className="mt-1 text-xs text-text-muted">
                  ${(Number(job.total_cost) / 1).toFixed(2)}/unit · ${(Number(job.filament_cost) / job.filament_grams).toFixed(4)}/g filament rate
                </div>
              )}
            </div>
          )}

          {/* Temperature chart */}
          {job.temperature_history && job.temperature_history.length > 0 && (
            <div className="glass gradient-border rounded-2xl p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
                Temperature During Print
              </div>
              <div style={{ height: 200 }}>
                <TempChart minutes={0} showRangeSelector={false} />
              </div>
              <div className="mt-2 flex gap-5 text-[10px] font-medium text-text-muted">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red" /> Nozzle</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber" /> Bed</span>
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue" /> Chamber</span>
              </div>
            </div>
          )}

          {/* Failure info */}
          {isFailed && (
            <div className="glass gradient-border glow-red rounded-2xl p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-red mb-3">
                Print Failed
              </div>
              <div className="text-sm text-text-secondary">
                This print failed after {formatDuration(job.actual_seconds)}.
              </div>
              {job.filament_cost > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-red font-bold">${Number(job.filament_cost).toFixed(2)}</span>
                  <span className="text-text-muted"> of filament wasted ({job.filament_grams}g)</span>
                </div>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">Timeline</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-blue" />
                <div className="text-xs">
                  <span className="text-text-muted">Started </span>
                  <span className="font-semibold">{new Date(job.started_at).toLocaleString()}</span>
                </div>
              </div>
              {job.completed_at && (
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${isFailed ? "bg-red" : "bg-green"}`} />
                  <div className="text-xs">
                    <span className="text-text-muted">{isFailed ? "Failed " : "Completed "}</span>
                    <span className="font-semibold">{new Date(job.completed_at).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
