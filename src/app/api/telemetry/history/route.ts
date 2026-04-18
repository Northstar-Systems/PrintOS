import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const minutes = parseInt(url.searchParams.get("minutes") ?? "30");

  // Downsample for larger time ranges to keep response size reasonable
  // <= 1h: every row (~10s intervals)
  // <= 6h: 1-minute averages
  // <= 24h: 5-minute averages
  // > 24h: 15-minute averages
  let query: string;

  if (minutes <= 60) {
    query = `
      SELECT time,
             nozzle_temp::float AS nozzle,
             bed_temp::float AS bed,
             chamber_temp::float AS chamber
      FROM telemetry
      WHERE time >= NOW() - $1::interval
      ORDER BY time ASC`;
  } else {
    const bucket = minutes <= 360 ? "1 minute" : minutes <= 1440 ? "5 minutes" : "15 minutes";
    query = `
      SELECT time_bucket('${bucket}', time) AS time,
             AVG(nozzle_temp::float) AS nozzle,
             AVG(bed_temp::float) AS bed,
             AVG(chamber_temp::float) AS chamber
      FROM telemetry
      WHERE time >= NOW() - $1::interval
      GROUP BY time_bucket('${bucket}', time)
      ORDER BY time ASC`;
  }

  const { rows } = await pool.query(query, [`${minutes} minutes`]);

  return NextResponse.json(rows);
}
