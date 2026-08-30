"use client";

import { useMemo, useState } from "react";
import { Funnel, PackagePlus, Search } from "lucide-react";
import { AssetForm } from "@/components/assets/asset-form";
import { AssetStatusBadge } from "@/components/assets/asset-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_OPTIONS, STATUS_LABELS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { AssetStatus, AssetWithAssignee, Profile } from "@/lib/types";

type AssetTableProps = {
  assets: AssetWithAssignee[];
  profiles: Profile[];
};

export function AssetTable({ assets, profiles }: AssetTableProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<AssetWithAssignee | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (term) {
        const haystack = [
          asset.model,
          asset.serial_number,
          asset.assignee_name ?? "disponível",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      if (category !== "all" && asset.category !== category) return false;
      if (status !== "all" && asset.status !== status) return false;
      return true;
    });
  }, [assets, category, search, status]);

  function openCreate() {
    setSelected(null);
    setFormOpen(true);
  }

  function openEdit(asset: AssetWithAssignee) {
    setSelected(asset);
    setFormOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-[#60a5fa]">
            CONTROLE PATRIMONIAL
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Inventário</h2>
          <p className="mt-1 max-w-xl text-sm text-[#8b95a8]">
            Centralize notebooks, monitores, servidores e periféricos da sua operação.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="h-10 gap-2 bg-[#3b82f6] px-4 text-white hover:bg-[#2563eb]"
        >
          <PackagePlus className="size-4" />
          Novo Equipamento
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#1d2433] bg-[#10151d] p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#6f788a]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por modelo, série ou responsável..."
            className="h-10 border-[#1d2433] bg-[#0b0e14] pl-9"
          />
        </div>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className="h-10 border-[#1d2433] bg-[#0b0e14] text-[#d7deea]"
              />
            }
          >
            <Funnel className="size-4" />
            Filtros
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <div className="grid gap-1.5">
              <p className="text-xs font-medium text-[#9aa3b5]">Categoria</p>
              <Select value={category} onValueChange={(value) => setCategory(String(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) => (value === "all" ? "Todas" : value)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORY_OPTIONS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <p className="text-xs font-medium text-[#9aa3b5]">Status</p>
              <Select value={status} onValueChange={(value) => setStatus(String(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string) =>
                      value === "all" ? "Todos" : STATUS_LABELS[value as AssetStatus] ?? value
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(STATUS_LABELS) as AssetStatus[]).map((item) => (
                    <SelectItem key={item} value={item}>
                      {STATUS_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1d2433] bg-[#10151d]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-white">Nenhum equipamento encontrado</p>
            <p className="mt-1 text-sm text-[#8b95a8]">
              Ajuste a busca, limpe os filtros ou cadastre um novo ativo.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-[#1d2433] hover:bg-transparent">
                <TableHead className="text-[#8b95a8]">Modelo / Hardware</TableHead>
                <TableHead className="text-[#8b95a8]">Nº de Série</TableHead>
                <TableHead className="text-[#8b95a8]">Categoria</TableHead>
                <TableHead className="text-[#8b95a8]">Responsável</TableHead>
                <TableHead className="text-[#8b95a8]">Valor (R$)</TableHead>
                <TableHead className="text-[#8b95a8]">Data de Compra</TableHead>
                <TableHead className="text-[#8b95a8]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((asset) => (
                <TableRow
                  key={asset.id}
                  className="cursor-pointer border-[#1d2433] hover:bg-[#161c27]"
                  onClick={() => openEdit(asset)}
                >
                  <TableCell className="font-medium text-white">{asset.model}</TableCell>
                  <TableCell className="font-mono text-xs text-[#9aa3b5]">
                    {asset.serial_number}
                  </TableCell>
                  <TableCell className="text-[#9aa3b5]">{asset.category}</TableCell>
                  <TableCell className="text-[#9aa3b5]">
                    {asset.assignee_name ?? "Disponível"}
                  </TableCell>
                  <TableCell className="font-mono text-[#9aa3b5] tabular-nums">
                    {formatCurrency(asset.purchase_value).replace("R$", "").trim()}
                  </TableCell>
                  <TableCell className="text-[#9aa3b5]">{formatDate(asset.purchase_date)}</TableCell>
                  <TableCell>
                    <AssetStatusBadge status={asset.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AssetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={selected}
        profiles={profiles}
      />
    </div>
  );
}
