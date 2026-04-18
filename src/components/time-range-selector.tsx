"use client";

const ranges = ["7D", "30D", "90D", "YTD", "All"] as const;
export type TimeRange = (typeof ranges)[number];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-0.5 rounded-xl glass-raised p-1">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={`rounded-lg px-2.5 py-1 text-[10px] font-bold tracking-wide transition-all ${
            value === r
              ? "bg-blue/20 text-blue shadow-sm shadow-blue/10"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
