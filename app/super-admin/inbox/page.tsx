import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { extractRoleName } from "@/lib/extract-role-name"
import { VendorAdminInbox } from "@/components/messaging/vendor-admin-inbox"

export const dynamic = "force-dynamic"

export default async function SuperAdminInboxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/super-admin/inbox")

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()
  const roleName = extractRoleName(profileData?.roles)
  if (roleName !== "admin" && roleName !== "super_admin") redirect("/account")

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <VendorAdminInbox mode="admin" />
    </div>
  )
}
