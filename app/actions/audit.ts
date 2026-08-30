"use server";

import { revalidatePath } from "next/cache";
import { dataRepository, requireUser } from "@/lib/data/repository";
import type { AuditRun, MaintenanceAlertWithAsset } from "@/lib/types";

export async function runPredictiveAuditAction(): Promise<{
  ok: boolean;
  message: string;
  run?: AuditRun;
  alerts?: MaintenanceAlertWithAsset[];
}> {
  try {
    const user = await requireUser();
    const result = await dataRepository().runAudit(user.company_id, user.id);
    revalidatePath("/auditoria-preditiva");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: result.run.summary ?? "Auditoria concluída.",
      run: result.run,
      alerts: result.alerts,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Falha ao executar a auditoria.",
    };
  }
}
