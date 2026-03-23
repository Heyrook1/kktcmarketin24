import { createClient } from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import { VendorOrdersTable, type OrderRow } from "@/components/vendor/vendor-orders-table"
import { getReliabilityScore } from "@/lib/reliability"

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

  // Fetch orders alongside their parent orders to get customer_id
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: rawOrders } = await admin
    .from("vendor_orders")
    .select("*, orders!inner(customer_id)")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  const items = rawOrders ?? []

  // Fetch reliability scores for all unique customers in parallel
  const customerIds = [...new Set(
    items
      .map((o) => (o.orders as { customer_id: string } | null)?.customer_id)
      .filter(Boolean) as string[]
  )]

  const scoreMap = Object.fromEntries(
    await Promise.all(
      customerIds.map(async (id) => [id, await getReliabilityScore(id)])
    )
  )

  const ordersWithReliability: OrderRow[] = items.map((o) => {
    const customerId = (o.orders as { customer_id: string } | null)?.customer_id ?? null
    return {
      id:            o.id,
      customer_name: o.customer_name,
      customer_email: o.customer_email,
      items_count:   o.items_count,
      total:         Number(o.total),
      status:        o.status,
      created_at:    o.created_at,
      reliability:   customerId ? (scoreMap[customerId] ?? null) : null,
    }
  })

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

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(statusGroups).filter(([, count]) => count > 0).map(([status, count]) => (
          <span key={status} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]} <span className="font-bold">{count}</span>
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Güvenilirlik Skoru:</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />Mükemmel ≥80</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" />İyi 60–79</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-amber-500" />Orta 40–59</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-2 rounded-full bg-red-500" />Düşük {'<'}40</span>
      </div>

      <Card className="shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz sipariş yok.</p>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-0 pt-4 px-4">
              <CardTitle className="text-base">Sipariş Listesi</CardTitle>
              <CardDescription className="text-xs">Teslimat durumu güncellemek için "Güncelle" düğmesini kullanın. Her güncelleme müşterinin güvenilirlik skoruna yansır.</CardDescription>
            </CardHeader>
            <VendorOrdersTable initialOrders={ordersWithReliability} />
          </>
        )}
      </Card>
    </div>
  )
}

