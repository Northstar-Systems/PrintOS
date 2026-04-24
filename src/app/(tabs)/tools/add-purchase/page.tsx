"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";

interface ParsedItem {
  name: string;
  qty: number;
  unit_price: number;
  total: number;
  category: string;
}

interface ParsedData {
  vendor: string;
  date: string;
  order_id?: string;
  items: ParsedItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
}

type Step = "upload" | "parsing" | "review" | "submitting" | "done" | "error";

const COST_CENTERS = [
  { value: "3D Printing - NSS", label: "3D Printing" },
  { value: "LodestarOS - NSS", label: "LodestarOS" },
  { value: "Slowburn - NSS", label: "Slowburn" },
  { value: "Consulting - NSS", label: "Consulting" },
  { value: "General - NSS", label: "General" },
] as const;

export default function AddPurchasePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [data, setData] = useState<ParsedData | null>(null);
  const [costCenter, setCostCenter] = useState("General - NSS");
  const [error, setError] = useState("");
  const [result, setResult] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setStep("parsing");
    setError("");

    // Show preview
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch("/api/purchase/parse", {
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
    } catch (e) {
      setError("Failed to connect to parser");
      setStep("error");
    }
  };

  const handleSubmit = async () => {
    if (!data) return;
    setStep("submitting");

    try {
      const resp = await fetch("/api/purchase/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, cost_center: costCenter }),
      });
      const json = await resp.json();

      if (!resp.ok || json.error) {
        setError(json.error || "Submit failed");
        setStep("error");
        return;
      }

      setResult(json.results || []);
      setStep("done");
    } catch {
      setError("Failed to submit to ERPNext");
      setStep("error");
    }
  };

  const updateItem = (index: number, field: keyof ParsedItem, value: string | number) => {
    if (!data) return;
    const items = [...data.items];
    items[index] = { ...items[index], [field]: value };
    setData({ ...data, items });
  };

  const removeItem = (index: number) => {
    if (!data) return;
    const items = data.items.filter((_, i) => i !== index);
    setData({ ...data, items });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-lg hover:bg-surface-raised">
          <ArrowLeft className="h-5 w-5 text-text-secondary" />
        </button>
        <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Add Purchase
        </h2>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div className="glass gradient-border rounded-2xl p-6">
          <div className="text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-blue/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-blue" />
            </div>
            <div>
              <p className="text-sm font-semibold">Upload a receipt or invoice</p>
              <p className="mt-1 text-xs text-text-muted">
                Take a photo, upload a screenshot, or snap an Amazon order page
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-blue/20 px-5 py-3 text-sm font-bold text-blue transition-all hover:bg-blue/30"
              >
                <Camera className="h-4 w-4" />
                Camera
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 rounded-xl glass-raised px-5 py-3 text-sm font-bold text-text-secondary transition-all hover:text-text-primary"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>

            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </div>
      )}

      {/* Step: Parsing */}
      {step === "parsing" && (
        <div className="glass gradient-border rounded-2xl p-6">
          <div className="text-center space-y-4">
            {preview && (
              <img src={preview} alt="Receipt" className="mx-auto max-h-48 rounded-xl opacity-50" />
            )}
            <Loader2 className="mx-auto h-8 w-8 text-blue animate-spin" />
            <div>
              <p className="text-sm font-semibold">Parsing receipt...</p>
              <p className="mt-1 text-xs text-text-muted">
                AI is extracting line items and prices. This takes 15-30 seconds.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === "review" && data && (
        <>
          <div className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Vendor
            </div>
            <input
              value={data.vendor}
              onChange={(e) => setData({ ...data, vendor: e.target.value })}
              className="w-full rounded-xl glass-raised px-3 py-2 text-sm font-semibold bg-transparent border-0 outline-none focus:ring-1 focus:ring-blue"
            />
            <div className="mt-3 flex gap-4 text-xs text-text-muted">
              <span>Date: {data.date || "Unknown"}</span>
              {data.order_id && <span>Order: {data.order_id}</span>}
            </div>
          </div>

          <div className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Business Line
            </div>
            <div className="flex flex-wrap gap-2">
              {COST_CENTERS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setCostCenter(value)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    costCenter === value
                      ? "bg-blue/20 text-blue shadow-sm shadow-blue/10 ring-1 ring-blue/30"
                      : "glass-raised text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass gradient-border rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-3">
              Line Items
            </div>
            <div className="space-y-3">
              {data.items.map((item, i) => (
                <div key={i} className="glass-raised rounded-xl p-3">
                  <div className="flex items-start justify-between gap-2">
                    <input
                      value={item.name}
                      onChange={(e) => updateItem(i, "name", e.target.value)}
                      className="flex-1 text-sm font-semibold bg-transparent border-0 outline-none"
                    />
                    <button onClick={() => removeItem(i)} className="p-1 text-red/50 hover:text-red">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-text-muted">Qty</span>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                        className="w-12 text-xs text-center font-semibold tabular-nums bg-transparent border-0 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-text-muted">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)}
                        className="w-20 text-xs font-semibold tabular-nums bg-transparent border-0 outline-none"
                      />
                    </div>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(i, "category", e.target.value)}
                      className="text-[10px] bg-transparent text-text-muted border-0 outline-none"
                    >
                      <option value="filament">Filament</option>
                      <option value="hardware">Hardware</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 h-px bg-border" />
            <div className="mt-3 flex justify-between text-sm">
              <span className="text-text-muted">Total</span>
              <span className="font-bold tabular-nums">
                ${data.items.reduce((s, i) => s + i.qty * i.unit_price, 0).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep("upload"); setData(null); setPreview(null); }}
              className="flex-1 rounded-xl glass-raised py-3 text-sm font-bold text-text-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 py-3 text-sm font-bold text-white shadow-lg"
            >
              Confirm & Save to ERP
            </button>
          </div>
        </>
      )}

      {/* Step: Submitting */}
      {step === "submitting" && (
        <div className="glass gradient-border rounded-2xl p-6 text-center space-y-4">
          <Loader2 className="mx-auto h-8 w-8 text-green animate-spin" />
          <p className="text-sm font-semibold">Saving to ERPNext...</p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="glass gradient-border glow-green rounded-2xl p-6 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-green" />
          <p className="text-sm font-bold text-green">Purchase Saved!</p>
          <div className="space-y-1">
            {result.map((r, i) => (
              <p key={i} className="text-xs text-text-muted">{r}</p>
            ))}
          </div>
          <button
            onClick={() => router.push("/tools")}
            className="mt-4 rounded-xl bg-blue/20 px-6 py-2 text-sm font-bold text-blue"
          >
            Back to Money
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === "error" && (
        <div className="glass gradient-border glow-red rounded-2xl p-6 text-center space-y-4">
          <XCircle className="mx-auto h-10 w-10 text-red" />
          <p className="text-sm font-bold text-red">Error</p>
          <p className="text-xs text-text-muted">{error}</p>
          <button
            onClick={() => { setStep("upload"); setError(""); }}
            className="mt-4 rounded-xl bg-blue/20 px-6 py-2 text-sm font-bold text-blue"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
