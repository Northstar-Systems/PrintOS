import { NextResponse } from "next/server";
import { erpGet, erpPut } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { item_code, competitor_name, competitor_price, competitor_url, competitor_source } = await request.json();
    if (!item_code) return NextResponse.json({ error: "item_code is required" }, { status: 400 });

    // Clean URL
    let cleanUrl = competitor_url || "";
    try {
      const u = new URL(cleanUrl);
      const dpMatch = u.pathname.match(/\/dp\/[A-Z0-9]+/);
      if (dpMatch) cleanUrl = `${u.origin}${dpMatch[0]}`;
      const etsyMatch = u.pathname.match(/\/listing\/\d+/);
      if (etsyMatch) cleanUrl = `${u.origin}${etsyMatch[0]}`;
      if (!dpMatch && !etsyMatch) cleanUrl = `${u.origin}${u.pathname}`;
    } catch {}

    const now = new Date().toISOString().replace("T", " ").replace("Z", "");

    await erpPut("Item", item_code, {
      competitor_name,
      competitor_price,
      competitor_url: cleanUrl,
      competitor_source,
      competitor_last_checked: now,
    });

    // Calculate savings
    const item = await erpGet<{ cost_to_print_usd: number }>("Item", item_code);
    if (item) {
      const costToPrint = item.cost_to_print_usd || 0;
      if (costToPrint > 0 && competitor_price > 0) {
        const savings = competitor_price - costToPrint;
        const savingsPct = (savings / competitor_price) * 100;
        await erpPut("Item", item_code, {
          best_retail_price_usd: competitor_price,
          savings_per_unit_usd: savings,
          savings_percent: savingsPct,
          retail_last_checked: now,
        });
      }
    }

    return NextResponse.json({ success: true, message: `Updated ${item_code} with competitor: ${competitor_name} @ $${competitor_price}` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
