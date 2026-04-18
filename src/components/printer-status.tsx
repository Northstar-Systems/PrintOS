"use client";

import { useTelemetry } from "@/lib/use-telemetry";
import { CheckCircle2, WifiOff, Loader2 } from "lucide-react";

function ProgressRing({ percent, size = 88 }: { percent: number; size?: number }) {
  const strokeWidth = 7;
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
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(39 92% 58%)" />
            <stop offset="100%" stopColor="hsl(25 95% 53%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-extrabold tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

function formatTemp(val: number | string | null): string {
  if (val === null || val === undefined || val === "") return "--";
  return `${Number(val).toFixed(0)}°`;
}

export function PrinterStatus() {
  const { data, connected } = useTelemetry();

  if (!data) {
    return (
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="flex items-center gap-3 text-text-muted">
          <WifiOff className="h-5 w-5" />
          <div>
            <div className="text-sm font-medium">Loading printer data...</div>
            <div className="text-xs opacity-60">Fetching latest telemetry</div>
          </div>
        </div>
      </div>
    );
  }

  const state = data?.gcode_state;
  const isPrinting = state === "RUNNING";

  const cardClass = isPrinting
    ? "glass gradient-border glow-amber"
    : state === "FAILED"
    ? "glass gradient-border glow-red"
    : state === "FINISH"
    ? "glass gradient-border glow-green"
    : "glass gradient-border";

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${cardClass}`}>
      {/* Ambient gradient bg when printing */}
      {isPrinting && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber/5 via-transparent to-transparent pointer-events-none" />
      )}
      {state === "FINISH" && (
        <div className="absolute inset-0 bg-gradient-to-br from-green/5 via-transparent to-transparent pointer-events-none" />
      )}

      <div className="relative">
        {/* Top: name + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`h-2.5 w-2.5 rounded-full ${
              isPrinting ? "bg-amber animate-pulse" :
              state === "FINISH" ? "bg-green" :
              state === "FAILED" ? "bg-red" :
              "bg-text-muted"
            }`} />
            <span className="text-sm font-bold">Bambu P1S</span>
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest ${
            isPrinting ? "text-amber" :
            state === "FINISH" ? "text-green" :
            state === "FAILED" ? "text-red" :
            "text-text-muted"
          }`}>
            {isPrinting ? "Printing" :
             state === "FINISH" ? "Complete" :
             state === "FAILED" ? "Failed" :
             state === "PAUSE" ? "Paused" : "Idle"}
          </span>
        </div>

        {/* Printing: progress + details */}
        {isPrinting && data && (
          <div className="mt-5 flex items-center gap-5">
            <ProgressRing percent={data.mc_percent ?? 0} />
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="text-base font-bold truncate">
                {data.subtask_name || "Unknown job"}
              </div>
              <div className="text-xs text-text-secondary font-medium">
                Layer {data.layer_num ?? "--"} / {data.total_layers ?? "--"}
              </div>
              <div className="flex gap-3 mt-2">
                {[
                  { label: "Nozzle", value: formatTemp(data.nozzle_temp), target: formatTemp(data.nozzle_target) },
                  { label: "Bed", value: formatTemp(data.bed_temp), target: formatTemp(data.bed_target) },
                ].map(({ label, value, target }) => (
                  <div key={label} className="text-xs">
                    <span className="text-text-muted">{label} </span>
                    <span className="font-semibold tabular-nums text-text-secondary">{value}</span>
                    {target && target !== "--" && Number(target.replace("°","")) > 0 && (
                      <span className="text-text-muted"> / {target}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Finished */}
        {state === "FINISH" && data && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green" />
              <span className="text-sm font-semibold">
                {data.subtask_name || "Print"} — completed
              </span>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-text-muted">
              <span>Nozzle <span className="text-text-secondary tabular-nums">{formatTemp(data.nozzle_temp)}</span></span>
              <span>Bed <span className="text-text-secondary tabular-nums">{formatTemp(data.bed_temp)}</span></span>
              {data.chamber_temp && (
                <span>Chamber <span className="text-text-secondary tabular-nums">{formatTemp(data.chamber_temp)}</span></span>
              )}
            </div>
          </div>
        )}

        {/* Idle */}
        {!isPrinting && state !== "FINISH" && state !== "FAILED" && data && (
          <div className="mt-3 flex gap-4 text-xs text-text-muted">
            <span>Nozzle <span className="text-text-secondary tabular-nums">{formatTemp(data.nozzle_temp)}</span></span>
            <span>Bed <span className="text-text-secondary tabular-nums">{formatTemp(data.bed_temp)}</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
