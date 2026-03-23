"use client"

import { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import {
  Package, Truck, CheckCircle, Clock, XCircle, RefreshCw,
  ChevronDown, ChevronUp, MapPin, Hash, Calendar, RotateCcw,
  AlertTriangle, CornerUpLeft, X, Loader2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "shipped"
  | "delivered" | "cancelled" | "refunded" | "return_requested"

interface DbOrderItem {
  id: string; product_id: string; product_name: string; image_url: string | null
  quantity: number; unit_price: number; line_total: number; store_id: string
}
interface DbStatusHistory {
  id: string; old_status: string | null; new_status: string
  notes: string | null; changed_by: string; created_at: string
}
interface DbSubOrder {
  id: string; store_id: string; store_name: string | null
  step_status: string; subtotal: number
}
interface DbOrder {
  id: string; created_at: string; updated_at: string
  saga_status: string; payment_status: string; coupon_code: string | null
  subtotal: number; shipping_fee: number; discount_amount: number; total: number
  customer_name: string; customer_phone: string | null
  delivery_address: { fullName: string; phone: string; line1: string; city: string; district: string } | null
  order_items: DbOrderItem[]
  order_status_history: DbStatusHistory[]
  order_vendor_sub_orders: DbSubOrder[]
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:          { label: "Beklemede",         color: "bg-amber-100 text-amber-700 border-amber-200",    icon: Clock },
  confirmed:        { label: "Onaylandı",          color: "bg-blue-100 text-blue-700 border-blue-200",       icon: CheckCircle },
  preparing:        { label: "Hazırlanıyor",       color: "bg-purple-100 text-purple-700 border-purple-200", icon: Package },
  shipped:          { label: "Kargoda",            color: "bg-cyan-100 text-cyan-700 border-cyan-200",       icon: Truck },
  delivered:        { label: "Teslim Edildi",      color: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle },
  cancelled:        { label: "İptal Edildi",       color: "bg-red-100 text-red-700 border-red-200",          icon: XCircle },
  refunded:         { label: "İade Edildi",        color: "bg-gray-100 text-gray-700 border-gray-200",       icon: RefreshCw },
  return_requested: { label: "İade Talep Edildi",  color: "bg-orange-100 text-orange-700 border-orange-200", icon: CornerUpLeft },
}

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered"]
const RETURN_REASONS = ["Hasar Var", "Yanlış Ürün", "Beklentiye Uymadı", "Diğer"] as const

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺"
}

function deriveStatus(order: DbOrder): OrderStatus {
  const subStatuses = order.order_vendor_sub_orders.map((s) => s.step_status)
  if (subStatuses.length === 0) return (order.saga_status ?? "pending") as OrderStatus
  if (subStatuses.every((s) => s === "delivered")) return "delivered"
  if (subStatuses.some((s) => s === "shipped"))    return "shipped"
  if (subStatuses.some((s) => s === "preparing"))  return "preparing"
  if (subStatuses.some((s) => s === "confirmed"))  return "confirmed"
  if (subStatuses.every((s) => s === "cancelled")) return "cancelled"
  // Check status history for return_requested
  const hasReturnReq = order.order_status_history?.some(
    (h) => h.new_status === "return_requested",
  )
  if (hasReturnReq) return "return_requested"
  return "pending"
}

function isReturnEligible(order: DbOrder): boolean {
  const status = deriveStatus(order)
  if (status !== "delivered") return false
  const daysDiff = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff <= 14
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ─── Return Request Modal ─────────────────────────────────────────────────────
function ReturnModal({
  order,
  onClose,
  onSuccess,
}: {
  order: DbOrder
  onClose: () => void
  onSuccess: () => void
}) {
  const [reason, setReason]         = useState<string>("")
  const [description, setDesc]      = useState("")
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [submitted, setSubmitted]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason) { setError("Lütfen bir neden seçin."); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/returns", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, reason, description }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Bir hata oluştu."); return }
      setSubmitted(true)
      onSuccess()
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <CornerUpLeft className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">İade Talebi Oluştur</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-secondary transition-colors"
            aria-label="Kapat"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          // ── Success state ─────────────────────────────────────────────────
          <div className="px-5 py-10 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-semibold">İade talebiniz alındı</p>
            <p className="text-sm text-muted-foreground">
              Siparişiniz incelemeye alındı. Satıcı en kısa sürede size dönecektir.
            </p>
            <Button size="sm" variant="outline" onClick={onClose} className="mt-2">
              Kapat
            </Button>
          </div>
        ) : (
          // ── Form ──────────────────────────────────────────────────────────
          <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
            <div className="rounded-lg bg-secondary/50 px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                Sipariş:{" "}
                <span className="font-mono font-medium text-foreground">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </p>
              <p className="text-muted-foreground mt-0.5">
                Toplam: <span className="font-medium text-foreground">{fmt(order.total)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">İade Nedeni *</label>
              <div className="grid grid-cols-2 gap-2">
                {RETURN_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm text-left transition-all",
                      reason === r
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border hover:border-primary/40 hover:bg-secondary/60",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ret-desc">
                Açıklama <span className="text-muted-foreground font-normal">(isteğe bağlı)</span>
              </label>
              <textarea
                id="ret-desc"
                rows={3}
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Durumu kısaca açıklayın..."
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
                Vazgeç
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={loading || !reason}>
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Talebi Gönder
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order, onReturnSuccess }: { order: DbOrder; onReturnSuccess: () => void }) {
  const [expanded, setExpanded]   = useState(false)
  const [showReturn, setShowReturn] = useState(false)

  const status        = deriveStatus(order)
  const cfg           = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const StatusIcon    = cfg.icon
  const progressStep  = STATUS_STEPS.indexOf(status)
  const addr          = order.delivery_address
  const returnOk      = isReturnEligible(order)
  const returnRequested = status === "return_requested"

  return (
    <>
      {showReturn && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturn(false)}
          onSuccess={() => { setShowReturn(false); onReturnSuccess() }}
        />
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <button
          className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm font-mono">{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", cfg.color)}>
              <StatusIcon className="h-3 w-3" />
              {cfg.label}
            </span>
            <span className="font-bold text-sm">{fmt(order.total)}</span>
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t">
            {/* Progress tracker */}
            {!["cancelled", "refunded", "return_requested"].includes(status) && (
              <div className="px-5 py-4 bg-secondary/30">
                <div className="flex items-center gap-0">
                  {STATUS_STEPS.map((s, i) => {
                    const done   = i <= progressStep
                    const active = i === progressStep
                    return (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all",
                            done
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border text-muted-foreground",
                            active && "ring-2 ring-primary/30 ring-offset-1",
                          )}>
                            {done ? <CheckCircle className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                          </div>
                          <span className={cn(
                            "text-[9px] font-medium whitespace-nowrap hidden sm:block",
                            done ? "text-primary" : "text-muted-foreground",
                          )}>
                            {STATUS_CONFIG[s].label}
                          </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={cn(
                            "h-0.5 flex-1 mx-1 rounded transition-all",
                            i < progressStep ? "bg-primary" : "bg-border",
                          )} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div className="px-5 py-4 space-y-3">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden border shrink-0 bg-secondary">
                    {item.image_url ? (
                      <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{item.product_name}</p>
                    <p className="text-xs mt-0.5">{item.quantity} adet × {fmt(item.unit_price)}</p>
                  </div>
                  <p className="font-semibold text-sm shrink-0">{fmt(item.line_total)}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Summary + delivery */}
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                {addr && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      {addr.fullName} · {addr.line1}
                      {addr.district ? `, ${addr.district}` : ""}/{addr.city}
                    </span>
                  </div>
                )}
                {order.coupon_code && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Hash className="h-3.5 w-3.5 shrink-0" />
                    <span>Kupon: <span className="font-mono text-foreground">{order.coupon_code}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>{new Date(order.created_at).toLocaleString("tr-TR")}</span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara toplam</span><span>{fmt(order.subtotal)}</span>
                </div>
                {order.shipping_fee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Kargo</span><span>{fmt(order.shipping_fee)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim{order.coupon_code ? ` (${order.coupon_code})` : ""}</span>
                    <span>-{fmt(order.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Toplam</span><span>{fmt(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Sub-orders (multi-vendor) */}
            {order.order_vendor_sub_orders.length > 1 && (
              <>
                <Separator />
                <div className="px-5 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Satıcı Bazlı Durum
                  </p>
                  {order.order_vendor_sub_orders.map((sub) => {
                    const subCfg = STATUS_CONFIG[sub.step_status as OrderStatus] ?? STATUS_CONFIG.pending
                    const SubIcon = subCfg.icon
                    return (
                      <div key={sub.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {sub.store_name ?? sub.store_id.slice(0, 8)}
                        </span>
                        <span className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                          subCfg.color,
                        )}>
                          <SubIcon className="h-3 w-3" />{subCfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

            {/* Return action area */}
            {(returnOk || returnRequested) && (
              <>
                <Separator />
                <div className="px-5 py-3">
                  {returnRequested ? (
                    <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5">
                      <CornerUpLeft className="h-4 w-4 shrink-0" />
                      <span>İade talebiniz alındı. Satıcı inceleniyor.</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        14 günlük iade hakkınız var. Son tarih:{" "}
                        <span className="font-medium text-foreground">
                          {new Date(
                            new Date(order.created_at).getTime() + 14 * 24 * 60 * 60 * 1000,
                          ).toLocaleDateString("tr-TR")}
                        </span>
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0 border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => setShowReturn(true)}
                      >
                        <CornerUpLeft className="h-3.5 w-3.5" />
                        İade Talebi Oluştur
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function OrderSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function OrdersTab({ userId }: { userId: string }) {
  const { data, error, isLoading, mutate } = useSWR<{ orders: DbOrder[] }>(
    userId ? "/api/orders/my" : null,
    fetcher,
    { revalidateOnFocus: true },
  )

  const [filter, setFilter]       = useState<OrderStatus | "all">("all")
  const [refreshing, setRefreshing] = useState(false)

  const orders   = data?.orders ?? []
  const filtered = filter === "all" ? orders : orders.filter((o) => deriveStatus(o) === filter)

  const handleRefresh = async () => {
    setRefreshing(true)
    await mutate()
    setRefreshing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold">Siparişlerim ({isLoading ? "..." : orders.length})</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleRefresh}
            disabled={isLoading || refreshing}
          >
            <RotateCcw className={cn("h-3.5 w-3.5", (isLoading || refreshing) && "animate-spin")} />
            Yenile
          </Button>
          <select
            className="text-sm border rounded-lg px-3 py-1.5 bg-background"
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
          >
            <option value="all">Tüm Siparişler</option>
            <option value="pending">Beklemede</option>
            <option value="confirmed">Onaylandı</option>
            <option value="preparing">Hazırlanıyor</option>
            <option value="shipped">Kargoda</option>
            <option value="delivered">Teslim Edildi</option>
            <option value="cancelled">İptal Edildi</option>
            <option value="return_requested">İade Talep Edildi</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">Siparişler yüklenemedi. Lütfen yenileyin.</p>
        </div>
      )}

      {isLoading && !data && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <OrderSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && orders.length > 0 && deriveStatus(orders[0]) === "pending" && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-primary">Siparişiniz alındı</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {orders[0].id.slice(0, 8).toUpperCase()} numaralı siparişiniz işleme alındı.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-xl border bg-card py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Henüz siparişiniz bulunmuyor." : "Bu filtreye ait sipariş bulunamadı."}
          </p>
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((order) => (
            <OrderCard key={order.id} order={order} onReturnSuccess={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}
