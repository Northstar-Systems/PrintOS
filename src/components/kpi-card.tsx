"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string;
  trend?: { delta: string; direction: "up" | "down" | "flat"; inverted?: boolean };
  icon?: LucideIcon;
  gradient?: string;
  loading?: boolean;
}

export function KpiCard({ title, value, trend, icon: Icon, gradient, loading }: KpiCardProps) {
  const trendColor = !trend
    ? ""
    : trend.direction === "flat"
    ? "text-white/50"
    : (trend.direction === "up") !== (trend.inverted ?? false)
    ? "text-white"
    : "text-white/70";

  const TrendIcon =
    trend?.direction === "up"
      ? TrendingUp
      : trend?.direction === "down"
      ? TrendingDown
      : Minus;

  const bg = gradient ?? "from-slate-700 to-slate-800";

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bg} p-4 shadow-lg transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98]`}>
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">
          {title}
        </div>
        {Icon && (
          <div className="rounded-lg bg-white/10 p-1.5">
            <Icon className="h-3.5 w-3.5 text-white/80" />
          </div>
        )}
      </div>
      <div className="mt-2 text-[28px] font-extrabold tabular-nums leading-none tracking-tight text-white animate-count-up">
        {loading ? (
          <div className="h-8 w-20 animate-pulse rounded-lg bg-white/10" />
        ) : (
          value
        )}
      </div>
      {trend && (
        <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{trend.delta}</span>
        </div>
      )}
      {/* Decorative circle */}
      <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/5" />
    </div>
  );
}
