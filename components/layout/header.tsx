import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { formatLongDate } from "@/lib/format";

type HeaderProps = {
  title: string;
  menu?: ReactNode;
};

export function Header({ title, menu }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {menu}
        <div>
          <p className="text-[11px] font-medium tracking-[0.16em] text-[#7d8799]">
            {formatLongDate()}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-[32px]">
            {title}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:pt-1">
        <button
          type="button"
          aria-label="Calendário"
          className="flex size-9 items-center justify-center rounded-lg border border-[#1d2433] bg-[#12161f] text-[#9aa3b5]"
        >
          <Calendar className="size-4" />
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          Sistema operacional
        </div>
      </div>
    </header>
  );
}
