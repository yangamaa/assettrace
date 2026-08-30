import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  label: string;
  icon: LucideIcon;
  iconClassName: string;
};

export function KpiCard({ title, value, label, icon: Icon, iconClassName }: KpiCardProps) {
  return (
    <article className="rounded-xl border border-[#1d2433] bg-[#10151d] p-4">
      <div className="flex items-start justify-between">
        <div className={cn("flex size-9 items-center justify-center rounded-lg", iconClassName)}>
          <Icon className="size-4" />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.14em] text-[#7d8799]">{label}</p>
      </div>
      <p className="mt-5 text-sm text-[#9aa3b5]">{title}</p>
      <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white tabular-nums">
        {value}
      </p>
    </article>
  );
}
