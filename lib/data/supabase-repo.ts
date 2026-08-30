import { MOVEMENT_LABELS } from "@/lib/constants";
import { analyzeAssets, summarizeAlerts } from "@/lib/audit/engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Asset,
  AssetFilters,
  AssetMovement,
  AssetMovementWithDetails,
  AssetWithAssignee,
  AuditRun,
  DashboardMetrics,
  MaintenanceAlert,
  MaintenanceAlertWithAsset,
  Profile,
  SessionUser,
} from "@/lib/types";
import type { AssetFormValues } from "@/lib/validations/asset";
import type { MovementType } from "@/lib/types";

type ProfileRow = Profile;
type AssetRow = Asset;
type MovementRow = AssetMovement;
type AlertRow = MaintenanceAlert;
type AuditRow = AuditRun;

function scopedError(message: string): never {
  throw new Error(message);
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function movementDescription(type: MovementType, relatedName: string | null) {
  const label = MOVEMENT_LABELS[type];
  if (type === "entrada") return `${label} · —`;
  return `${label} · ${relatedName ?? "—"}`;
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

function assertAssignable(current: Asset | null, next: AssetFormValues) {
  const assigned = next.assigned_to ?? null;
  if (next.status === "em_manutencao" && assigned && current && current.assigned_to !== assigned) {
    throw new Error("Equipamentos em manutenção não podem ser atribuídos.");
  }
  if (next.status === "baixado" && assigned) {
    throw new Error("Equipamentos baixados não podem ser atribuídos.");
  }
}

export const supabaseRepository = {
  async getSessionUser(userId: string): Promise<SessionUser | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, company_id, full_name, role, email")
      .eq("id", userId)
      .maybeSingle();
    if (error) scopedError(error.message);
    return (data as SessionUser | null) ?? null;
  },

  async listProfiles(companyId: string): Promise<Profile[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, company_id, full_name, role, email, created_at")
      .eq("company_id", companyId)
      .order("full_name", { ascending: true });
    if (error) scopedError(error.message);
    return (data ?? []) as ProfileRow[];
  },

  async listAssets(companyId: string, filters: AssetFilters = {}): Promise<AssetWithAssignee[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("assets")
      .select(
        "id, company_id, model, serial_number, category, assigned_to, purchase_value, purchase_date, status, created_at, updated_at, profiles:assigned_to(full_name)"
      )
      .eq("company_id", companyId)
      .order("model", { ascending: true });
    if (error) scopedError(error.message);

    const search = filters.search?.trim().toLowerCase();
    return (data ?? []).map((row) => {
      const related = one(row.profiles as { full_name: string } | { full_name: string }[] | null);
      const asset = row as unknown as AssetRow;
      return {
        ...asset,
        assignee_name: related?.full_name ?? null,
      };
    }).filter((asset) => {
        if (search) {
          const haystack = [asset.model, asset.serial_number, asset.assignee_name ?? ""]
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
      });
  },

  async getAsset(companyId: string, assetId: string): Promise<AssetWithAssignee | null> {
    const assets = await this.listAssets(companyId);
    return assets.find((asset) => asset.id === assetId) ?? null;
  },

  async dashboardMetrics(companyId: string): Promise<DashboardMetrics> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("assets")
      .select("purchase_value, status")
      .eq("company_id", companyId);
    if (error) scopedError(error.message);

    const assets = data ?? [];
    const active = assets.filter((asset) => asset.status !== "baixado");
    return {
      totalValue: active.reduce((sum, asset) => sum + Number(asset.purchase_value), 0),
      totalAssets: active.length,
      inUse: active.filter((asset) => asset.status === "em_uso").length,
      available: active.filter((asset) => asset.status === "disponivel").length,
      maintenance: active.filter((asset) => asset.status === "em_manutencao").length,
      retired: assets.filter((asset) => asset.status === "baixado").length,
    };
  },

  async listMovements(companyId: string, limit = 8): Promise<AssetMovementWithDetails[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("asset_movements")
      .select(
        "id, company_id, asset_id, type, description, actor_id, related_user_id, created_at, assets:asset_id(model), related:related_user_id(full_name)"
      )
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) scopedError(error.message);

    return (data ?? []).map((row) => {
      const asset = one(row.assets as { model: string } | { model: string }[] | null);
      const related = one(row.related as { full_name: string } | { full_name: string }[] | null);
      const movement = row as unknown as MovementRow;
      return {
        ...movement,
        asset_model: asset?.model ?? "Equipamento",
        related_user_name: related?.full_name ?? null,
      };
    });
  },

  async createAsset(companyId: string, actorId: string, values: AssetFormValues) {
    const supabase = await createSupabaseServerClient();
    assertAssignable(null, values);

    const { data: duplicate } = await supabase
      .from("assets")
      .select("id")
      .eq("company_id", companyId)
      .ilike("serial_number", values.serial_number)
      .maybeSingle();
    if (duplicate) throw new Error("Número de série já cadastrado nesta empresa.");

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("assets")
      .insert({
        company_id: companyId,
        model: values.model,
        serial_number: values.serial_number,
        category: values.category,
        assigned_to: values.assigned_to ?? null,
        purchase_value: values.purchase_value,
        purchase_date: values.purchase_date,
        status: values.status,
      })
      .select()
      .single();
    if (error) scopedError(error.message);

    const asset = data as AssetRow;
    const profiles = await this.listProfiles(companyId);
    const relatedName =
      profiles.find((profile) => profile.id === asset.assigned_to)?.full_name ?? null;
    const movement = detectMovement(null, asset, relatedName);
    if (movement) {
      await supabase.from("asset_movements").insert({
        company_id: companyId,
        asset_id: asset.id,
        type: movement.type,
        description: movement.description,
        actor_id: actorId,
        related_user_id: asset.assigned_to,
        created_at: now,
      });
    }

    return { ...asset, assignee_name: relatedName };
  },

  async updateAsset(
    companyId: string,
    actorId: string,
    assetId: string,
    values: AssetFormValues
  ) {
    const supabase = await createSupabaseServerClient();
    const { data: current, error: currentError } = await supabase
      .from("assets")
      .select("*")
      .eq("company_id", companyId)
      .eq("id", assetId)
      .maybeSingle();
    if (currentError) scopedError(currentError.message);
    if (!current) throw new Error("Equipamento não encontrado.");

    assertAssignable(current as Asset, values);

    const { data: duplicate } = await supabase
      .from("assets")
      .select("id")
      .eq("company_id", companyId)
      .ilike("serial_number", values.serial_number)
      .neq("id", assetId)
      .maybeSingle();
    if (duplicate) throw new Error("Número de série já cadastrado nesta empresa.");

    const { data, error } = await supabase
      .from("assets")
      .update({
        model: values.model,
        serial_number: values.serial_number,
        category: values.category,
        assigned_to: values.assigned_to ?? null,
        purchase_value: values.purchase_value,
        purchase_date: values.purchase_date,
        status: values.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assetId)
      .eq("company_id", companyId)
      .select()
      .single();
    if (error) scopedError(error.message);

    const next = data as AssetRow;
    const profiles = await this.listProfiles(companyId);
    const relatedName =
      profiles.find((profile) => profile.id === next.assigned_to)?.full_name ?? null;
    const movement = detectMovement(current as Asset, next, relatedName);
    if (movement) {
      await supabase.from("asset_movements").insert({
        company_id: companyId,
        asset_id: assetId,
        type: movement.type,
        description: movement.description,
        actor_id: actorId,
        related_user_id: next.assigned_to,
      });
    }

    return { ...next, assignee_name: relatedName };
  },

  async listAlerts(companyId: string): Promise<MaintenanceAlertWithAsset[]> {
    const supabase = await createSupabaseServerClient();
    const { data: latest } = await supabase
      .from("audit_runs")
      .select("id")
      .eq("company_id", companyId)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let query = supabase
      .from("maintenance_alerts")
      .select(
        "id, company_id, asset_id, audit_run_id, recommendation, priority, usage_months, created_at, assets:asset_id(model, serial_number)"
      )
      .eq("company_id", companyId)
      .order("usage_months", { ascending: false });

    if (latest?.id) {
      query = query.eq("audit_run_id", latest.id);
    }

    const { data, error } = await query;
    if (error) scopedError(error.message);

    return (data ?? []).map((row) => {
      const asset = one(
        row.assets as
          | { model: string; serial_number: string }
          | { model: string; serial_number: string }[]
          | null
      );
      const alert = row as unknown as AlertRow;
      return {
        ...alert,
        asset_model: asset?.model ?? "Equipamento",
        serial_number: asset?.serial_number ?? "—",
      };
    });
  },

  async latestAuditRun(companyId: string): Promise<AuditRun | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("audit_runs")
      .select("*")
      .eq("company_id", companyId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) scopedError(error.message);
    return (data as AuditRow | null) ?? null;
  },

  async runAudit(companyId: string, actorId: string) {
    const supabase = await createSupabaseServerClient();
    const started = new Date().toISOString();
    const { data: inserted, error: runError } = await supabase
      .from("audit_runs")
      .insert({
        company_id: companyId,
        triggered_by: actorId,
        status: "running",
        assets_analyzed: 0,
        alerts_generated: 0,
        started_at: started,
      })
      .select()
      .single();
    if (runError) scopedError(runError.message);

    const runId = (inserted as AuditRow).id;

    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select("*")
      .eq("company_id", companyId);
    if (assetsError) scopedError(assetsError.message);

    const { data: movements, error: movementsError } = await supabase
      .from("asset_movements")
      .select("*")
      .eq("company_id", companyId);
    if (movementsError) scopedError(movementsError.message);

    const generated = analyzeAssets((assets ?? []) as Asset[], (movements ?? []) as AssetMovement[]);
    const analyzed = (assets ?? []).filter((asset) => asset.status !== "baixado").length;
    const completed = new Date().toISOString();

    await supabase.from("maintenance_alerts").delete().eq("company_id", companyId);

    const alertsToInsert = generated.map((item) => ({
      company_id: companyId,
      asset_id: item.asset_id,
      audit_run_id: runId,
      recommendation: item.recommendation,
      priority: item.priority,
      usage_months: item.usage_months,
      created_at: completed,
    }));

    if (alertsToInsert.length > 0) {
      const { error: alertError } = await supabase
        .from("maintenance_alerts")
        .insert(alertsToInsert);
      if (alertError) scopedError(alertError.message);
    }

    const { data: run, error: completeError } = await supabase
      .from("audit_runs")
      .update({
        status: "completed",
        assets_analyzed: analyzed,
        alerts_generated: generated.length,
        summary: summarizeAlerts(generated, analyzed),
        completed_at: completed,
      })
      .eq("id", runId)
      .eq("company_id", companyId)
      .select()
      .single();
    if (completeError) scopedError(completeError.message);

    const alerts = await this.listAlerts(companyId);
    return { run: run as AuditRun, alerts };
  },
};
