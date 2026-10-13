import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

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

  const { pathname } = request.nextUrl;
  const isProtected = pathname === "/profile" || pathname === "/settings";
  const isAuthPage =
    pathname === "/login" || pathname === "/signup" || pathname === "/reset";

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return Response.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return Response.redirect(url);
  }

  return supabaseResponse;
}
