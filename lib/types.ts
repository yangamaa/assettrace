export const ASSET_STATUSES = [
  "em_uso",
  "disponivel",
  "em_manutencao",
  "baixado",
] as const;

export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const ASSET_CATEGORIES = [
  "Notebook",
  "Monitor",
  "Celular",
  "Tablet",
  "Desktop",
  "Servidor",
  "Rede",
  "Acessório",
] as const;

export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const MOVEMENT_TYPES = [
  "entrada",
  "atribuicao",
  "devolucao",
  "manutencao",
  "baixa",
  "atualizacao",
] as const;

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const ALERT_PRIORITIES = ["baixa", "media", "alta", "critica"] as const;

export type AlertPriority = (typeof ALERT_PRIORITIES)[number];

export const PROFILE_ROLES = [
  "Administradora",
  "Administrador",
  "Analista",
  "Técnico",
  "Colaborador",
] as const;

export type ProfileRole = (typeof PROFILE_ROLES)[number];

export type Company = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Profile = {
  id: string;
  company_id: string;
  full_name: string;
  role: string;
  email: string;
  created_at: string;
};

export type Asset = {
  id: string;
  company_id: string;
  model: string;
  serial_number: string;
  category: AssetCategory;
  assigned_to: string | null;
  purchase_value: number;
  purchase_date: string;
  status: AssetStatus;
  created_at: string;
  updated_at: string;
};

export type AssetWithAssignee = Asset & {
  assignee_name: string | null;
};

export type AssetMovement = {
  id: string;
  company_id: string;
  asset_id: string;
  type: MovementType;
  description: string;
  actor_id: string | null;
  related_user_id: string | null;
  created_at: string;
};

export type AssetMovementWithDetails = AssetMovement & {
  asset_model: string;
  related_user_name: string | null;
};

export type AuditRun = {
  id: string;
  company_id: string;
  triggered_by: string | null;
  status: "running" | "completed" | "failed";
  assets_analyzed: number;
  alerts_generated: number;
  summary: string | null;
  started_at: string;
  completed_at: string | null;
};

export type MaintenanceAlert = {
  id: string;
  company_id: string;
  asset_id: string;
  audit_run_id: string;
  recommendation: string;
  priority: AlertPriority;
  usage_months: number;
  created_at: string;
};

export type MaintenanceAlertWithAsset = MaintenanceAlert & {
  asset_model: string;
  serial_number: string;
};

export type SessionUser = {
  id: string;
  company_id: string;
  full_name: string;
  role: string;
  email: string;
};

export type DashboardMetrics = {
  totalValue: number;
  totalAssets: number;
  inUse: number;
  available: number;
  maintenance: number;
  retired: number;
};

export type AssetFilters = {
  search?: string;
  category?: AssetCategory | "all";
  status?: AssetStatus | "all";
};
