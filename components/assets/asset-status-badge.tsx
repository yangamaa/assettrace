import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AssetStatus } from "@/lib/types";

const STYLES: Record<AssetStatus, string> = {
  em_uso: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  disponivel: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  em_manutencao: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  baixado: "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
};

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-medium", STYLES[status])}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
