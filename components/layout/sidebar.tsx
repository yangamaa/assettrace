"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrainCircuit,
  LayoutDashboard,
  Package,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import type { SessionUser } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventario", label: "Inventário", icon: Package },
  {
    href: "/auditoria-preditiva",
    label: "AuditorIA Preditiva",
    icon: BrainCircuit,
    ai: true,
  },
];

type SidebarProps = {
  user: SessionUser;
  supabaseConnected: boolean;
  onNavigate?: () => void;
};

export function Sidebar({ user, supabaseConnected, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-col border-r border-[#1d2433] bg-[#0b0e14] px-4 py-5">
      <div className="flex items-center gap-3 px-1">
        <div className="flex size-10 items-center justify-center rounded-full bg-[#3b82f6] shadow-[0_0_18px_rgba(59,130,246,0.45)]">
          <Zap className="size-5 text-white" fill="currentColor" />
        </div>
        <div>
          <p className="text-[17px] font-semibold tracking-tight text-white">
            AssetTrace
          </p>
          <p className="text-[10px] font-medium tracking-[0.14em] text-[#7d8799]">
            CLOUD ITAM PARA PMES
          </p>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium",
          supabaseConnected
            ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
            : "border-amber-500/25 bg-amber-500/10 text-amber-300"
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full",
            supabaseConnected
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
              : "bg-amber-400"
          )}
        />
        {supabaseConnected ? "Supabase Cloud Connected" : "Persistência local ativa"}
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-[#122036] text-[#60a5fa]"
                  : "text-[#c5cedd] hover:bg-[#121826] hover:text-white"
              )}
            >
              <Icon className={cn("size-4", active ? "text-[#60a5fa]" : "text-[#8b95a8]")} />
              <span className="flex-1">{item.label}</span>
              {item.ai ? <Sparkles className="size-3.5 text-[#60a5fa]" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-xl border border-[#1d2433] bg-[#10151d] px-3 py-3">
        <div className="flex size-9 items-center justify-center rounded-full bg-[#1d4ed8] text-xs font-semibold text-white">
          {initials(user.full_name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
          <p className="text-xs text-[#8b95a8]">{user.role}</p>
        </div>
      </div>
    </aside>
  );
}
