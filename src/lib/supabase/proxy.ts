import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, supabaseKey, supabaseUrl } from "./env";

// Paths a signed-out visitor may open. Everything else redirects to the landing page.
const PUBLIC_PATHS = ["/", "/auth/callback"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);

  if (!hasSupabaseEnv) {
    return isPublic ? response : NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  if (!signedIn && !isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (signedIn && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/calendario", request.url));
  }
  return response;
}
