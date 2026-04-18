"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";

interface TempPoint {
  time: string;
  nozzle: number | null;
  bed: number | null;
  chamber: number | null;
}

const ranges = [
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
  { label: "6h", minutes: 360 },
  { label: "24h", minutes: 1440 },
  { label: "7d", minutes: 10080 },
] as const;

export function TempChart({ minutes: defaultMinutes = 30, showRangeSelector = true }: { minutes?: number; showRangeSelector?: boolean }) {
  const [data, setData] = useState<TempPoint[]>([]);
  const [selectedMinutes, setSelectedMinutes] = useState(defaultMinutes);
  const activeMinutes = showRangeSelector ? selectedMinutes : defaultMinutes;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/telemetry/history?minutes=${activeMinutes}`);
        if (res.ok) setData(await res.json());
      } catch {}
    };
    load();
    const refreshRate = activeMinutes <= 60 ? 15000 : 60000;
    const interval = setInterval(load, refreshRate);
    return () => clearInterval(interval);
  }, [activeMinutes]);

  const formatTick = (v: string) => {
    const d = new Date(v);
    if (activeMinutes <= 60) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    if (activeMinutes <= 1440) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-text-muted">
        No temperature data yet
      </div>
    );
  }

  return (
    <div>
      {showRangeSelector && (
        <div className="flex gap-1 mb-3">
          {ranges.map(({ label, minutes: m }) => (
            <button
              key={label}
              onClick={() => setSelectedMinutes(m)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all ${
                activeMinutes === m
                  ? "bg-blue/20 text-blue"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "hsl(215 15% 45%)" }}
          tickFormatter={formatTick}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(215 15% 45%)" }}
          domain={["auto", "auto"]}
          tickFormatter={(v) => `${v}°`}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(223 40% 10% / 0.8)",
            backdropFilter: "blur(12px)",
            border: "1px solid hsl(210 40% 98% / 0.08)",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 500,
            padding: "8px 12px",
          }}
          labelFormatter={(v) => new Date(v).toLocaleTimeString()}
          formatter={(value) => [`${Number(value)?.toFixed(1)}°`]}
        />
        <Line
          type="monotone"
          dataKey="nozzle"
          stroke="hsl(0 84% 60%)"
          strokeWidth={2}
          dot={false}
          name="Nozzle"
        />
        <Line
          type="monotone"
          dataKey="bed"
          stroke="hsl(39 92% 58%)"
          strokeWidth={2}
          dot={false}
          name="Bed"
        />
        <Line
          type="monotone"
          dataKey="chamber"
          stroke="hsl(212 96% 64%)"
          strokeWidth={1.5}
          dot={false}
          name="Chamber"
        />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
