"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Printer, Wrench, DollarSign, Settings } from "lucide-react";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/print", label: "Print", icon: Printer },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/money", label: "Money", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-nav fixed bottom-0 left-0 right-0 z-50 h-16 pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-full items-center justify-around">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-1 min-w-[64px] transition-all"
            >
              {active && (
                <div className="absolute -top-px left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-gradient-to-r from-blue to-cyan animate-fade-in" />
              )}
              <div className={`p-1.5 rounded-lg transition-all ${
                active ? "bg-blue/10" : ""
              }`}>
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-blue" : "text-text-muted"
                  }`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
              </div>
              <span className={`text-[10px] font-semibold tracking-wide transition-colors ${
                active ? "text-blue" : "text-text-muted"
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
