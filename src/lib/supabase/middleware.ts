import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";
import { UPDATE_PASSWORD_PATH } from "../password";

const AUTH_PAGES = new Set(["/login", "/signup", "/reset"]);

export function authRedirectPath(pathname: string, hasUser: boolean): string | null {
  if (pathname === UPDATE_PASSWORD_PATH || pathname.startsWith("/api/")) return null;
  if (!hasUser && !AUTH_PAGES.has(pathname)) return "/login";
  if (hasUser && AUTH_PAGES.has(pathname)) return "/";
  return null;
}

export async function updateSession(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = authRedirectPath(request.nextUrl.pathname, Boolean(user));
  if (redirectTo) {
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
