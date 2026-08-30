"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { SessionUser } from "@/lib/types";

type AppShellProps = {
  user: SessionUser;
  supabaseConnected: boolean;
  title: string;
  children: React.ReactNode;
};

export function AppShell({
  user,
  supabaseConnected,
  title,
  children,
}: AppShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0e14]">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <Sidebar user={user} supabaseConnected={supabaseConnected} />
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[260px] border-[#1d2433] bg-[#0b0e14] p-0 sm:max-w-[260px]"
        >
          <SheetTitle className="sr-only">Navegação</SheetTitle>
          <Sidebar
            user={user}
            supabaseConnected={supabaseConnected}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-[260px]">
        <main className="mx-auto w-full max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <Header
            title={title}
            menu={
              <Button
                variant="outline"
                size="icon"
                className="mt-1 lg:hidden"
                onClick={() => setOpen(true)}
              >
                <Menu className="size-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            }
          />
          <div className="mt-6 lg:mt-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
