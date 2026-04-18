"use client";

import Image from "next/image";
import { useTelemetry } from "@/lib/use-telemetry";

export function Header() {
  const { data, connected } = useTelemetry();
  const state = data?.gcode_state;
  const dotColor =
    state === "RUNNING" ? "bg-amber" :
    state === "FINISH" ? "bg-green" :
    state === "FAILED" ? "bg-red" :
    connected ? "bg-green" : "bg-text-muted";
  const dotPulse = state === "RUNNING" ? "animate-pulse" : "";

  return (
    <header className="glass-header sticky top-0 z-40 flex h-12 items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="printOS" width={28} height={28} className="rounded-md" />
        <span className="text-sm font-bold tracking-tight">
          print<span className="text-blue">OS</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${dotColor} ${dotPulse}`} />
        <span className="text-xs text-text-secondary font-medium">P1S</span>
      </div>
    </header>
  );
}
