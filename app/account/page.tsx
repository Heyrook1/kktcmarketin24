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

  // Fetch profile from DB
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, roles(name, description)")
    .eq("id", user.id)
    .single()

  return <AccountContent user={user} profile={profile} />
}
