"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ItemModal } from "@/components/item-modal";
import {
  ArrowLeft, Package, Layers, DollarSign, ChevronRight, Sparkles,
} from "lucide-react";

interface BOMChild {
  item_code: string;
  item_name: string;
  qty: number;
  rate: number;
  amount: number;
  uom: string;
}

interface Product {
  name: string;
  item_name: string;
  cost_to_print_usd: number;
  competitor_price: number;
  competitor_name: string;
  savings_per_unit_usd: number;
  savings_percent: number;
  bom_filament_grams: number;
  gcode_filename: string;
  bom_name: string | null;
  bom_children: BOMChild[];
  child_product_codes: string[];
  is_assembly: boolean;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products/with-bom")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Separate parents from standalone items
  const assemblies = products.filter((p) => p.is_assembly);
  const standalone = products.filter((p) => !p.is_assembly && !assemblies.some((a) => a.child_product_codes.includes(p.name)));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-surface-raised">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Product Catalog
        </h2>
        <span className="text-xs text-text-muted ml-auto">{products.length} items</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse">
              <div className="h-4 w-40 rounded bg-surface-raised" />
              <div className="h-3 w-24 rounded bg-surface-raised mt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass gradient-border rounded-2xl p-8 text-center">
          <Package className="mx-auto h-8 w-8 text-text-muted/30" />
          <p className="mt-3 text-sm text-text-muted">No products yet</p>
          <p className="mt-1 text-xs text-text-muted/50">Products are auto-created when you print</p>
        </div>
      ) : (
        <>
          {/* Assemblies (parent products with children) */}
          {assemblies.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Assemblies
              </div>
              {assemblies.map((product) => (
                <div key={product.name} className="glass gradient-border rounded-2xl p-4">
                  <div
                    onClick={() => setSelectedItem(product.name)}
                    className="cursor-pointer active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold">{product.item_name}</div>
                        <div className="text-[11px] text-text-muted font-mono">{product.name}</div>
                      </div>
                      <div className="text-right">
                        {product.cost_to_print_usd > 0 && (
                          <div className="text-sm font-bold text-green tabular-nums">
                            ${product.cost_to_print_usd.toFixed(2)}
                          </div>
                        )}
                        {product.savings_per_unit_usd > 0 && (
                          <div className="text-[10px] text-green flex items-center gap-0.5 justify-end">
                            <Sparkles className="h-3 w-3" />
                            Save ${product.savings_per_unit_usd.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    {product.bom_filament_grams > 0 && (
                      <div className="mt-1 text-xs text-text-muted">
                        {product.bom_filament_grams}g total filament · {product.bom_children.length} parts
                      </div>
                    )}
                  </div>

                  {/* Children */}
                  <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-blue/20">
                    {product.bom_children.map((child) => (
                      <div
                        key={child.item_code}
                        onClick={() => setSelectedItem(child.item_code)}
                        className="flex items-center justify-between glass-raised rounded-lg px-3 py-2 cursor-pointer hover:bg-surface-raised active:scale-[0.99] transition-all"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{child.item_name}</div>
                          <div className="text-[10px] text-text-muted">
                            {child.qty}{child.uom === "g" ? "g" : "×"} @ ${child.rate.toFixed(child.uom === "g" ? 4 : 2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-semibold tabular-nums">${child.amount.toFixed(2)}</span>
                          <ChevronRight className="h-3 w-3 text-text-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standalone products */}
          {standalone.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {assemblies.length > 0 ? "Standalone Products" : "Products"}
              </div>
              {standalone.map((product) => (
                <div
                  key={product.name}
                  onClick={() => setSelectedItem(product.name)}
                  className="glass gradient-border rounded-2xl p-4 cursor-pointer active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold">{product.item_name}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-text-muted">
                        {product.bom_filament_grams > 0 && <span>{product.bom_filament_grams}g</span>}
                        {product.gcode_filename && <span className="truncate max-w-[150px]">{product.gcode_filename}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {product.cost_to_print_usd > 0 && (
                        <div className="text-sm font-bold text-green tabular-nums">${product.cost_to_print_usd.toFixed(2)}</div>
                      )}
                      {product.competitor_price > 0 && (
                        <div className="text-[10px] text-text-muted">vs ${product.competitor_price.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ItemModal itemCode={selectedItem} onClose={() => setSelectedItem(null)} />
    </div>
  );
}
