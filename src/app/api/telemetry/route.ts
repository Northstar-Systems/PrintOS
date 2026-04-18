import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  // SSE stream for real-time updates
  if (mode === "stream") {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: unknown) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        };

        const poll = async () => {
          try {
            const { rows } = await pool.query(
              `SELECT time, nozzle_temp, bed_temp, chamber_temp,
                      nozzle_target, bed_target, gcode_state,
                      mc_percent, layer_num, total_layers,
                      subtask_name, fan_speed, wifi_signal
               FROM telemetry ORDER BY time DESC LIMIT 1`
            );
            if (rows[0]) send(rows[0]);
          } catch {
            send({ error: "db_error" });
          }
        };

        // Send immediately, then every 5 seconds
        await poll();
        const interval = setInterval(poll, 5000);

        request.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Default: return latest telemetry as JSON
  const { rows } = await pool.query(
    `SELECT time, nozzle_temp, bed_temp, chamber_temp,
            nozzle_target, bed_target, gcode_state,
            mc_percent, layer_num, total_layers,
            subtask_name, fan_speed, wifi_signal
     FROM telemetry ORDER BY time DESC LIMIT 1`
  );

  return NextResponse.json(rows[0] ?? null);
}
