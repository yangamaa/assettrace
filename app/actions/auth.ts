"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { DEMO_USER_ID, SESSION_COOKIE } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AuthState = {
  ok: boolean;
  message?: string;
};

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  if (!isSupabaseConfigured()) {
    const jar = await cookies();
    jar.set(SESSION_COOKIE, DEMO_USER_ID, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: "E-mail ou senha inválidos." };
  redirect("/dashboard");
}

export async function signupAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: formData.get("full_name"),
    company_name: formData.get("company_name"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: "Cadastro real exige Supabase. Use o acesso de demonstração.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        company_name: parsed.data.company_name,
      },
    },
  });
  if (error) return { ok: false, message: error.message };

  if (data.user) {
    try {
      const admin = createSupabaseAdminClient();
      const slug = parsed.data.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const { data: company, error: companyError } = await admin
        .from("companies")
        .insert({ name: parsed.data.company_name, slug: `${slug}-${data.user.id.slice(0, 6)}` })
        .select("id")
        .single();
      if (companyError) throw companyError;
      await admin.from("profiles").upsert({
        id: data.user.id,
        company_id: company.id,
        full_name: parsed.data.full_name,
        role: "Administradora",
        email: parsed.data.email,
      });
    } catch {
      // Trigger de banco pode já ter criado company/profile.
    }
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
