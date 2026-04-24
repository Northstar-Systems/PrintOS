import { pool } from "@/lib/db";
import { erpGet } from "@/lib/erpnext";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { rows } = await pool.query(`
    SELECT COALESCE(pj.completed_at, pj.started_at) AS ended_at, pj.status,
      COALESCE(pj.object_name, pj.subtask_name, pj.gcode_file) AS job_name,
      pj.gcode_file, pj.filament_grams, pj.filament_type,
      pj.total_layers AS layer_num, pj.total_layers, pj.total_cost,
      pj.filament_cost, pj.estimated_seconds
    FROM print_jobs pj ORDER BY pj.started_at DESC LIMIT 20
  `);

  // Build gcode_filename → item_code map from ERPNext
  let itemMap: Record<string, string> = {};
  try {
    const items = await erpGet<Array<{ name: string; gcode_filename: string }>>(
      "Item",
      '[["item_group","=","Products"],["gcode_filename","is","set"]]',
      ["name", "gcode_filename"]
    );
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.gcode_filename) itemMap[item.gcode_filename] = item.name;
      }
    }
  } catch {}

  const enriched = rows.map((row) => ({
    ...row,
    item_code: row.gcode_file ? itemMap[row.gcode_file] || null : null,
  }));

  if (enriched.length === 0) {
    const { rows: tr } = await pool.query(`
      SELECT MAX(time) AS ended_at, gcode_state AS status, subtask_name AS job_name,
        NULL AS gcode_file, NULL AS filament_grams, NULL AS filament_type,
        MAX(layer_num) AS layer_num, MAX(total_layers) AS total_layers,
        NULL AS total_cost, NULL AS filament_cost, NULL AS estimated_seconds, NULL AS item_code
      FROM telemetry WHERE gcode_state IN ('FINISH','FAILED')
        AND subtask_name IS NOT NULL AND subtask_name != ''
      GROUP BY subtask_name, gcode_state ORDER BY ended_at DESC LIMIT 20
    `);
    return NextResponse.json(tr);
  }

  return NextResponse.json(enriched);
}
