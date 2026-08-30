import { AuditPanel } from "@/components/audit/audit-panel";
import { dataRepository, requireUser } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export default async function PredictiveAuditPage() {
  const user = await requireUser();
  const repo = dataRepository();
  const [alerts, latestRun] = await Promise.all([
    repo.listAlerts(user.company_id),
    repo.latestAuditRun(user.company_id),
  ]);

  return <AuditPanel initialAlerts={alerts} latestRun={latestRun} />;
}
