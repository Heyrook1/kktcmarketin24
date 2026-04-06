import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { Shield, Users, Store, ShoppingBag, LayoutDashboard, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { extractRoleName } from "@/lib/extract-role-name"

export const dynamic = "force-dynamic"

function adminClient() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function SuperAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/super-admin")

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()
  const roleName = extractRoleName(profileData?.roles)
  if (roleName !== "super_admin") redirect("/account")

  const admin = adminClient()
  const [{ data: stores }, { data: orders }, { data: users }, { data: recentVendorOrders }] = await Promise.all([
    admin.from("vendor_stores").select("id, name, is_active").order("created_at", { ascending: false }),
    admin.from("orders").select("id, order_number, total, created_at").order("created_at", { ascending: false }).limit(10),
    admin.from("profiles").select("id, full_name, is_active").order("created_at", { ascending: false }),
    admin
      .from("vendor_orders")
      .select("id, customer_name, status, total, created_at, store_id, vendor_stores(name)")
      .order("created_at", { ascending: false })
      .limit(12),
  ])

  const activeStores = (stores ?? []).filter((s) => s.is_active).length
  const activeUsers = (users ?? []).filter((u) => u.is_active).length

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Super Admin Kontrol Merkezi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tek hesaptan tüm satıcı, müşteri ve platform süreçlerini yönetin.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" />Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{users?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Aktif: {activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4" />Mağazalar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stores?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Aktif: {activeStores}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Son Siparişler</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{orders?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Global görünüm</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Vendor Satırları</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentVendorOrders?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Durum yönetimi hazır</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı Kontroller</CardTitle>
          <CardDescription>Farklı hesaba geçmeden tüm panellere erişin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link href="/admin/dashboard">Admin Dashboard</Link></Button>
          <Button asChild variant="secondary"><Link href="/admin/vendors">Vendor Yönetimi</Link></Button>
          <Button asChild variant="secondary"><Link href="/vendor-panel/orders">Vendor Sipariş Operasyonları</Link></Button>
          <Button asChild variant="outline"><Link href="/account?tab=orders">Müşteri Sipariş Görünümü</Link></Button>
          <Button asChild variant="outline"><Link href="/vendor-panel/settings"><Settings className="h-4 w-4 mr-1" />Vendor Ayarları</Link></Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son Vendor Sipariş Satırları</CardTitle>
          <CardDescription>Durumları vendor panelinden bu hesapla güncelleyebilirsiniz.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3">Müşteri</th>
                <th className="py-2 pr-3">Mağaza</th>
                <th className="py-2 pr-3">Durum</th>
                <th className="py-2 pr-3">Tutar</th>
                <th className="py-2">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {(recentVendorOrders ?? []).map((row) => {
                const store = Array.isArray(row.vendor_stores) ? row.vendor_stores[0] : row.vendor_stores
                return (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{row.customer_name}</td>
                    <td className="py-2 pr-3">{store?.name ?? "—"}</td>
                    <td className="py-2 pr-3">{row.status}</td>
                    <td className="py-2 pr-3">₺{Number(row.total).toLocaleString("tr-TR")}</td>
                    <td className="py-2">{new Date(row.created_at).toLocaleString("tr-TR")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
