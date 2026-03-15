import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag } from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor", confirmed: "Onaylandı", shipped: "Kargoda",
  delivered: "Teslim Edildi", cancelled: "İptal", refunded: "İade",
}
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped:   "bg-purple-100 text-purple-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  refunded:  "bg-gray-100 text-gray-700",
}

export default async function VendorOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/vendor-panel/orders")

  const { data: store } = await supabase
    .from("vendor_stores").select("id").eq("owner_id", user.id).single()
  if (!store) redirect("/vendor-panel")

  const { data: orders } = await supabase
    .from("vendor_orders")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  const items = orders ?? []

  const statusGroups = Object.keys(STATUS_LABELS).reduce<Record<string, number>>((acc, s) => {
    acc[s] = items.filter(o => o.status === s).length
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Siparişler</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{items.length} toplam sipariş</p>
      </div>

      {/* Status summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusGroups).filter(([, count]) => count > 0).map(([status, count]) => (
          <span key={status} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]} <span className="font-bold">{count}</span>
          </span>
        ))}
      </div>

      {items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz sipariş yok.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {["Müşteri", "E-posta", "Ürün Sayısı", "Tutar", "Durum", "Tarih"].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map(order => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{order.customer_name}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{order.customer_email}</td>
                    <td className="px-4 py-3 text-center">{order.items_count}</td>
                    <td className="px-4 py-3 font-semibold">₺{Number(order.total).toLocaleString("tr-TR")}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString("tr-TR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
