"use client";

import Link from "next/link";
import {
  Camera,
  Search,
  Package,
  FileText,
  ArrowRight,
  Boxes,
  BarChart3,
} from "lucide-react";

const tools = [
  {
    href: "/tools/add-purchase",
    icon: Camera,
    gradient: "from-emerald-500 to-green-700",
    title: "Scan Receipt",
    description: "Upload a receipt, invoice, or screenshot. AI extracts line items and creates purchase records in ERPNext.",
  },
  {
    href: "/tools/add-comparison",
    icon: Search,
    gradient: "from-violet-500 to-purple-700",
    title: "Price Comparison",
    description: "Paste a URL or screenshot of a retail product to update the comparison price on an item.",
  },
];

const quickLinks = [
  {
    href: "https://erp.northstarsystems.duckdns.org/app/item",
    icon: Package,
    label: "Items",
    description: "View & manage inventory",
  },
  {
    href: "https://erp.northstarsystems.duckdns.org/app/purchase-invoice",
    icon: FileText,
    label: "Purchases",
    description: "View purchase invoices",
  },
  {
    href: "https://erp.northstarsystems.duckdns.org/app/stock-balance",
    icon: Boxes,
    label: "Stock",
    description: "Check stock levels",
  },
  {
    href: "https://erp.northstarsystems.duckdns.org/app/query-report/General Ledger",
    icon: BarChart3,
    label: "Ledger",
    description: "View general ledger",
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xs font-bold uppercase tracking-widest text-text-muted">
        Tools
      </h2>

      {/* Action Cards */}
      {tools.map(({ href, icon: Icon, gradient, title, description }) => (
        <Link key={href} href={href}>
          <div className="glass gradient-border rounded-2xl p-5 transition-all hover:scale-[0.99] active:scale-[0.97]">
            <div className="flex items-start gap-4">
              <div className={`rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">{title}</span>
                  <ArrowRight className="h-4 w-4 text-text-muted" />
                </div>
                <p className="mt-1 text-xs text-text-muted leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}

      {/* Quick Links to ERPNext */}
      <div className="glass gradient-border rounded-2xl p-5">
        <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          ERPNext Quick Links
        </div>
        <div className="grid grid-cols-2 gap-2">
          {quickLinks.map(({ href, icon: Icon, label, description }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-raised rounded-xl p-3 transition-all hover:scale-[0.98] active:scale-[0.96]"
            >
              <Icon className="h-4 w-4 text-blue" />
              <div className="mt-2 text-xs font-bold">{label}</div>
              <div className="mt-0.5 text-[10px] text-text-muted">{description}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
