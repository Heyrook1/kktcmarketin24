import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Auth Callback Route
 * Supabase redirects here after:
 *   - Email confirmation (sign-up)
 *   - Password reset link click
 *   - Magic link sign-in
 *
 * It exchanges the one-time `code` for a live session, then
 * redirects the user to the appropriate destination based on their role.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/account'

  if (!code) {
    // No code — redirect to login with an error hint
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`)
  }

  // Determine redirect based on role stored in profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role_id, roles(name)')
    .eq('id', data.user.id)
    .single()

  // If this is a password reset flow, always go to update-password
  const type = searchParams.get('type')
  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/update-password`)
  }

  // Role-based redirect after email confirmation / magic link
  const roleName = (profile?.roles as { name?: string } | null)?.name ?? 'customer'
  let destination = '/account'
  if (roleName === 'admin')  destination = '/admin'
  if (roleName === 'vendor') destination = '/vendor-panel'

  // Honour an explicit `next` param if it was passed and isn't a role-default
  const finalDest = next !== '/account' ? next : destination

  return NextResponse.redirect(`${origin}${finalDest}`)
}
