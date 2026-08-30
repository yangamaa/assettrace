import { AlertTriangle, Wrench } from "lucide-react";
import { PRIORITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AlertPriority, MaintenanceAlertWithAsset } from "@/lib/types";

const ICON: Record<AlertPriority, { className: string; icon: typeof Wrench }> = {
  critica: { className: "bg-red-500/15 text-red-400", icon: AlertTriangle },
  alta: { className: "bg-orange-500/15 text-orange-400", icon: AlertTriangle },
  media: { className: "bg-amber-500/15 text-amber-400", icon: AlertTriangle },
  baixa: { className: "bg-sky-500/15 text-sky-300", icon: Wrench },
};

export function MaintenanceAlertCard({ alert }: { alert: MaintenanceAlertWithAsset }) {
  const visual = ICON[alert.priority];
  const Icon = visual.icon;

  return (
    <article className="rounded-xl border border-[#1d2433] bg-[#10151d] p-5">
      <div className="flex items-start gap-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", visual.className)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white">
            {alert.asset_model} — {alert.serial_number}
          </h3>
          <p className="mt-1 text-sm text-[#8b95a8]">{alert.recommendation}</p>
          <p className="mt-4 text-[11px] font-medium tracking-[0.12em] text-[#7d8799]">
            PRIORIDADE {PRIORITY_LABELS[alert.priority].toUpperCase()} • {alert.usage_months} MESES
          </p>
        </div>
      </div>
    </article>
  );
}
