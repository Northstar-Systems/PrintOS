import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { rows } = await pool.query(
    `SELECT * FROM print_jobs WHERE id = $1`,
    [id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Print job not found" }, { status: 404 });
  }

  const job = rows[0];

  // Get temperature data for this job's time window
  let temps: Array<{ time: string; nozzle: number; bed: number; chamber: number }> = [];
  if (job.started_at && job.completed_at) {
    const { rows: tempRows } = await pool.query(
      `SELECT time_bucket('1 minute', time) AS time,
              AVG(nozzle_temp::float) AS nozzle,
              AVG(bed_temp::float) AS bed,
              AVG(chamber_temp::float) AS chamber
       FROM telemetry
       WHERE time >= $1 AND time <= $2
       GROUP BY time_bucket('1 minute', time)
       ORDER BY time ASC`,
      [job.started_at, job.completed_at]
    );
    temps = tempRows;
  }

  return NextResponse.json({ ...job, temperature_history: temps });
}
