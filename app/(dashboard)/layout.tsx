import { redirect } from "next/navigation";
import { DashboardFrame } from "@/components/layout/title-aware-shell";
import { getCurrentUser } from "@/lib/data/repository";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardFrame user={user} supabaseConnected={isSupabaseConfigured()}>
      {children}
    </DashboardFrame>
  );
}
