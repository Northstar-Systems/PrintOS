import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Use print_jobs table first (more accurate), fall back to telemetry
  const { rows: jobRows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'FINISH') AS total_prints,
      COUNT(*) FILTER (WHERE status = 'FAILED') AS failed_prints,
      COUNT(*) AS total_jobs,
      CASE
        WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE status = 'FINISH') * 100.0 / COUNT(*), 1)
        ELSE 0
      END AS success_rate,
      COALESCE(SUM(actual_seconds) FILTER (WHERE status = 'FINISH'), 0) / 3600.0 AS total_hours,
      COALESCE(SUM(total_cost) FILTER (WHERE status = 'FINISH'), 0) AS total_cost,
      COALESCE(SUM(filament_grams) FILTER (WHERE status = 'FINISH'), 0) AS total_filament_g,
      COALESCE(SUM(filament_cost) FILTER (WHERE status = 'FAILED'), 0) AS wasted_filament_cost,
      COALESCE(SUM(filament_grams) FILTER (WHERE status = 'FAILED'), 0) AS wasted_filament_g
    FROM print_jobs
  `);

  const kpi = jobRows[0];
  const hasPrintJobs = parseInt(kpi?.total_jobs) > 0;

  if (!hasPrintJobs) {
    // Fall back to telemetry-based KPIs
    const { rows } = await pool.query(`
      WITH prints AS (
        SELECT subtask_name, gcode_state
        FROM telemetry
        WHERE gcode_state IN ('FINISH', 'FAILED')
          AND subtask_name IS NOT NULL AND subtask_name != ''
        GROUP BY subtask_name, gcode_state
      )
      SELECT
        COUNT(*) FILTER (WHERE gcode_state = 'FINISH') AS total_prints,
        COUNT(*) FILTER (WHERE gcode_state = 'FAILED') AS failed_prints,
        CASE WHEN COUNT(*) > 0 THEN ROUND(COUNT(*) FILTER (WHERE gcode_state = 'FINISH') * 100.0 / COUNT(*), 1) ELSE 0 END AS success_rate
      FROM prints
    `);

    const { rows: hourRows } = await pool.query(`
      SELECT COALESCE(EXTRACT(EPOCH FROM SUM(CASE WHEN gcode_state = 'RUNNING' THEN INTERVAL '10 seconds' ELSE INTERVAL '0' END)) / 3600.0, 0)::float AS total_hours
      FROM telemetry WHERE gcode_state IS NOT NULL
    `);

    const fallback = rows[0] || {};
    return NextResponse.json({
      total_prints: parseInt(fallback.total_prints) || 0,
      failed_prints: parseInt(fallback.failed_prints) || 0,
      success_rate: parseFloat(fallback.success_rate) || 0,
      total_hours: parseFloat(hourRows[0]?.total_hours) || 0,
      total_cost: 0,
      total_filament_g: 0,
      wasted_filament_cost: 0,
      wasted_filament_g: 0,
    });
  }

  return NextResponse.json({
    total_prints: parseInt(kpi.total_prints) || 0,
    failed_prints: parseInt(kpi.failed_prints) || 0,
    success_rate: parseFloat(kpi.success_rate) || 0,
    total_hours: parseFloat(kpi.total_hours) || 0,
    total_cost: parseFloat(kpi.total_cost) || 0,
    total_filament_g: parseFloat(kpi.total_filament_g) || 0,
    wasted_filament_cost: parseFloat(kpi.wasted_filament_cost) || 0,
    wasted_filament_g: parseFloat(kpi.wasted_filament_g) || 0,
  });
}
