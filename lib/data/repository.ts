import { cookies } from "next/headers";
import { DEMO_USER_ID, SESSION_COOKIE } from "@/lib/constants";
import { localRepository } from "@/lib/data/local-repo";
import { supabaseRepository } from "@/lib/data/supabase-repo";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/lib/types";

export function dataRepository() {
  return isSupabaseConfigured() ? supabaseRepository : localRepository;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return supabaseRepository.getSessionUser(userId(user.id));
  }

  const jar = await cookies();
  const userIdFromCookie = jar.get(SESSION_COOKIE)?.value ?? DEMO_USER_ID;
  return localRepository.getSessionUser(userIdFromCookie);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Sessão expirada. Entre novamente.");
  }
  return user;
}

function userId(id: string) {
  return id;
}
