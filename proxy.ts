import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// ─── Route protection map ────────────────────────────────────────────────────
// Routes that require authentication and (optionally) a specific role.
// Roles are read from the `user_role` JWT claim set by custom_access_token_hook.
// Falls back to a DB profile lookup if the claim is absent (e.g. older tokens).
const ROLE_PROTECTED: Array<{ path: string; roles: string[] }> = [
  { path: '/admin',        roles: ['admin'] },
  { path: '/vendor-panel', roles: ['admin', 'vendor'] },
  { path: '/account',      roles: ['admin', 'vendor', 'customer'] },
]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a mutable response that will carry refreshed session cookies
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — this is the only getUser() call we make
  const { data: { user } } = await supabase.auth.getUser()

  // Auth routes: never redirect, just pass through
  if (pathname.startsWith('/auth/')) return response

  // Find whether this path is protected and what roles are required
  const rule = ROLE_PROTECTED.find((r) => pathname.startsWith(r.path))
  if (!rule) return response   // public route

  // Not logged in → send to login
  if (!user) {
    return redirectToLogin(request, response, pathname)
  }

  // Retrieve role — first try JWT claim (fast), then DB (authoritative)
  const jwtRole = (await supabase.auth.getSession())
    .data.session?.user?.user_metadata?.user_role as string | undefined

  let role: string = jwtRole ?? 'customer'

  if (!jwtRole) {
    // Fallback: query the profile directly
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', user.id)
      .single()
    role = (profile?.roles as { name?: string } | null)?.name ?? 'customer'
  }

  // Check if user's role is allowed for this route
  if (!rule.roles.includes(role)) {
    // Logged in but wrong role — redirect to their correct home
    const destination = role === 'vendor' ? '/vendor-panel'
                      : role === 'admin'  ? '/admin'
                      : '/account'
    const url = request.nextUrl.clone()
    url.pathname = destination
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach(({ name, value }) =>
      redirect.cookies.set(name, value)
    )
    return redirect
  }

  return response
}

function redirectToLogin(
  request: NextRequest,
  response: NextResponse,
  pathname: string
): NextResponse {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/auth/login'
  loginUrl.searchParams.set('next', pathname)
  const redirect = NextResponse.redirect(loginUrl)
  response.cookies.getAll().forEach(({ name, value }) =>
    redirect.cookies.set(name, value)
  )
  return redirect
}

export const config = {
  matcher: [
    // Run on all paths except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf|eot)$).*)',
  ],
}
