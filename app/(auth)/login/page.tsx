"use client";

import { useActionState } from "react";
import { Zap } from "lucide-react";
import { loginAction, signupAction, type AuthState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const initial: AuthState = { ok: false };

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b0e14] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1d2433] bg-[#10151d] p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-[#3b82f6]">
            <Zap className="size-5 text-white" fill="currentColor" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">AssetTrace</p>
            <p className="text-[10px] tracking-[0.14em] text-[#7d8799]">
              CLOUD ITAM PARA PMES
            </p>
          </div>
        </div>
        <h1 className="text-xl font-semibold text-white">
          {mode === "login" ? "Acesse sua operação" : "Criar conta da empresa"}
        </h1>
        <p className="mt-1 text-sm text-[#8b95a8]">
          {mode === "login"
            ? "Em modo local o acesso de demonstração entra como Marina Costa."
            : "Cada conta cria uma empresa isolada com RLS por company_id."}
        </p>
        <form action={formAction} className="mt-6 grid gap-4">
          {mode === "signup" ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="full_name">Nome</Label>
                <Input id="full_name" name="full_name" required placeholder="Marina Costa" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="company_name">Empresa</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  required
                  placeholder="NovaTech Sistemas"
                />
              </div>
            </>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="marina@novatech.com.br"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              defaultValue="AssetTrace2026"
            />
          </div>
          {state.message ? <p className="text-sm text-red-400">{state.message}</p> : null}
          <Button
            type="submit"
            disabled={pending}
            className="h-10 bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          >
            {pending ? "Entrando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <button
          type="button"
          className="mt-5 text-sm text-[#60a5fa]"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Criar conta com Supabase" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}
