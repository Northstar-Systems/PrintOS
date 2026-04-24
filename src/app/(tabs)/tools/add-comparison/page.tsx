"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Link2,
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

interface CompetitorData {
  product_name: string;
  price: number;
  seller: string;
  source: string;
}

interface ProductItem {
  name: string;
  item_name: string;
  cost_to_print_usd: number;
}

type Step = "input" | "parsing" | "review" | "submitting" | "done" | "error";

export default function AddComparisonPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("input");
  const [url, setUrl] = useState("");
  const [data, setData] = useState<CompetitorData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [error, setError] = useState("");
  const [priceWarning, setPriceWarning] = useState(false);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts).catch(() => {});
  }, []);

  const handleUrlParse = async () => {
    if (!url.trim()) return;
    setStep("parsing");
    setError("");
    setPriceWarning(false);
    try {
      const resp = await fetch("/api/competitor/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const json = await resp.json();
      if (!resp.ok || json.error) {
        setError(json.error || "Parse failed");
        setStep("error");
        return;
      }
      setData(json.data);
      if (!json.data.price || json.data.price === 0) {
        setPriceWarning(true);
      }
      setStep("review");
    } catch {
      setError("Failed to parse URL");
      setStep("error");
    }
  };

  const handleScreenshot = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setStep("parsing");
    setError("");
    setPriceWarning(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/competitor/parse-image", {
        method: "POST",
        body: formData,
      });
      const json = await resp.json();
      if (!resp.ok || json.error) {
        setError(json.error || "Parse failed");
        setStep("error");
        return;
      }
      setData(json.data);
      setStep("review");
    } catch {
      setError("Failed to parse screenshot");
      setStep("error");
    }
  };

  const handleSubmit = async () => {
    if (!data || !selectedItem || data.price <= 0) return;
    setStep("submitting");
    try {
      const resp = await fetch("/api/competitor/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_code: selectedItem,
          competitor_name: data.seller,
          competitor_price: data.price,
          competitor_url: "",
          competitor_source: data.source,
        }),
      });
      const json = await resp.json();
      if (!resp.ok || json.error) {
        setError(json.error || "Submit failed");
        setStep("error");
        return;
      }
      setStep("done");
    } catch {
      setError("Failed to save");
      setStep("error");
    }
  };

  const selectedProduct = products.find((p) => p.name === selectedItem);
  const savings =
    selectedProduct && data && data.price > 0
      ? data.price - (selectedProduct.cost_to_print_usd || 0)
      : null;

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

      {step === "input" && (
        <div className="space-y-4">
          {/* URL Input */}
          <div className="glass gradient-border rounded-2xl p-5 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Paste a Product URL
            </div>
            <div className="glass-raised rounded-xl p-3 flex items-center gap-3">
              <Link2 className="h-4 w-4 text-blue shrink-0" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.amazon.com/..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted/50"
                onKeyDown={(e) => e.key === "Enter" && handleUrlParse()}
              />
            </div>
            <button
              onClick={handleUrlParse}
              disabled={!url.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-40"
            >
              Parse URL
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-bold">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Screenshot Upload */}
          <div className="glass gradient-border rounded-2xl p-5 space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Upload a Screenshot
            </div>
            <p className="text-xs text-text-muted">
              Screenshot the product page — AI will read the price directly from the image
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl glass-raised px-5 py-3 text-sm font-bold text-text-secondary transition-all hover:text-text-primary"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleScreenshot(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {step === "parsing" && (
        <div className="glass gradient-border rounded-2xl p-6 text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 text-purple animate-spin" />
          <p className="text-sm font-semibold">Extracting product details...</p>
          <p className="text-xs text-text-muted">This takes a few seconds</p>
        </div>
      )}

      {step === "review" && data && (
        <>
          <div className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Competitor Product
            </div>
            <div className="text-sm font-bold">{data.product_name}</div>
            <div className="mt-1 flex items-center gap-3 text-xs text-text-muted">
              <input
                value={data.seller}
                onChange={(e) => setData({ ...data, seller: e.target.value })}
                className="bg-transparent border-0 outline-none font-medium"
                placeholder="Seller name"
              />
              <span className="rounded-full bg-purple/10 px-2 py-0.5 text-[10px] font-semibold text-purple">
                {data.source}
              </span>
            </div>
            <div className="mt-3">
              <label className="text-xs text-text-muted mb-1 block">
                Retail Price
                {priceWarning && (
                  <span className="ml-2 text-amber">
                    <AlertTriangle className="inline h-3 w-3" /> Enter price manually
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2 glass-raised rounded-xl px-3 py-2">
                <DollarSign className="h-4 w-4 text-amber shrink-0" />
                <input
                  type="number"
                  step="0.01"
                  value={data.price || ""}
                  onChange={(e) =>
                    setData({ ...data, price: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  className="flex-1 text-xl font-extrabold tabular-nums bg-transparent border-0 outline-none placeholder:text-text-muted/30"
                  autoFocus={priceWarning}
                />
              </div>
            </div>
          </div>

          <div className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Link to Your Product
            </div>
            {products.length === 0 ? (
              <div className="py-6 text-center">
                <Search className="mx-auto h-6 w-6 text-text-muted/30" />
                <p className="mt-2 text-sm text-text-muted">No products yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedItem(p.name)}
                    className={`w-full text-left rounded-xl px-4 py-3 transition-all ${
                      selectedItem === p.name
                        ? "bg-purple/20 ring-1 ring-purple/30"
                        : "glass-raised hover:bg-surface-raised"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">{p.item_name}</div>
                        <div className="text-[11px] text-text-muted">{p.name}</div>
                      </div>
                      {p.cost_to_print_usd > 0 && (
                        <span className="text-xs font-bold tabular-nums text-green">
                          ${p.cost_to_print_usd.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {savings !== null && savings > 0 && (
            <div className="glass gradient-border glow-green rounded-2xl p-5 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-green mb-2">
                You Save
              </div>
              <div className="text-3xl font-extrabold text-green tabular-nums">
                ${savings.toFixed(2)}
              </div>
              <div className="mt-1 text-xs text-text-muted">
                {((savings / data.price) * 100).toFixed(0)}% cheaper to print vs $
                {data.price.toFixed(2)} retail
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("input"); setData(null); setSelectedItem(""); setPriceWarning(false);
              }}
              className="flex-1 rounded-xl glass-raised py-3 text-sm font-bold text-text-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedItem || !data.price || data.price <= 0}
              className="flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 py-3 text-sm font-bold text-white shadow-lg disabled:opacity-40"
            >
              Save Comparison
            </button>
          </div>
        </>
      )}

      {step === "submitting" && (
        <div className="glass gradient-border rounded-2xl p-6 text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 text-purple animate-spin" />
          <p className="text-sm font-semibold">Saving...</p>
        </div>
      )}

      {step === "done" && (
        <div className="glass gradient-border glow-green rounded-2xl p-6 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green" />
          <p className="text-sm font-bold text-green">Comparison Saved!</p>
          <p className="text-xs text-text-muted">
            {data?.seller} @ ${data?.price.toFixed(2)} linked to {selectedItem}
          </p>
          {savings !== null && savings > 0 && (
            <p className="text-sm font-bold text-green">You save ${savings.toFixed(2)} per unit</p>
          )}
          <button
            onClick={() => router.push("/tools")}
            className="mt-4 rounded-xl bg-blue/20 px-6 py-2 text-sm font-bold text-blue"
          >
            Back to Tools
          </button>
        </div>
      )}

      {step === "error" && (
        <div className="glass gradient-border glow-red rounded-2xl p-6 text-center space-y-4">
          <XCircle className="mx-auto h-10 w-10 text-red" />
          <p className="text-sm font-bold text-red">Error</p>
          <p className="text-xs text-text-muted">{error}</p>
          <button
            onClick={() => { setStep("input"); setError(""); }}
            className="mt-4 rounded-xl bg-blue/20 px-6 py-2 text-sm font-bold text-blue"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
