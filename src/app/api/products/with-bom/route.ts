import { NextResponse } from "next/server";
import { erpGet } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

interface BOMItem {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
}

export async function GET() {
  try {
    // Get all product items
    const products = await erpGet<Array<Record<string, unknown>>>(
      "Item",
      '[["item_group","=","Products"]]',
      ["name", "item_name", "cost_to_print_usd", "competitor_price", "competitor_name",
       "savings_per_unit_usd", "savings_percent", "bom_filament_grams", "gcode_filename"]
    );

    if (!products || !Array.isArray(products)) return NextResponse.json([]);

    // For each product, check if it has a BOM with children
    const enriched = await Promise.all(
      products.map(async (product) => {
        let children: BOMItem[] = [];
        let bomName: string | null = null;

        try {
          const boms = await erpGet<Array<{ name: string }>>(
            "BOM",
            `[["item","=","${product.name}"],["is_active","=",1],["is_default","=",1]]`,
            ["name"]
          );

          if (boms && Array.isArray(boms) && boms.length > 0) {
            bomName = boms[0].name;
            const bomDetail = await erpGet<{ items: BOMItem[] }>("BOM", bomName);
            if (bomDetail?.items) {
              children = bomDetail.items.map((i) => ({
                item_code: i.item_code,
                item_name: i.item_name || i.item_code,
                qty: i.qty,
                rate: i.rate,
                amount: i.amount,
                uom: i.uom,
              }));
            }
          }
        } catch {}

        // Determine if this is a parent (has children that are also Products)
        const childProductCodes = children
          .filter((c) => products.some((p) => p.name === c.item_code))
          .map((c) => c.item_code);

        // Determine if this is a child (appears in another product's BOM)
        const isChild = products.some((p) =>
          p.name !== product.name && children.some((c) => c.item_code === product.name)
        );

        return {
          ...product,
          bom_name: bomName,
          bom_children: children,
          child_product_codes: childProductCodes,
          is_assembly: childProductCodes.length > 0,
        };
      })
    );

    // Sort: parents first, then standalone, then children
    enriched.sort((a, b) => {
      if (a.is_assembly && !b.is_assembly) return -1;
      if (!a.is_assembly && b.is_assembly) return 1;
      return 0;
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown" }, { status: 500 });
  }
}
