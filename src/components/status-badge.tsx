import { CheckCircle2, XCircle, MinusCircle, Loader2, Circle } from "lucide-react";

type Status = "SUCCESS" | "FAILED" | "CANCELLED" | "PRINTING" | "IDLE" | "FINISH" | "RUNNING" | "PAUSE";

const config: Record<string, { bg: string; text: string; icon: typeof Circle }> = {
  SUCCESS:   { bg: "bg-green-muted", text: "text-green", icon: CheckCircle2 },
  FINISH:    { bg: "bg-green-muted", text: "text-green", icon: CheckCircle2 },
  FAILED:    { bg: "bg-red-muted", text: "text-red", icon: XCircle },
  CANCELLED: { bg: "bg-surface-raised", text: "text-text-muted", icon: MinusCircle },
  PRINTING:  { bg: "bg-amber-muted", text: "text-amber", icon: Loader2 },
  RUNNING:   { bg: "bg-amber-muted", text: "text-amber", icon: Loader2 },
  PAUSE:     { bg: "bg-amber-muted", text: "text-amber", icon: Circle },
  IDLE:      { bg: "bg-surface-raised", text: "text-text-secondary", icon: Circle },
};

export function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? "IDLE").toUpperCase();
  const c = config[s] || config.IDLE;
  const Icon = c.icon;
  const spinning = s === "RUNNING" || s === "PRINTING";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${c.bg} ${c.text}`}>
      <Icon className={`h-3 w-3 ${spinning ? "animate-spin" : ""}`} />
      {s === "FINISH" ? "SUCCESS" : s}
    </span>
  );
}
