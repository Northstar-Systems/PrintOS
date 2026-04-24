"use client";

import { useState, useEffect } from "react";
import { KpiCard } from "@/components/kpi-card";
import { TimeRangeSelector, TimeRange } from "@/components/time-range-selector";
import { DollarSign, TrendingUp, BarChart3, Receipt, Sparkles } from "lucide-react";

interface Expense {
  name: string;
  date: string;
  description: string;
  amount: number;
  cost_center: string;
}

interface SavingsItem {
  name: string;
  item_name: string;
  cost_to_print: number;
  competitor_price: number;
  savings: number;
  savings_pct: number;
}

interface FinancialData {
  expenses: Expense[];
  total_expenses: number;
  total_revenue: number;
  total_savings: number;
  savings_items: SavingsItem[];
  break_even: number;
  net: number;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MoneyPage() {
  const [range, setRange] = useState<TimeRange>("30D");
  const [data, setData] = useState<FinancialData | null>(null);

  useEffect(() => {
    fetch("/api/expenses").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const totalExpenses = data?.total_expenses ?? 0;
  const totalRevenue = data?.total_revenue ?? 0;
  const totalSavings = data?.total_savings ?? 0;
  const net = data?.net ?? 0;
  const expenses = data?.expenses ?? [];
  const savingsItems = data?.savings_items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          3D Printing Financials
        </h2>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* P&L Summary */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          P&L Summary
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Total Costs</span>
            <span className="text-2xl font-extrabold text-red tabular-nums">
              -${totalExpenses.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Savings (vs Retail)</span>
            <span className={`text-2xl font-extrabold tabular-nums ${totalSavings > 0 ? "text-green" : "text-text-muted"}`}>
              {totalSavings > 0 ? `+$${totalSavings.toFixed(2)}` : "$0.00"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Revenue</span>
            <span className={`text-2xl font-extrabold tabular-nums ${totalRevenue > 0 ? "text-green" : "text-text-muted"}`}>
              ${totalRevenue.toFixed(2)}
            </span>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-text-primary">Net Position</span>
            <span className={`text-2xl font-extrabold tabular-nums ${net >= 0 ? "text-green" : "text-red"}`}>
              {net >= 0 ? "" : "-"}${Math.abs(net).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          title="Total Invested"
          value={`$${totalExpenses.toFixed(2)}`}
          icon={DollarSign}
          gradient="from-rose-500 to-red-700"
        />
        <KpiCard
          title="Savings vs Retail"
          value={totalSavings > 0 ? `$${totalSavings.toFixed(2)}` : "$0.00"}
          icon={Sparkles}
          gradient="from-emerald-500 to-green-700"
        />
        <KpiCard
          title="Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          gradient="from-blue-500 to-indigo-700"
        />
        <KpiCard
          title="To Break Even"
          value={(data?.break_even ?? 0) > 0 ? `$${(data?.break_even ?? 0).toFixed(2)}` : "Profitable!"}
          icon={BarChart3}
          gradient={(data?.break_even ?? 0) <= 0 ? "from-emerald-500 to-green-700" : "from-amber-500 to-orange-700"}
        />
      </div>

      {/* Savings Leaderboard */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Savings Leaderboard
        </div>
        {savingsItems.length === 0 ? (
          <div className="py-8 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-text-muted/30" />
            <p className="mt-3 text-sm text-text-muted">No comparisons yet</p>
            <p className="mt-1 text-xs text-text-muted/50">
              Add competitor prices in Tools → Price Comparison
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {savingsItems.sort((a, b) => b.savings - a.savings).map((item) => (
              <div key={item.name} className="glass-raised rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{item.item_name}</div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-text-muted">
                      <span>${item.cost_to_print.toFixed(2)} to print</span>
                      <span>vs ${item.competitor_price.toFixed(2)} retail</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-green tabular-nums">
                      ${item.savings.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-green font-semibold">
                      {item.savings_pct.toFixed(0)}% saved
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Ledger */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Expense Ledger
        </div>
        {expenses.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-muted">No expenses recorded</div>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.name}
                className="flex items-center justify-between glass-raised rounded-xl px-4 py-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{exp.description}</div>
                  <div className="mt-0.5 text-[11px] text-text-muted">
                    {formatDate(exp.date)}
                  </div>
                </div>
                <span className="text-sm font-bold tabular-nums text-red">
                  -${exp.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
