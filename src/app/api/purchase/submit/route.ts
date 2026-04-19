import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ERPNEXT_URL = process.env.ERPNEXT_URL ?? "http://192.168.1.33:8080";
const ERPNEXT_KEY = process.env.ERPNEXT_API_KEY ?? "9c0008faa7e73ed";
const ERPNEXT_SECRET = process.env.ERPNEXT_API_SECRET ?? "f7b1857ef2b803f";

const erpHeaders = {
  Authorization: `token ${ERPNEXT_KEY}:${ERPNEXT_SECRET}`,
  "Content-Type": "application/json",
};

async function erpGet(doctype: string, filters?: string) {
  const url = `${ERPNEXT_URL}/api/resource/${doctype}${filters ? `?filters=${encodeURIComponent(filters)}` : ""}`;
  const r = await fetch(url, { headers: erpHeaders });
  if (!r.ok) return null;
  return (await r.json()).data;
}

async function erpPost(doctype: string, data: Record<string, unknown>) {
  const r = await fetch(`${ERPNEXT_URL}/api/resource/${doctype}`, {
    method: "POST",
    headers: erpHeaders,
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    throw new Error(body.exception || `ERPNext ${r.status}`);
  }
  return (await r.json()).data;
}

interface ParsedItem {
  name: string;
  qty: number;
  unit_price: number;
  total: number;
  category: string;
}

interface PurchaseData {
  vendor: string;
  date: string;
  order_id?: string;
  items: ParsedItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

function itemCodeFromName(name: string, category: string): string {
  // Generate a clean item code from the description
  const clean = name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .trim()
    .substring(0, 40)
    .replace(/\s+/g, "-")
    .toUpperCase();
  return clean || `${category.toUpperCase()}-ITEM`;
}

function detectCostCenter(category: string): string {
  switch (category) {
    case "filament": return "Materials - NSS";
    case "hardware": return "Equipment - NSS";
    default: return "Admin - NSS";
  }
}

function detectItemGroup(category: string): string {
  switch (category) {
    case "filament": return "Filament";
    case "hardware": return "Spare Parts";
    default: return "All Item Groups";
  }
}

export async function POST(request: Request) {
  try {
    const body: PurchaseData = await request.json();
    const results: string[] = [];

    // 1. Find or create Supplier
    let supplier = await erpGet("Supplier", `[["supplier_name","=","${body.vendor}"]]`);
    if (!supplier || supplier.length === 0) {
      const created = await erpPost("Supplier", {
        supplier_name: body.vendor,
        supplier_type: "Company",
        supplier_group: "Materials",
      });
      results.push(`Created supplier: ${created.name}`);
    } else {
      results.push(`Found supplier: ${supplier[0].name}`);
    }

    // 2. Find or create Items
    const piItems = [];
    for (const item of body.items) {
      const code = itemCodeFromName(item.name, item.category);
      const existing = await erpGet("Item", `[["item_code","=","${code}"]]`);

      if (!existing || existing.length === 0) {
        const uom = item.category === "filament" ? "g" : "Nos";
        await erpPost("Item", {
          item_code: code,
          item_name: item.name,
          item_group: detectItemGroup(item.category),
          stock_uom: uom,
          is_stock_item: 1,
          is_purchase_item: 1,
          standard_rate: item.unit_price,
          description: item.name,
        });
        results.push(`Created item: ${code}`);
      } else {
        results.push(`Found item: ${code}`);
      }

      piItems.push({
        item_code: code,
        qty: item.qty,
        rate: item.unit_price,
        cost_center: detectCostCenter(item.category),
      });
    }

    // 3. Create Purchase Invoice
    const pi = await erpPost("Purchase Invoice", {
      supplier: body.vendor,
      company: "Northstar Systems LLC",
      posting_date: body.date || new Date().toISOString().split("T")[0],
      due_date: body.date || new Date().toISOString().split("T")[0],
      remarks: `Auto-parsed from receipt. Order: ${body.order_id || "N/A"}`,
      items: piItems,
    });
    results.push(`Created Purchase Invoice: ${pi.name}`);

    return NextResponse.json({
      success: true,
      purchase_invoice: pi.name,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
