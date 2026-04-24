import { NextResponse } from "next/server";
import { erpGet, erpPost, APP_CONFIG } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

interface ParsedItem { name: string; qty: number; unit_price: number; total: number; category: string; }
interface PurchaseData { vendor: string; date: string; order_id?: string; items: ParsedItem[]; subtotal: number; tax: number; shipping: number; total: number; cost_center?: string; }

function itemCodeFromName(name: string): string {
  return name.replace(/[^a-zA-Z0-9\s-]/g, "").trim().substring(0, 40).replace(/\s+/g, "-").toUpperCase() || "ITEM";
}

function detectItemGroup(cat: string): string {
  return cat === "filament" ? "Filament" : cat === "hardware" ? "Spare Parts" : "All Item Groups";
}

export async function POST(request: Request) {
  try {
    const body: PurchaseData = await request.json();
    const costCenter = body.cost_center || "General - NSS";
    const results: string[] = [];

    // Find or create supplier
    const suppliers = await erpGet<Array<{ name: string }>>("Supplier", `[["supplier_name","=","${body.vendor}"]]`);
    if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
      const c = await erpPost("Supplier", { supplier_name: body.vendor, supplier_type: "Company", supplier_group: "All Supplier Groups" });
      results.push(`Created supplier: ${c.name}`);
    } else {
      results.push(`Found supplier: ${suppliers[0].name}`);
    }

    // Find or create items
    const piItems = [];
    for (const item of body.items) {
      const code = itemCodeFromName(item.name);
      const existing = await erpGet<Array<{ name: string }>>("Item", `[["item_code","=","${code}"]]`);
      if (!existing || !Array.isArray(existing) || existing.length === 0) {
        await erpPost("Item", {
          item_code: code,
          item_name: item.name.substring(0, 140),
          item_group: detectItemGroup(item.category),
          stock_uom: item.category === "filament" ? "g" : "Nos",
          is_stock_item: 1,
          is_purchase_item: 1,
          standard_rate: item.unit_price,
          description: item.name,
        });
        results.push(`Created item: ${code}`);
      } else {
        results.push(`Found item: ${code}`);
      }
      piItems.push({ item_code: code, qty: item.qty, rate: item.unit_price, cost_center: costCenter });
    }

    // Create Purchase Invoice
    const today = new Date().toISOString().split("T")[0];
    const pi = await erpPost("Purchase Invoice", {
      supplier: body.vendor,
      company: APP_CONFIG.company,
      posting_date: today,
      due_date: today,
      cost_center: costCenter,
      remarks: `Auto-parsed receipt. Order: ${body.order_id || "N/A"}. Original date: ${body.date || "unknown"}`,
      items: piItems,
    });
    results.push(`Created Purchase Invoice: ${pi.name}`);
    results.push(`Cost Center: ${costCenter.replace(" - NSS", "")}`);

    return NextResponse.json({ success: true, purchase_invoice: pi.name, results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
