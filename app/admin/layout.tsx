import type { ReactNode } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LayoutDashboard, Store, Package, Upload } from "lucide-react"
import { extractRoleName } from "@/lib/extract-role-name"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/admin/dashboard")

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()

  const roleName = extractRoleName(profileData?.roles)
  if (roleName !== "admin" && roleName !== "super_admin") redirect("/")

  const isSuperAdmin = roleName === "super_admin"

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 hidden md:block border-r">
        <div className="p-5 border-b">
          <div className="text-sm font-semibold">Admin Panel</div>
          <div className="text-xs text-muted-foreground mt-0.5">Vendor Management</div>
        </div>
        <nav className="p-3 space-y-1">
          <Link
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            href="/admin/dashboard"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            href="/admin/vendors"
          >
            <Store className="h-4 w-4" />
            Vendors
          </Link>
          <Link
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            href="/admin/vendors/bulk"
          >
            <Upload className="h-4 w-4" />
            Bulk Products
          </Link>
          {isSuperAdmin && (
            <Link
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
              href="/super-admin"
            >
              <Package className="h-4 w-4" />
              Super Admin
            </Link>
          )}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}

