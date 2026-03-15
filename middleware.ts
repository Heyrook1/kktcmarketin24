import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

// Only protect routes where a mid-stream redirect would not break RSC prefetches.
// /account handles its own auth check inside the page (server redirect after getUser).
const PROTECTED_PATHS = ['/vendor-panel']

export async function middleware(request: NextRequest) {
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

  // Single getUser() call — refreshes session and gives us the user
  const { data: { user } } = await supabase.auth.getUser()

  // Never redirect auth routes — prevents infinite redirect loops
  if (pathname.startsWith('/auth/')) return response

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(loginUrl)
    response.cookies.getAll().forEach(({ name, value }) =>
      redirectResponse.cookies.set(name, value)
    )
    return redirectResponse
  }

  return response
}
