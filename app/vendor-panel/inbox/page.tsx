import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { extractRoleName } from "@/lib/extract-role-name"
import { VendorAdminInbox } from "@/components/messaging/vendor-admin-inbox"

export const dynamic = "force-dynamic"

export default async function VendorInboxPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/vendor-panel/inbox")

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()
  const roleName = extractRoleName(profileData?.roles)
  if (roleName !== "vendor" && roleName !== "admin" && roleName !== "super_admin") redirect("/vendor-panel")

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <VendorAdminInbox mode={roleName === "vendor" ? "vendor" : "admin"} />
    </div>
  )
}
