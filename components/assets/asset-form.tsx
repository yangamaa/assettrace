"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createAssetAction, updateAssetAction } from "@/app/actions/assets";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORY_OPTIONS, STATUS_LABELS } from "@/lib/constants";
import { assetFormSchema, type AssetFormValues } from "@/lib/validations/asset";
import type { AssetStatus, AssetWithAssignee, Profile } from "@/lib/types";

type AssetFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: AssetWithAssignee | null;
  profiles: Profile[];
};

const EMPTY: AssetFormValues = {
  model: "",
  serial_number: "",
  category: "Notebook",
  assigned_to: null,
  purchase_value: 0,
  purchase_date: "",
  status: "disponivel",
};

export function AssetForm({ open, onOpenChange, asset, profiles }: AssetFormProps) {
  const [values, setValues] = useState<AssetFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const editing = Boolean(asset);

  useEffect(() => {
    if (!open) return;
    if (asset) {
      setValues({
        model: asset.model,
        serial_number: asset.serial_number,
        category: asset.category,
        assigned_to: asset.assigned_to,
        purchase_value: asset.purchase_value,
        purchase_date: asset.purchase_date,
        status: asset.status,
      });
    } else {
      setValues(EMPTY);
    }
    setErrors({});
  }, [asset, open]);

  const assignmentLocked = values.status === "em_manutencao" && Boolean(asset);
  const assignmentDisabled =
    values.status === "disponivel" ||
    values.status === "baixado" ||
    (values.status === "em_manutencao" && !asset?.assigned_to);

  const helper = useMemo(() => {
    if (values.status === "em_uso") return "Selecione o colaborador responsável.";
    if (values.status === "em_manutencao") {
      return "Equipamentos em manutenção não podem receber nova atribuição.";
    }
    if (values.status === "baixado") return "Ativos baixados saem do estoque disponível.";
    return "Disponível permanece no estoque, sem responsável.";
  }, [values.status]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = assetFormSchema.safeParse({
      ...values,
      assigned_to:
        values.status === "disponivel" || values.status === "baixado"
          ? null
          : values.assigned_to,
      purchase_value: Number(values.purchase_value),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "model");
        next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setPending(true);
    const result = editing
      ? await updateAssetAction({ id: asset!.id, ...parsed.data })
      : await createAssetAction(parsed.data);
    setPending(false);

    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar equipamento" : "Novo equipamento"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Atualize os dados patrimoniais. Alterações relevantes geram movimentação."
              : "Cadastre um ativo da empresa. Número de série não pode se repetir."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4">
          <Field label="Modelo / Hardware" error={errors.model}>
            <Input
              value={values.model}
              onChange={(event) => setValues((current) => ({ ...current, model: event.target.value }))}
              placeholder='MacBook Pro 14" M3'
            />
          </Field>
          <Field label="Número de série" error={errors.serial_number}>
            <Input
              value={values.serial_number}
              onChange={(event) =>
                setValues((current) => ({ ...current, serial_number: event.target.value }))
              }
              placeholder="SN-APL-2024-001"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria" error={errors.category}>
              <Select
                value={values.category}
                onValueChange={(value) =>
                  setValues((current) => ({
                    ...current,
                    category: value as AssetFormValues["category"],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status" error={errors.status}>
              <Select
                value={values.status}
                onValueChange={(value) => {
                  const status = value as AssetStatus;
                  setValues((current) => ({
                    ...current,
                    status,
                    assigned_to:
                      status === "disponivel" || status === "baixado"
                        ? null
                        : current.assigned_to,
                  }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      STATUS_LABELS[value as AssetStatus] ?? value
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as AssetStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Responsável" error={errors.assigned_to}>
            <Select
              value={values.assigned_to ?? "none"}
              disabled={assignmentDisabled}
              onValueChange={(value) =>
                setValues((current) => ({
                  ...current,
                  assigned_to: value === "none" ? null : String(value),
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string) =>
                    value === "none"
                      ? "Disponível"
                      : profiles.find((profile) => profile.id === value)?.full_name ??
                        "Disponível"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Disponível</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem
                    key={profile.id}
                    value={profile.id}
                    disabled={assignmentLocked && profile.id !== asset?.assigned_to}
                  >
                    {profile.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{helper}</p>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Valor (R$)" error={errors.purchase_value}>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={values.purchase_value || ""}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    purchase_value: Number(event.target.value),
                  }))
                }
              />
            </Field>
            <Field label="Data de compra" error={errors.purchase_date}>
              <Input
                type="date"
                value={values.purchase_date}
                onChange={(event) =>
                  setValues((current) => ({ ...current, purchase_date: event.target.value }))
                }
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending} className="bg-[#3b82f6] text-white">
              {pending ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar equipamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
