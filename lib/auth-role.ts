import { createClient } from "@/lib/supabase/server"
import { extractRoleName } from "@/lib/extract-role-name"

export type AppRole = "customer" | "vendor" | "admin" | "super_admin"

export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()
  if (authErr || !authData?.user) return null

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", authData.user.id)
    .single()

  const roleName = extractRoleName(profileData?.roles)
  if (roleName === "super_admin") return "super_admin"
  if (roleName === "admin") return "admin"
  if (roleName === "vendor") return "vendor"
  if (roleName === "customer") return "customer"
  return null
}
