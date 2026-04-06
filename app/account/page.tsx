import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AccountContent } from "./account-content"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Hesabim | KKTC Market",
  description: "Profilinizi, siparişlerinizi, kuponlarınızı ve destek taleplerinizi yönetin.",
}

export default async function AccountPage() {
  // Auth check must run OUTSIDE try/catch — redirect() throws a special
  // Next.js error that must not be swallowed by a catch block.
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/login?next=/account")
  }

  try {

    // Fetch profile — single query, no join (avoids FK null crash)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    // Resolve role name separately if role_id exists
    let roleName: string | null = null
    if (profile?.role_id) {
      const { data: role } = await supabase
        .from("roles")
        .select("name, description")
        .eq("id", profile.role_id)
        .maybeSingle()
      roleName = role?.name ?? null
    }

    const profileWithRole = profile ? { ...profile, roles: roleName ? { name: roleName } : null } : null

    // If still no profile, create a minimal one on the fly
    if (!profile) {
      const { data: customerRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "customer")
        .maybeSingle()

      if (customerRole) {
        await supabase.from("profiles").upsert({
          id: user.id,
          role_id: customerRole.id,
          full_name: user.user_metadata?.full_name ?? null,
          display_name: user.user_metadata?.display_name ?? null,
          is_active: true,
          is_verified: !!user.email_confirmed_at,
          country: "TR",
          language: "tr",
        }, { onConflict: "id" })
      }
    }

    return <AccountContent user={user} profile={profileWithRole} />
  } catch (err) {
    // Prevent RSC stream crash — redirect to home with an error param
    console.error("[v0] AccountPage error:", err)
    redirect("/?account_error=1")
  }
}
