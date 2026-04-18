import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Derive KPIs by counting distinct prints (grouped by subtask_name + terminal state)
  const { rows } = await pool.query(`
    WITH prints AS (
      SELECT
        subtask_name,
        gcode_state
      FROM telemetry
      WHERE gcode_state IN ('FINISH', 'FAILED')
        AND subtask_name IS NOT NULL
        AND subtask_name != ''
      GROUP BY subtask_name, gcode_state
    )
    SELECT
      COUNT(*) FILTER (WHERE gcode_state = 'FINISH') AS total_prints,
      COUNT(*) FILTER (WHERE gcode_state = 'FAILED') AS failed_prints,
      COUNT(*) AS total_jobs,
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE gcode_state = 'FINISH') * 100.0 / COUNT(*), 1)
        ELSE 0
      END AS success_rate
    FROM prints
  `);

  // Get total print hours from telemetry (time spent in RUNNING state)
  const { rows: hourRows } = await pool.query(`
    SELECT
      COALESCE(
        EXTRACT(EPOCH FROM SUM(
          CASE WHEN gcode_state = 'RUNNING' THEN INTERVAL '10 seconds' ELSE INTERVAL '0' END
        )) / 3600.0,
        0
      )::float AS total_hours
    FROM telemetry
    WHERE gcode_state IS NOT NULL
  `);

  const kpi = rows[0] || { total_prints: 0, failed_prints: 0, total_jobs: 0, success_rate: 0 };

  return NextResponse.json({
    total_prints: parseInt(kpi.total_prints) || 0,
    failed_prints: parseInt(kpi.failed_prints) || 0,
    success_rate: parseFloat(kpi.success_rate) || 0,
    total_hours: parseFloat(hourRows[0]?.total_hours) || 0,
  });
}
