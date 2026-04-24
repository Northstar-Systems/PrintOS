import { NextResponse } from "next/server";
import { erpGet } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await erpGet<Array<Record<string, unknown>>>(
      "Item",
      '[["item_group","=","Products"]]',
      ["name", "item_name", "cost_to_print_usd", "competitor_name", "competitor_price", "competitor_url", "bom_filament_grams"]
    );
    return NextResponse.json(items || []);
  } catch {
    return NextResponse.json([]);
  }
}
