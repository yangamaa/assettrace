"use client";

import { useState } from "react";
import { BrainCircuit, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { runPredictiveAuditAction } from "@/app/actions/audit";
import { MaintenanceAlertCard } from "@/components/audit/maintenance-alert-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditRun, MaintenanceAlertWithAsset } from "@/lib/types";

type AuditPanelProps = {
  initialAlerts: MaintenanceAlertWithAsset[];
  latestRun: AuditRun | null;
};

export function AuditPanel({ initialAlerts, latestRun }: AuditPanelProps) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [run, setRun] = useState(latestRun);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    latestRun?.status === "completed" ? "done" : "idle"
  );

  async function execute() {
    setStatus("loading");
    const result = await runPredictiveAuditAction();
    if (!result.ok) {
      setStatus("error");
      toast.error(result.message);
      return;
    }
    setAlerts(result.alerts ?? []);
    setRun(result.run ?? null);
    setStatus("done");
    toast.success("AuditorIA Preditiva concluída.");
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold tracking-[0.18em] text-[#60a5fa]">
          INTELIGÊNCIA OPERACIONAL
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-white">AuditorIA Preditiva</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#8b95a8]">
          Antecipe falhas, reduza paradas e decida quando substituir cada equipamento.
        </p>
      </div>

      <section className="flex flex-col gap-5 rounded-xl border border-[#1d2433] bg-[#10151d] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8]">
            <BrainCircuit className="size-6 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">Análise inteligente de ativos</h3>
              <Badge className="rounded-full bg-[#1d4ed8] text-[10px] text-white">BETA</Badge>
            </div>
            <p className="mt-1 max-w-xl text-sm text-[#8b95a8]">
              Nossa IA analisa idade, histórico de uso e categoria dos equipamentos para
              identificar riscos e recomendar ações preventivas.
            </p>
            {status === "loading" ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-[#60a5fa]">
                <Loader2 className="size-3.5 animate-spin" />
                Analisando idade, manutenção, categoria e status...
              </p>
            ) : null}
            {status === "done" && run ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                {run.summary}
              </p>
            ) : null}
            {status === "error" ? (
              <p className="mt-2 text-xs text-red-400">
                Não foi possível concluir a análise. Tente novamente.
              </p>
            ) : null}
          </div>
        </div>
        <Button
          onClick={execute}
          disabled={status === "loading"}
          className="h-11 shrink-0 gap-2 bg-[#3b82f6] px-4 text-white hover:bg-[#2563eb]"
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Executar AuditorIA Preditiva
        </Button>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-white">Alertas de manutenção</h3>
        <p className="mt-1 text-sm text-[#8b95a8]">
          Equipamentos com mais de 24 meses de uso
        </p>
        {alerts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-[#1d2433] px-6 py-12 text-center">
            <p className="text-sm font-medium text-white">Nenhum alerta gerado ainda</p>
            <p className="mt-1 text-sm text-[#8b95a8]">
              Execute a AuditorIA Preditiva para identificar riscos e recomendações.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {alerts.map((alert) => (
              <MaintenanceAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
