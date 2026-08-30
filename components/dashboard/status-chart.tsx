"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

type StatusChartProps = {
  inUse: number;
  available: number;
  maintenance: number;
  total: number;
};

export function StatusChart({ inUse, available, maintenance, total }: StatusChartProps) {
  const data = [
    { name: "Em Uso", value: inUse, color: "#34d399" },
    { name: "Disponível", value: available, color: "#7dd3fc" },
    { name: "Em Manutenção", value: maintenance, color: "#fbbf24" },
  ].filter((item) => item.value > 0);

  return (
    <article className="rounded-xl border border-[#1d2433] bg-[#10151d] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">Distribuição por status</h2>
          <p className="mt-1 text-sm text-[#8b95a8]">
            Visão geral dos {total} ativos rastreados em tempo real.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-52 w-52 shrink-0">
          {total === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[#8b95a8]">
              Sem ativos
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    innerRadius={62}
                    outerRadius={86}
                    paddingAngle={3}
                    stroke="transparent"
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-semibold text-white">{total}</p>
                <p className="text-xs text-[#8b95a8]">ativos totais</p>
              </div>
            </>
          )}
        </div>
        <ul className="w-full space-y-3">
          {[
            { label: "Em Uso", value: inUse, color: "bg-[#34d399]" },
            { label: "Disponível", value: available, color: "bg-[#7dd3fc]" },
            { label: "Em Manutenção", value: maintenance, color: "bg-[#fbbf24]" },
          ].map((item) => (
            <li key={item.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-[#c5cedd]">
                <span className={`size-2.5 rounded-full ${item.color}`} />
                {item.label}
              </span>
              <span className="font-medium text-white">{item.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
