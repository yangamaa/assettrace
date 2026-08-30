"use server";

import { revalidatePath } from "next/cache";
import { dataRepository, requireUser } from "@/lib/data/repository";
import { assetFormSchema, assetUpdateSchema } from "@/lib/validations/asset";

export type ActionState = {
  ok: boolean;
  message?: string;
};

export async function createAssetAction(input: unknown): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = assetFormSchema.parse(input);
    await dataRepository().createAsset(user.company_id, user.id, parsed);
    revalidatePath("/dashboard");
    revalidatePath("/inventario");
    revalidatePath("/auditoria-preditiva");
    return { ok: true, message: "Equipamento cadastrado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível cadastrar o equipamento.",
    };
  }
}

export async function updateAssetAction(input: unknown): Promise<ActionState> {
  try {
    const user = await requireUser();
    const parsed = assetUpdateSchema.parse(input);
    const { id, ...values } = parsed;
    await dataRepository().updateAsset(user.company_id, user.id, id, values);
    revalidatePath("/dashboard");
    revalidatePath("/inventario");
    revalidatePath("/auditoria-preditiva");
    return { ok: true, message: "Equipamento atualizado." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Não foi possível atualizar o equipamento.",
    };
  }
}
