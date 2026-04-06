import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorSidebar } from "./vendor-sidebar"
import { extractRoleName } from "@/lib/extract-role-name"

export const dynamic = "force-dynamic"

export default async function VendorPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/vendor-login")
  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()
  const roleName = extractRoleName(profileData?.roles)
  if (roleName !== "vendor" && roleName !== "admin" && roleName !== "super_admin") redirect("/account")

  return (
    <div className="flex min-h-screen bg-background">
      <VendorSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
