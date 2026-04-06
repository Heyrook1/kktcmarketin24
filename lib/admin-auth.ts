import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { extractRoleName } from "@/lib/extract-role-name"

export type AdminAuthResult =
  | { ok: true; userId: string; role: "admin" | "super_admin" }
  | { ok: false; status: 401 | 403; message: string }

export async function assertAdminAuth(): Promise<AdminAuthResult> {
  const supabase = await createClient()
  const { data: authData, error: authErr } = await supabase.auth.getUser()

  if (authErr || !authData?.user) {
    return { ok: false, status: 401, message: "Kimlik doğrulaması gerekli." }
  }

  const userId = authData.user.id

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", userId)
    .single()

  const roleName = extractRoleName(profileData?.roles)
  if (roleName !== "admin" && roleName !== "super_admin") {
    return { ok: false, status: 403, message: "Yetkiniz yok." }
  }

  return { ok: true, userId, role: roleName as "admin" | "super_admin" }
}

