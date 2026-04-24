import { NextResponse } from "next/server";
import { erpGet, APP_CONFIG } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

interface JEAccount {
  account: string;
  debit_in_account_currency: number;
  credit_in_account_currency: number;
  cost_center: string;
}

export async function GET() {
  try {
    const cc = APP_CONFIG.costCenter;
    let expenses: { name: string; date: string; description: string; amount: number }[] = [];
    let totalExpenses = 0;
    const totalRevenue = 0;

    // Journal Entries
    const jes = await erpGet<Array<{ name: string; posting_date: string; user_remark: string; total_debit: number }>>(
      "Journal Entry",
      '[["docstatus","=",1]]',
      ["name", "posting_date", "user_remark", "total_debit"]
    );

    if (jes && Array.isArray(jes)) {
      for (const je of jes) {
        const detail = await erpGet<{ accounts: JEAccount[] }>("Journal Entry", je.name);
        if (!detail) continue;
        const accounts = detail.accounts || [];
        const debitRow = accounts.find((a) => a.debit_in_account_currency > 0);
        const creditRow = accounts.find((a) => a.credit_in_account_currency > 0);
        if (!debitRow) continue;
        if (debitRow.account?.includes("Cash") && creditRow?.account?.includes("Capital")) continue;
        if (debitRow.cost_center !== cc) continue;
        expenses.push({ name: je.name, date: je.posting_date, description: je.user_remark || "Expense", amount: je.total_debit });
        totalExpenses += je.total_debit;
      }
    }

    // Purchase Invoices
    const pis = await erpGet<Array<{ name: string; posting_date: string; supplier: string; grand_total: number; cost_center: string; remarks: string }>>(
      "Purchase Invoice",
      '[["docstatus","=",1]]',
      ["name", "posting_date", "supplier", "grand_total", "cost_center", "remarks"]
    );

    if (pis && Array.isArray(pis)) {
      for (const pi of pis) {
        if (pi.cost_center !== cc) continue;
        expenses.push({ name: pi.name, date: pi.posting_date, description: `${pi.supplier} - ${pi.remarks || "Purchase"}`, amount: pi.grand_total });
        totalExpenses += pi.grand_total;
      }
    }

    // Hardcoded printer cost
    expenses.unshift({ name: "PRINTER", date: APP_CONFIG.printerCostDate, description: "Bambu Lab P1S 3D Printer", amount: APP_CONFIG.printerCost });
    totalExpenses += APP_CONFIG.printerCost;

    // Savings from products with competitor pricing
    let totalSavings = 0;
    const savingsItems: { name: string; item_name: string; cost_to_print: number; competitor_price: number; savings: number; savings_pct: number }[] = [];

    const products = await erpGet<Array<{ name: string; item_name: string; cost_to_print_usd: number; competitor_price: number }>>(
      "Item",
      '[["item_group","=","Products"],["competitor_price",">",0]]',
      ["name", "item_name", "cost_to_print_usd", "competitor_price"]
    );

    if (products && Array.isArray(products)) {
      for (const p of products) {
        const costToPrint = p.cost_to_print_usd || 0;
        const competitorPrice = p.competitor_price || 0;
        if (competitorPrice > 0) {
          const sav = competitorPrice - costToPrint;
          const savPct = (sav / competitorPrice) * 100;
          savingsItems.push({ name: p.name, item_name: p.item_name, cost_to_print: costToPrint, competitor_price: competitorPrice, savings: sav, savings_pct: savPct });
          totalSavings += sav;
        }
      }
    }

    const breakEven = totalExpenses - totalSavings - totalRevenue;

    return NextResponse.json({
      expenses,
      total_expenses: totalExpenses,
      total_revenue: totalRevenue,
      total_savings: totalSavings,
      savings_items: savingsItems,
      break_even: breakEven,
      net: totalRevenue + totalSavings - totalExpenses,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
