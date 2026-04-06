import { createClient } from "@/lib/supabase/server"
import { createClient as createAdmin } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { extractRoleName } from "@/lib/extract-role-name"

export const dynamic = "force-dynamic"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import { VendorOrdersTable, type OrderRow } from "@/components/vendor/vendor-orders-table"
import { getReliabilityScore } from "@/lib/reliability"

const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor",
  confirmed: "Sipariş onaylandı",
  preparing: "Hazırlanıyor",
  shipped: "Kargoya teslim edildi",
  exchange_requested: "Değişim talep edildi",
  delivered: "Teslim alındı",
  cancelled: "İptal",
  refunded: "İade",
}
const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-violet-100 text-violet-800",
  shipped:   "bg-purple-100 text-purple-800",
  exchange_requested: "bg-orange-100 text-orange-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
  refunded:  "bg-gray-100 text-gray-700",
}

interface VendorOrdersPageProps {
  searchParams: Promise<{ store?: string }>
}

export default async function VendorOrdersPage({ searchParams }: VendorOrdersPageProps) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/vendor-panel/orders")

  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles(name)")
    .eq("id", user.id)
    .single()
  const roleName = extractRoleName(profileData?.roles)
  const isPrivileged = roleName === "admin" || roleName === "super_admin"

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let storeIds: string[] = []
  let availableStores: Array<{ id: string; name: string }> = []

  if (isPrivileged) {
    const { data: allStores } = await admin
      .from("vendor_stores")
      .select("id, name")
      .order("name", { ascending: true })
    availableStores = (allStores ?? []) as Array<{ id: string; name: string }>
    const requestedStore = sp.store?.trim() ?? ""
    storeIds = requestedStore
      ? availableStores.filter((s) => s.id === requestedStore).map((s) => s.id)
      : availableStores.map((s) => s.id)
  } else {
    const { data: myStores, error: storeErr } = await supabase
      .from("vendor_stores")
      .select("id, name")
      .eq("owner_id", user.id)

    if (storeErr || !myStores?.length) {
      redirect("/vendor-panel")
    }
    availableStores = (myStores ?? []) as Array<{ id: string; name: string }>
    storeIds = availableStores.map((s) => s.id)
  }

  const storeNameById = new Map(availableStores.map((s) => [s.id, s.name]))

  const selectWide =
    "id, store_id, order_id, customer_name, customer_email, items_count, total, status, tracking_number, created_at"
  const selectMid =
    "id, store_id, order_id, customer_name, customer_email, items_count, total, status, created_at"
  const selectMin =
    "id, store_id, customer_name, customer_email, items_count, total, status, created_at"

  type VoRow = {
    id: string
    store_id?: string
    order_id?: string | null
    customer_name: string
    customer_email: string
    items_count: number
    total: number
    status: string
    tracking_number?: string | null
    created_at: string
  }

  let items: VoRow[] = []
  if (storeIds.length > 0) {
    for (const sel of [selectWide, selectMid, selectMin]) {
      const { data, error } = await admin
        .from("vendor_orders")
        .select(sel)
        .in("store_id", storeIds)
        .order("created_at", { ascending: false })
      if (!error && data) {
        items = data as VoRow[]
        break
      }
    }
  }

  const parentIds = [...new Set(items.map((r) => r.order_id).filter(Boolean) as string[])]
  let parentById = new Map<string, { customer_id: string | null; order_number: string | null }>()
  if (parentIds.length > 0) {
    const { data: parents } = await admin
      .from("orders")
      .select("id, customer_id, order_number")
      .in("id", parentIds)
    parentById = new Map(
      (parents ?? []).map((p) => {
        const row = p as { id: string; customer_id: string | null; order_number: string | null }
        return [row.id, { customer_id: row.customer_id ?? null, order_number: row.order_number ?? null }]
      }),
    )
  }

  const customerIds = [...new Set(
    items
      .map((o) => {
        const oid = o.order_id
        if (!oid) return null
        return parentById.get(oid)?.customer_id ?? null
      })
      .filter(Boolean) as string[]
  )]

  const scoreMap = Object.fromEntries(
    await Promise.all(
      customerIds.map(async (id) => [id, await getReliabilityScore(id)])
    )
  )

  const ordersWithReliability: OrderRow[] = items.map((o) => {
    const oid = o.order_id ?? null
    const ord = oid ? parentById.get(oid) : undefined
    const customerId = ord?.customer_id ?? null
    return {
      id:              o.id,
      parentOrderId:   oid,
      order_number:    ord?.order_number ?? null,
      store_name:      o.store_id ? (storeNameById.get(o.store_id) ?? null) : null,
      customer_name:  o.customer_name,
      customer_email: o.customer_email,
      items_count:    o.items_count,
      total:          Number(o.total),
      status:         o.status,
      tracking_number: o.tracking_number ?? null,
      created_at:     o.created_at,
      reliability:    customerId ? (scoreMap[customerId] ?? null) : null,
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
        <p className="text-sm text-muted-foreground mt-0.5">
          {items.length} toplam sipariş{isPrivileged ? " (mağaza bazlı yönetim açık)" : ""}
        </p>
      </div>

      {isPrivileged && (
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <form method="get" className="flex flex-wrap items-end gap-3">
              <label className="text-sm space-y-1">
                <span className="text-muted-foreground">Mağaza filtrele</span>
                <select
                  name="store"
                  defaultValue={sp.store ?? ""}
                  className="h-10 min-w-[260px] rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Tüm mağazalar</option>
                  {availableStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Uygula
              </button>
            </form>
          </CardContent>
        </Card>
      )}

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

