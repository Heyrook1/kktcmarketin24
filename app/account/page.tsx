import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AccountContent } from "./account-content"

export const metadata: Metadata = {
  title: "Hesabim | KKTC Market",
  description: "Profilinizi, siparişlerinizi, kuponlarınızı ve destek taleplerinizi yönetin.",
}

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch profile — if missing, upsert a blank one on the fly
  let { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name, description)")
    .eq("id", user.id)
    .single()

  if (!profile) {
    // Profile row missing — trigger may have failed. Create it now.
    const { data: customerRole } = await supabase
      .from("roles")
      .select("id")
      .eq("name", "customer")
      .single()

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

      const { data: refetched } = await supabase
        .from("profiles")
        .select("*, roles(name, description)")
        .eq("id", user.id)
        .single()
      profile = refetched
    }
  }

  return <AccountContent user={user} profile={profile} />
}
