"use client";

import { useState } from "react";
import { KpiCard } from "@/components/kpi-card";
import { TimeRangeSelector, TimeRange } from "@/components/time-range-selector";
import { DollarSign, TrendingUp, Package, BarChart3 } from "lucide-react";

export default function MoneyPage() {
  const [range, setRange] = useState<TimeRange>("30D");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Financials
        </h2>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* P&L Summary */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Period Summary
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Savings (vs Retail)</span>
            <span className="text-2xl font-extrabold text-green tabular-nums">$0.00</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Total Costs</span>
            <span className="text-2xl font-extrabold text-red tabular-nums">$0.00</span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Net Position</span>
            <span className="text-2xl font-extrabold text-text-muted tabular-nums">$0.00</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard title="Avg Cost/Print" value="$0.00" icon={DollarSign} gradient="from-amber-500 to-orange-700" />
        <KpiCard title="Total Savings" value="$0.00" icon={TrendingUp} gradient="from-emerald-500 to-green-700" />
        <KpiCard title="Products" value="0" icon={Package} gradient="from-violet-500 to-purple-700" />
        <KpiCard title="Price Checks" value="0" icon={BarChart3} gradient="from-cyan-500 to-teal-700" />
      </div>

      {/* Cost Breakdown */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Cost Breakdown
        </div>
        <div className="py-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-raised/30 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-text-muted/30" />
          </div>
          <p className="mt-4 text-sm font-medium text-text-muted">No cost data yet</p>
          <p className="mt-1 text-xs text-text-muted/50 max-w-[260px] mx-auto">
            Create a product in ERPNext with a BOM to see filament, electricity, and depreciation breakdowns
          </p>
        </div>
      </div>

      {/* Savings Leaderboard */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Savings Leaderboard
        </div>
        <div className="py-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-raised/30 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-text-muted/30" />
          </div>
          <p className="mt-4 text-sm font-medium text-text-muted">No savings data yet</p>
          <p className="mt-1 text-xs text-text-muted/50 max-w-[260px] mx-auto">
            Add retail comparison URLs to your products in ERPNext to see how much you save printing vs buying
          </p>
        </div>
      </div>

      {/* Expenses */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Expenses by Category
        </div>
        <div className="py-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-surface-raised/30 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-text-muted/30" />
          </div>
          <p className="mt-4 text-sm font-medium text-text-muted">No expenses recorded</p>
          <p className="mt-1 text-xs text-text-muted/50 max-w-[260px] mx-auto">
            Record purchases in ERPNext with cost centers and they will appear here grouped by category
          </p>
        </div>
      </div>
    </div>
  );
}
