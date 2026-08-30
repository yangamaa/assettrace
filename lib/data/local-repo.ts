import { MOVEMENT_LABELS } from "@/lib/constants";
import { analyzeAssets, summarizeAlerts } from "@/lib/audit/engine";
import { withLocalStore } from "@/lib/data/local-store";
import type {
  Asset,
  AssetFilters,
  AssetMovementWithDetails,
  AssetWithAssignee,
  AuditRun,
  DashboardMetrics,
  MaintenanceAlertWithAsset,
  Profile,
  SessionUser,
} from "@/lib/types";
import type { AssetFormValues } from "@/lib/validations/asset";
import type { MovementType } from "@/lib/types";

function profileName(profiles: Profile[], id: string | null): string | null {
  if (!id) return null;
  return profiles.find((profile) => profile.id === id)?.full_name ?? null;
}

function withAssignee(asset: Asset, profiles: Profile[]): AssetWithAssignee {
  return {
    ...asset,
    assignee_name: profileName(profiles, asset.assigned_to),
  };
}

function matchesFilters(asset: AssetWithAssignee, filters: AssetFilters): boolean {
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = [
      asset.model,
      asset.serial_number,
      asset.assignee_name ?? "",
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.category && filters.category !== "all" && asset.category !== filters.category) {
    return false;
  }
  if (filters.status && filters.status !== "all" && asset.status !== filters.status) {
    return false;
  }
  return true;
}

function movementDescription(
  type: MovementType,
  relatedName: string | null
): string {
  const label = MOVEMENT_LABELS[type];
  if (type === "entrada") return `${label} · —`;
  return `${label} · ${relatedName ?? "—"}`;
}

function assertAssignable(current: Asset | null, next: AssetFormValues) {
  const assigned = next.assigned_to ?? null;
  if (next.status === "em_manutencao" && assigned && current && current.assigned_to !== assigned) {
    throw new Error("Equipamentos em manutenção não podem ser atribuídos.");
  }
  if (next.status === "baixado" && assigned) {
    throw new Error("Equipamentos baixados não podem ser atribuídos.");
  }
}

function detectMovement(
  current: Asset | null,
  next: Pick<Asset, "status" | "assigned_to">,
  relatedName: string | null
): { type: MovementType; description: string } | null {
  if (!current) {
    if (next.status === "disponivel" || !next.assigned_to) {
      return { type: "entrada", description: movementDescription("entrada", null) };
    }
    return {
      type: "atribuicao",
      description: movementDescription("atribuicao", relatedName),
    };
  }

  if (current.status !== next.status && next.status === "em_manutencao") {
    return {
      type: "manutencao",
      description: movementDescription("manutencao", relatedName),
    };
  }
  if (current.status !== next.status && next.status === "baixado") {
    return { type: "baixa", description: movementDescription("baixa", relatedName) };
  }
  if (current.assigned_to !== next.assigned_to && next.assigned_to) {
    return {
      type: "atribuicao",
      description: movementDescription("atribuicao", relatedName),
    };
  }
  if (current.assigned_to && !next.assigned_to && next.status === "disponivel") {
    return {
      type: "devolucao",
      description: movementDescription("devolucao", relatedName),
    };
  }
  if (current.status !== next.status || current.assigned_to !== next.assigned_to) {
    return {
      type: "atualizacao",
      description: movementDescription("atualizacao", relatedName),
    };
  }
  return null;
}

export const localRepository = {
  async getSessionUser(userId: string): Promise<SessionUser | null> {
    return withLocalStore((store) => {
      const profile = store.profiles.find((item) => item.id === userId);
      if (!profile) return null;
      return {
        id: profile.id,
        company_id: profile.company_id,
        full_name: profile.full_name,
        role: profile.role,
        email: profile.email,
      };
    });
  },

  async listProfiles(companyId: string): Promise<Profile[]> {
    return withLocalStore((store) =>
      store.profiles
        .filter((profile) => profile.company_id === companyId)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"))
    );
  },

  async listAssets(companyId: string, filters: AssetFilters = {}): Promise<AssetWithAssignee[]> {
    return withLocalStore((store) =>
      store.assets
        .filter((asset) => asset.company_id === companyId)
        .map((asset) => withAssignee(asset, store.profiles))
        .filter((asset) => matchesFilters(asset, filters))
        .sort((a, b) => a.model.localeCompare(b.model, "pt-BR"))
    );
  },

  async getAsset(companyId: string, assetId: string): Promise<AssetWithAssignee | null> {
    return withLocalStore((store) => {
      const asset = store.assets.find(
        (item) => item.id === assetId && item.company_id === companyId
      );
      return asset ? withAssignee(asset, store.profiles) : null;
    });
  },

  async dashboardMetrics(companyId: string): Promise<DashboardMetrics> {
    return withLocalStore((store) => {
      const assets = store.assets.filter((asset) => asset.company_id === companyId);
      const active = assets.filter((asset) => asset.status !== "baixado");
      return {
        totalValue: active.reduce((sum, asset) => sum + asset.purchase_value, 0),
        totalAssets: active.length,
        inUse: active.filter((asset) => asset.status === "em_uso").length,
        available: active.filter((asset) => asset.status === "disponivel").length,
        maintenance: active.filter((asset) => asset.status === "em_manutencao").length,
        retired: assets.filter((asset) => asset.status === "baixado").length,
      };
    });
  },

  async listMovements(companyId: string, limit = 8): Promise<AssetMovementWithDetails[]> {
    return withLocalStore((store) =>
      store.asset_movements
        .filter((movement) => movement.company_id === companyId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit)
        .map((movement) => {
          const asset = store.assets.find((item) => item.id === movement.asset_id);
          return {
            ...movement,
            asset_model: asset?.model ?? "Equipamento",
            related_user_name: profileName(store.profiles, movement.related_user_id),
          };
        })
    );
  },

  async createAsset(companyId: string, actorId: string, values: AssetFormValues) {
    return withLocalStore((store) => {
      const duplicate = store.assets.some(
        (asset) =>
          asset.company_id === companyId &&
          asset.serial_number.toLowerCase() === values.serial_number.toLowerCase()
      );
      if (duplicate) {
        throw new Error("Número de série já cadastrado nesta empresa.");
      }

      assertAssignable(null, values);

      const now = new Date().toISOString();
      const asset: Asset = {
        id: crypto.randomUUID(),
        company_id: companyId,
        model: values.model,
        serial_number: values.serial_number,
        category: values.category,
        assigned_to: values.assigned_to ?? null,
        purchase_value: values.purchase_value,
        purchase_date: values.purchase_date,
        status: values.status,
        created_at: now,
        updated_at: now,
      };

      store.assets.push(asset);

      const relatedName = profileName(store.profiles, asset.assigned_to);
      const movement = detectMovement(null, asset, relatedName);
      if (movement) {
        store.asset_movements.push({
          id: crypto.randomUUID(),
          company_id: companyId,
          asset_id: asset.id,
          type: movement.type,
          description: movement.description,
          actor_id: actorId,
          related_user_id: asset.assigned_to,
          created_at: now,
        });
      }

      return withAssignee(asset, store.profiles);
    }, { mutate: true });
  },

  async updateAsset(
    companyId: string,
    actorId: string,
    assetId: string,
    values: AssetFormValues
  ) {
    return withLocalStore((store) => {
      const index = store.assets.findIndex(
        (asset) => asset.id === assetId && asset.company_id === companyId
      );
      if (index < 0) throw new Error("Equipamento não encontrado.");

      const current = store.assets[index];
      const duplicate = store.assets.some(
        (asset) =>
          asset.id !== assetId &&
          asset.company_id === companyId &&
          asset.serial_number.toLowerCase() === values.serial_number.toLowerCase()
      );
      if (duplicate) {
        throw new Error("Número de série já cadastrado nesta empresa.");
      }

      assertAssignable(current, values);

      const next: Asset = {
        ...current,
        model: values.model,
        serial_number: values.serial_number,
        category: values.category,
        assigned_to: values.assigned_to ?? null,
        purchase_value: values.purchase_value,
        purchase_date: values.purchase_date,
        status: values.status,
        updated_at: new Date().toISOString(),
      };

      const relatedName = profileName(store.profiles, next.assigned_to);
      const movement = detectMovement(current, next, relatedName);
      store.assets[index] = next;

      if (movement) {
        store.asset_movements.push({
          id: crypto.randomUUID(),
          company_id: companyId,
          asset_id: assetId,
          type: movement.type,
          description: movement.description,
          actor_id: actorId,
          related_user_id: next.assigned_to,
          created_at: nowIsoSafe(),
        });
      }

      return withAssignee(next, store.profiles);
    }, { mutate: true });
  },

  async listAlerts(companyId: string): Promise<MaintenanceAlertWithAsset[]> {
    return withLocalStore((store) => {
      const latestRun = store.audit_runs
        .filter((run) => run.company_id === companyId && run.status === "completed")
        .sort((a, b) => b.started_at.localeCompare(a.started_at))[0];

      return store.maintenance_alerts
        .filter(
          (alert) =>
            alert.company_id === companyId &&
            (!latestRun || alert.audit_run_id === latestRun.id)
        )
        .map((alert) => {
          const asset = store.assets.find((item) => item.id === alert.asset_id);
          return {
            ...alert,
            asset_model: asset?.model ?? "Equipamento",
            serial_number: asset?.serial_number ?? "—",
          };
        })
        .sort((a, b) => b.usage_months - a.usage_months);
    });
  },

  async latestAuditRun(companyId: string): Promise<AuditRun | null> {
    return withLocalStore(
      (store) =>
        store.audit_runs
          .filter((run) => run.company_id === companyId)
          .sort((a, b) => b.started_at.localeCompare(a.started_at))[0] ?? null
    );
  },

  async runAudit(companyId: string, actorId: string): Promise<{
    run: AuditRun;
    alerts: MaintenanceAlertWithAsset[];
  }> {
    return withLocalStore((store) => {
      const started = new Date().toISOString();
      const runId = crypto.randomUUID();
      const assets = store.assets.filter((asset) => asset.company_id === companyId);
      const movements = store.asset_movements.filter(
        (movement) => movement.company_id === companyId
      );
      const generated = analyzeAssets(assets, movements);
      const completed = new Date().toISOString();

      const run: AuditRun = {
        id: runId,
        company_id: companyId,
        triggered_by: actorId,
        status: "completed",
        assets_analyzed: assets.filter((asset) => asset.status !== "baixado").length,
        alerts_generated: generated.length,
        summary: summarizeAlerts(
          generated,
          assets.filter((asset) => asset.status !== "baixado").length
        ),
        started_at: started,
        completed_at: completed,
      };

      store.audit_runs.push(run);
      store.maintenance_alerts = store.maintenance_alerts.filter(
        (alert) => alert.company_id !== companyId
      );
      const alerts = generated.map((item) => ({
        id: crypto.randomUUID(),
        company_id: companyId,
        audit_run_id: runId,
        created_at: completed,
        ...item,
      }));
      store.maintenance_alerts.push(...alerts);

      return {
        run,
        alerts: alerts.map((alert) => {
          const asset = store.assets.find((item) => item.id === alert.asset_id);
          return {
            ...alert,
            asset_model: asset?.model ?? "Equipamento",
            serial_number: asset?.serial_number ?? "—",
          };
        }),
      };
    }, { mutate: true });
  },
};

function nowIsoSafe() {
  return new Date().toISOString();
}
