import { z } from "zod";
import { ASSET_CATEGORIES, ASSET_STATUSES } from "@/lib/types";
import { sanitizeText } from "@/lib/format";

const serialPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{2,79}$/;

export const assetStatusSchema = z.enum(ASSET_STATUSES);
export const assetCategorySchema = z.enum(ASSET_CATEGORIES);

export const assetFormSchema = z
  .object({
    model: z
      .string()
      .transform(sanitizeText)
      .pipe(z.string().min(2, "Informe o modelo").max(120, "Modelo muito longo")),
    serial_number: z
      .string()
      .transform(sanitizeText)
      .pipe(
        z
          .string()
          .min(3, "Informe o número de série")
          .max(80, "Número de série muito longo")
          .regex(serialPattern, "Use apenas letras, números, ponto, hífen ou underline")
      ),
    category: assetCategorySchema,
    assigned_to: z
      .union([z.uuid(), z.literal(""), z.null()])
      .optional()
      .transform((value) => (value ? value : null)),
    purchase_value: z.coerce
      .number({ error: "Informe um valor válido" })
      .positive("O valor deve ser maior que zero")
      .max(10_000_000, "Valor acima do limite permitido"),
    purchase_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data de compra"),
    status: assetStatusSchema,
  })
  .superRefine((data, ctx) => {
    const assigned = data.assigned_to ?? null;

    if (data.status === "em_uso" && !assigned) {
      ctx.addIssue({
        code: "custom",
        path: ["assigned_to"],
        message: "Ativos em uso precisam de um responsável",
      });
    }

    if (data.status === "disponivel" && assigned) {
      ctx.addIssue({
        code: "custom",
        path: ["assigned_to"],
        message: "Ativos disponíveis não podem ter responsável",
      });
    }

    if (data.status === "baixado" && assigned) {
      ctx.addIssue({
        code: "custom",
        path: ["assigned_to"],
        message: "Ativos baixados não podem ser atribuídos",
      });
    }
  });

export type AssetFormValues = z.infer<typeof assetFormSchema>;

export const assetUpdateSchema = assetFormSchema.extend({
  id: z.string().uuid("Identificador inválido"),
});

export const assetFiltersSchema = z.object({
  search: z.string().max(120).optional(),
  category: z.union([assetCategorySchema, z.literal("all")]).optional(),
  status: z.union([assetStatusSchema, z.literal("all")]).optional(),
});
