import { NextResponse, type NextRequest } from "next/server";
import { DEMO_USER_ID, SESSION_COOKIE } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/cadastro"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicPath = isPublicPath(pathname);

  if (!isSupabaseConfigured()) {
    const session = request.cookies.get(SESSION_COOKIE)?.value;
    if (!session && !publicPath) {
      const response = NextResponse.next();
      response.cookies.set(SESSION_COOKIE, DEMO_USER_ID, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }
    if (session && publicPath) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  const { user, response } = await updateSession(request);
  if (!user && !publicPath) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  if (user && publicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
