"use client";

import { useEffect, useState } from "react";

export interface TelemetryFrame {
  time: string;
  nozzle_temp: number | null;
  bed_temp: number | null;
  chamber_temp: number | null;
  nozzle_target: number | null;
  bed_target: number | null;
  gcode_state: string | null;
  mc_percent: number | null;
  layer_num: number | null;
  total_layers: number | null;
  subtask_name: string | null;
  fan_speed: string | null;
  wifi_signal: string | null;
}

export function useTelemetry() {
  const [data, setData] = useState<TelemetryFrame | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es: EventSource;
    let retryTimeout: ReturnType<typeof setTimeout>;

    // Fetch latest immediately so the UI doesn't show "Connecting"
    fetch("/api/telemetry")
      .then((r) => r.json())
      .then((d) => { if (d) { setData(d); setConnected(true); } })
      .catch(() => {});

    const connect = () => {
      es = new EventSource("/api/telemetry?mode=stream");

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          setData(JSON.parse(event.data));
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        retryTimeout = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(retryTimeout);
    };
  }, []);

  return { data, connected };
}
