import { NextResponse } from "next/server";
import { erpGet } from "@/lib/erpnext";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const item = await erpGet("Item", code);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json(item);
}
