import { ArrowUp } from "lucide-react";
import { formatMovementTime } from "@/lib/format";
import type { AssetMovementWithDetails } from "@/lib/types";

export function MovementsList({ movements }: { movements: AssetMovementWithDetails[] }) {
  return (
    <article className="rounded-xl border border-[#1d2433] bg-[#10151d] p-5">
      <h2 className="text-base font-semibold text-white">Últimas Movimentações</h2>
      <p className="mt-1 text-sm text-[#8b95a8]">Atividade recente no inventário.</p>
      {movements.length === 0 ? (
        <p className="mt-8 text-sm text-[#8b95a8]">
          Nenhuma movimentação registrada ainda. Cadastre ou edite um equipamento.
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {movements.map((movement) => (
            <li key={movement.id} className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8]">
                <ArrowUp className="size-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{movement.asset_model}</p>
                <p className="text-xs text-[#8b95a8]">{movement.description}</p>
              </div>
              <p className="shrink-0 text-xs text-[#7d8799]">
                {formatMovementTime(movement.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
