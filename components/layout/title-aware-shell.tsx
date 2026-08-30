"use client";

import { usePathname } from "next/navigation";
import { firstName, greetingForNow } from "@/lib/format";
import { AppShell } from "@/components/layout/app-shell";
import type { SessionUser } from "@/lib/types";

export function DashboardFrame({
  user,
  supabaseConnected,
  children,
}: {
  user: SessionUser;
  supabaseConnected: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const title =
    pathname.startsWith("/inventario")
      ? "Gestão de Inventário"
      : pathname.startsWith("/auditoria-preditiva")
        ? "AuditorIA Preditiva"
        : `${greetingForNow()}, ${firstName(user.full_name)}.`;

  return (
    <AppShell user={user} supabaseConnected={supabaseConnected} title={title}>
      {children}
    </AppShell>
  );
}
