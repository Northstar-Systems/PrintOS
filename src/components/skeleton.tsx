export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function KpiSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface-raised p-4">
      <div className="skeleton h-3 w-20 mb-3" />
      <div className="skeleton h-8 w-24" />
    </div>
  );
}

export function PrintRowSkeleton() {
  return (
    <div className="glass-raised rounded-xl px-4 py-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-3">
        <div className="skeleton h-3 w-16" />
        <div className="skeleton h-3 w-12" />
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="glass gradient-border rounded-2xl p-5 space-y-3">
      <div className="skeleton h-3 w-24" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
