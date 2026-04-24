"use client";

import { useState, useEffect } from "react";
import { X, Package, DollarSign, Layers, Clock, Printer, ExternalLink } from "lucide-react";

interface ItemData {
  name: string;
  item_name: string;
  item_group: string;
  description: string;
  standard_rate: number;
  stock_uom: string;
  cost_to_print_usd: number;
  bom_filament_grams: number;
  competitor_name: string;
  competitor_price: number;
  competitor_source: string;
  savings_per_unit_usd: number;
  savings_percent: number;
  gcode_filename: string;
  package_weight_grams: number;
  cost_per_gram: number;
}

interface ItemModalProps {
  itemCode: string | null;
  onClose: () => void;
}

export function ItemModal({ itemCode, onClose }: ItemModalProps) {
  const [item, setItem] = useState<ItemData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemCode) return;
    setLoading(true);
    fetch(`/api/item/${itemCode}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setItem(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [itemCode]);

  if (!itemCode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl glass border border-white/10 p-5 space-y-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-5 w-40 rounded bg-surface-raised animate-pulse" />
            ) : (
              <>
                <div className="text-base font-bold">{item?.item_name || itemCode}</div>
                <div className="text-[11px] text-text-muted font-mono mt-0.5">{itemCode}</div>
              </>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-raised">
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-text-muted">Loading...</div>
        ) : item ? (
          <>
            {/* Description */}
            {item.description && (
              <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>
            )}

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2">
              {item.cost_to_print_usd > 0 && (
                <div className="glass-raised rounded-xl p-3">
                  <DollarSign className="h-4 w-4 text-green" />
                  <div className="mt-1 text-[10px] text-text-muted">Cost to Print</div>
                  <div className="text-lg font-bold tabular-nums">${item.cost_to_print_usd.toFixed(2)}</div>
                </div>
              )}
              {item.competitor_price > 0 && (
                <div className="glass-raised rounded-xl p-3">
                  <Package className="h-4 w-4 text-purple" />
                  <div className="mt-1 text-[10px] text-text-muted">Retail Price</div>
                  <div className="text-lg font-bold tabular-nums">${item.competitor_price.toFixed(2)}</div>
                </div>
              )}
              {item.bom_filament_grams > 0 && (
                <div className="glass-raised rounded-xl p-3">
                  <Layers className="h-4 w-4 text-blue" />
                  <div className="mt-1 text-[10px] text-text-muted">Filament</div>
                  <div className="text-lg font-bold tabular-nums">{item.bom_filament_grams}g</div>
                </div>
              )}
              {item.savings_per_unit_usd > 0 && (
                <div className="glass-raised rounded-xl p-3">
                  <DollarSign className="h-4 w-4 text-green" />
                  <div className="mt-1 text-[10px] text-text-muted">You Save</div>
                  <div className="text-lg font-bold tabular-nums text-green">
                    ${item.savings_per_unit_usd.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-green">{item.savings_percent?.toFixed(0)}%</div>
                </div>
              )}
            </div>

            {/* Details list */}
            <div className="glass-raised rounded-xl p-4 space-y-2">
              {[
                { label: "Item Group", value: item.item_group },
                { label: "UOM", value: item.stock_uom },
                ...(item.gcode_filename ? [{ label: "G-code File", value: item.gcode_filename }] : []),
                ...(item.competitor_name ? [{ label: "Competitor", value: `${item.competitor_name} (${item.competitor_source})` }] : []),
                ...(item.package_weight_grams ? [{ label: "Package Weight", value: `${item.package_weight_grams}g` }] : []),
                ...(item.cost_per_gram ? [{ label: "Cost per Gram", value: `$${item.cost_per_gram.toFixed(4)}/g` }] : []),
                ...(item.standard_rate ? [{ label: "Standard Rate", value: `$${item.standard_rate.toFixed(2)}` }] : []),
              ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-text-muted">{row.label}</span>
                    <span className="text-xs font-semibold truncate ml-2 max-w-[200px]">{row.value}</span>
                  </div>
                ))}
            </div>

            {/* Open in ERPNext */}
            <a
              href={`https://erp.northstarsystems.duckdns.org/app/item/${itemCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl glass-raised py-2.5 text-xs font-bold text-blue hover:bg-blue/10 transition-all"
            >
              Open in ERPNext <ExternalLink className="h-3 w-3" />
            </a>
          </>
        ) : (
          <div className="py-8 text-center text-sm text-text-muted">Item not found</div>
        )}
      </div>
    </div>
  );
}
