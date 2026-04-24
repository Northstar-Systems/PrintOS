import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { rows } = await pool.query("SELECT key, value FROM app_config ORDER BY key");
  const config: Record<string, string> = {};
  for (const row of rows) config[row.key] = row.value;
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  try {
    const updates: Record<string, string> = await request.json();
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        "INSERT INTO app_config (key, value, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()",
        [key, String(value)]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
