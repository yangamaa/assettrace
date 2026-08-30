import type {
  AlertPriority,
  Asset,
  AssetCategory,
  AssetMovement,
  MaintenanceAlert,
} from "@/lib/types";
import { monthsBetween } from "@/lib/format";

export type GeneratedAlert = Omit<
  MaintenanceAlert,
  "id" | "company_id" | "audit_run_id" | "created_at"
>;

const RECOMMENDATIONS: Record<AssetCategory, string[]> = {
  Notebook: [
    "Recomenda-se troca preventiva de pasta térmica e upgrade de RAM.",
    "Avaliar bateria e considerar substituição do equipamento no próximo ciclo.",
    "Verificar SSD, atualizar firmware e revisar política de troca.",
  ],
  Monitor: [
    "Inspecionar painel, cabos DisplayPort/HDMI e fonte de alimentação.",
    "Calibrar cores e validar horas de uso antes da próxima janela de compra.",
  ],
  Celular: [
    "Verificar saúde da bateria e aplicar atualização de sistema.",
    "Confirmar MDM, backup e ciclo de substituição do aparelho.",
  ],
  Tablet: [
    "Revisar bateria, capa protetora e política de atualização do SO.",
    "Validar acessórios e ciclo de vida antes da renovação.",
  ],
  Desktop: [
    "Limpar gabinete, testar fonte e atualizar firmware da placa-mãe.",
    "Avaliar upgrade de armazenamento e plano de substituição.",
  ],
  Servidor: [
    "Revisar RAID, fonte redundante e janela de firmware do fabricante.",
    "Planejar substituição preventiva para reduzir risco de parada.",
  ],
  Rede: [
    "Atualizar firmware e validar portas, PoE e redundância.",
    "Agendar revisão de configuração e troca de SFP se houver erros.",
  ],
  Acessório: [
    "Verificar portas USB-C e atualizar firmware na próxima janela.",
    "Testar conectores, cabos e substituir se houver folga ou falha intermitente.",
  ],
};

function pickRecommendation(
  category: AssetCategory,
  months: number,
  maintenanceCount: number
): string {
  const options = RECOMMENDATIONS[category];
  if (maintenanceCount > 0 || months >= 48) return options[0];
  if (options[1]) return options[1];
  return options[0];
}

export function scorePriority(
  asset: Asset,
  months: number,
  maintenanceCount: number
): AlertPriority {
  let score = 0;

  if (months >= 60) score += 4;
  else if (months >= 48) score += 3;
  else if (months >= 36) score += 2;
  else score += 1;

  if (asset.status === "em_manutencao") score += 2;
  if (maintenanceCount >= 2) score += 2;
  else if (maintenanceCount >= 1) score += 1;

  if (asset.category === "Notebook" || asset.category === "Servidor") score += 1;
  if (asset.category === "Acessório") score -= 1;

  if (score >= 7) return "critica";
  if (score >= 5) return "alta";
  if (score >= 3) return "media";
  return "baixa";
}

export function analyzeAssets(
  assets: Asset[],
  movements: AssetMovement[],
  now = new Date()
): GeneratedAlert[] {
  return assets
    .filter((asset) => asset.status !== "baixado")
    .map((asset) => {
      const months = monthsBetween(asset.purchase_date, now);
      const maintenanceCount = movements.filter(
        (movement) =>
          movement.asset_id === asset.id && movement.type === "manutencao"
      ).length;

      if (months < 24 && asset.status !== "em_manutencao") {
        return null;
      }

      if (months < 24 && asset.status === "em_manutencao" && maintenanceCount === 0) {
        return null;
      }

      return {
        asset_id: asset.id,
        recommendation: pickRecommendation(asset.category, months, maintenanceCount),
        priority: scorePriority(asset, months, maintenanceCount),
        usage_months: months,
      } satisfies GeneratedAlert;
    })
    .filter((alert): alert is GeneratedAlert => alert !== null)
    .sort((a, b) => {
      const order: Record<AlertPriority, number> = {
        critica: 0,
        alta: 1,
        media: 2,
        baixa: 3,
      };
      return order[a.priority] - order[b.priority] || b.usage_months - a.usage_months;
    });
}

export function summarizeAlerts(alerts: GeneratedAlert[], analyzed: number): string {
  const critica = alerts.filter((item) => item.priority === "critica").length;
  const alta = alerts.filter((item) => item.priority === "alta").length;
  return `${analyzed} ativos analisados, ${alerts.length} alertas gerados (${critica} críticos, ${alta} altos).`;
}
