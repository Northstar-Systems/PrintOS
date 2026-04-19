"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Link2, Camera } from "lucide-react";

export default function AddComparisonPage() {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-surface-raised">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Price Comparison
        </h2>
      </div>

      <div className="glass gradient-border rounded-2xl p-6 text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-purple/10 flex items-center justify-center">
          <Search className="h-8 w-8 text-purple" />
        </div>
        <div>
          <p className="text-sm font-semibold">Compare retail prices</p>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            Paste an Etsy or Amazon URL, or upload a screenshot of a product listing.
            AI will extract the price and update the comparison on your item in ERPNext.
          </p>
        </div>

        <div className="space-y-3">
          <div className="glass-raised rounded-xl p-3 flex items-center gap-3">
            <Link2 className="h-4 w-4 text-blue shrink-0" />
            <input
              type="url"
              placeholder="Paste Etsy or Amazon URL..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted/50"
            />
          </div>

          <div className="text-xs text-text-muted">or</div>

          <button className="w-full flex items-center justify-center gap-2 rounded-xl glass-raised px-5 py-3 text-sm font-bold text-text-secondary transition-all hover:text-text-primary">
            <Camera className="h-4 w-4" />
            Upload Screenshot
          </button>
        </div>

        <p className="text-[10px] text-text-muted/40">
          Coming soon — URL parsing and screenshot extraction
        </p>
      </div>
    </div>
  );
}
