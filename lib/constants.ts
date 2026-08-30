import { AlertPriority, AssetCategory, AssetStatus, MovementType } from "@/lib/types";

export const DEMO_COMPANY_ID = "11111111-1111-4111-8111-000000000001";
export const DEMO_USER_ID = "11111111-1111-4111-8111-000000000010";

export const SESSION_COOKIE = "assettrace_session";

export const STATUS_LABELS: Record<AssetStatus, string> = {
  em_uso: "Em Uso",
  disponivel: "Disponível",
  em_manutencao: "Em Manutenção",
  baixado: "Baixado",
};

export const PRIORITY_LABELS: Record<AlertPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  entrada: "Entrada no estoque",
  atribuicao: "Atribuído",
  devolucao: "Devolvido ao estoque",
  manutencao: "Enviado à manutenção",
  baixa: "Baixa patrimonial",
  atualizacao: "Atualização cadastral",
};

export const CATEGORY_OPTIONS: AssetCategory[] = [
  "Notebook",
  "Monitor",
  "Celular",
  "Tablet",
  "Desktop",
  "Servidor",
  "Rede",
  "Acessório",
];
