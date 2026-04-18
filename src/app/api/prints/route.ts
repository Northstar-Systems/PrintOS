import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Detect print jobs by grouping terminal states (FINISH/FAILED) per subtask_name.
  // Each distinct subtask_name that reached FINISH or FAILED counts as one print.
  const { rows } = await pool.query(`
    SELECT
      MAX(time) AS ended_at,
      gcode_state AS status,
      subtask_name AS job_name,
      MAX(layer_num) AS layer_num,
      MAX(total_layers) AS total_layers
    FROM telemetry
    WHERE gcode_state IN ('FINISH', 'FAILED')
      AND subtask_name IS NOT NULL
      AND subtask_name != ''
    GROUP BY subtask_name, gcode_state
    ORDER BY ended_at DESC
    LIMIT 20
  `);

  return NextResponse.json(rows);
}
