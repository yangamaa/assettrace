import { Activity, CheckCircle2, PackagePlus, Wrench } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MovementsList } from "@/components/dashboard/movements-list";
import { StatusChart } from "@/components/dashboard/status-chart";
import { dataRepository, requireUser } from "@/lib/data/repository";
import { formatCurrency, percentOf } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const repo = dataRepository();
  const [metrics, movements] = await Promise.all([
    repo.dashboardMetrics(user.company_id),
    repo.listMovements(user.company_id, 6),
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total em Ativos"
          value={formatCurrency(metrics.totalValue)}
          label="PATRIMÔNIO"
          icon={Activity}
          iconClassName="bg-[#1d4ed8]/20 text-[#60a5fa]"
        />
        <KpiCard
          title="Equipamentos em Uso"
          value={String(metrics.inUse)}
          label={`${percentOf(metrics.inUse, metrics.totalAssets)} DO TOTAL`}
          icon={CheckCircle2}
          iconClassName="bg-emerald-500/15 text-emerald-400"
        />
        <KpiCard
          title="Disponíveis no Estoque"
          value={String(metrics.available)}
          label="PRONTOS PARA USO"
          icon={PackagePlus}
          iconClassName="bg-sky-500/15 text-sky-300"
        />
        <KpiCard
          title="Em Manutenção"
          value={String(metrics.maintenance)}
          label="ATENÇÃO NECESSÁRIA"
          icon={Wrench}
          iconClassName="bg-amber-500/15 text-amber-400"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StatusChart
          inUse={metrics.inUse}
          available={metrics.available}
          maintenance={metrics.maintenance}
          total={metrics.totalAssets}
        />
        <MovementsList movements={movements} />
      </section>
    </div>
  );
}
