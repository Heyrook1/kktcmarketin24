"use client"

import { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import {
  Package, Truck, CheckCircle, Clock, XCircle, RefreshCw,
  ChevronDown, ChevronUp, MapPin, Hash, Calendar, RotateCcw,
  AlertTriangle, CornerUpLeft, X, Loader2, Pencil, Ban,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus =
  | "pending" | "confirmed" | "preparing" | "shipped" | "exchange_requested"
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
interface DbVendorFulfillment {
  id: string
  store_id: string
  status: string
  tracking_number: string | null
  vendor_stores: { name: string } | null
}
interface DbOrder {
  id: string
  order_number: string | null
  created_at: string; updated_at: string
  saga_status: string; payment_status: string; coupon_code: string | null
  subtotal: number; shipping_fee: number; discount_amount: number; total: number
  customer_name: string; customer_phone: string | null
  delivery_address: {
    fullName: string; phone: string; line1: string; city: string; district: string; notes?: string
  } | null
  order_items: DbOrderItem[]
  order_status_history: DbStatusHistory[]
  order_vendor_sub_orders: DbSubOrder[]
  vendor_orders?: DbVendorFulfillment[] | null
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:            { label: "Beklemede",              color: "bg-amber-100 text-amber-700 border-amber-200",    icon: Clock },
  confirmed:          { label: "Sipariş onaylandı",      color: "bg-blue-100 text-blue-700 border-blue-200",       icon: CheckCircle },
  preparing:          { label: "Hazırlanıyor",           color: "bg-purple-100 text-purple-700 border-purple-200", icon: Package },
  shipped:            { label: "Kargoya teslim edildi",   color: "bg-cyan-100 text-cyan-700 border-cyan-200",       icon: Truck },
  exchange_requested: { label: "Değişim talep edildi",   color: "bg-orange-100 text-orange-700 border-orange-200", icon: RefreshCw },
  delivered:          { label: "Teslim alındı",          color: "bg-green-100 text-green-700 border-green-200",    icon: CheckCircle },
  cancelled:          { label: "İptal Edildi",           color: "bg-red-100 text-red-700 border-red-200",          icon: XCircle },
  refunded:           { label: "İade Edildi",            color: "bg-gray-100 text-gray-700 border-gray-200",       icon: RefreshCw },
  return_requested:   { label: "İade Talep Edildi",      color: "bg-orange-100 text-orange-700 border-orange-200", icon: CornerUpLeft },
}

/** Satıcı durum akışı ile uyumlu ilerleme adımları */
const STATUS_STEPS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "shipped",
  "exchange_requested",
  "delivered",
]
const RETURN_REASONS = ["Hasar Var", "Yanlış Ürün", "Beklentiye Uymadı", "Diğer"] as const

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺"
}

function deriveStatus(order: DbOrder): OrderStatus {
  const hasReturnReq = order.order_status_history?.some(
    (h) => h.new_status === "return_requested",
  )
  if (hasReturnReq) return "return_requested"

  const vos = order.vendor_orders
  if (vos && vos.length > 0) {
    if (vos.some((v) => v.status === "cancelled")) return "cancelled"
    if (vos.some((v) => v.status === "refunded")) return "refunded"
    const rank: Record<string, number> = {
      pending: 0,
      confirmed: 1,
      preparing: 2,
      shipped: 3,
      exchange_requested: 4,
      delivered: 5,
    }
    const minRank = Math.min(...vos.map((v) => rank[v.status] ?? 0))
    const byRank: OrderStatus[] = [
      "pending",
      "confirmed",
      "preparing",
      "shipped",
      "exchange_requested",
      "delivered",
    ]
    return byRank[minRank] ?? "pending"
  }

  if (order.order_status_history?.some((h) => h.new_status === "cancelled")) {
    return "cancelled"
  }

  const subStatuses = order.order_vendor_sub_orders.map((s) => s.step_status)
  if (subStatuses.length === 0) return "pending"
  if (subStatuses.every((s) => s === "completed" || s === "delivered")) return "delivered"
  return "pending"
}

function isReturnEligible(order: DbOrder): boolean {
  const status = deriveStatus(order)
  if (status !== "delivered") return false
  const daysDiff = (Date.now() - new Date(order.created_at).getTime()) / (1000 * 60 * 60 * 24)
  return daysDiff <= 14
}

/** Satıcı onayı beklenirken (tüm vendor satırları pending) müşteri düzenleyebilir / iptal edebilir */
function canCustomerModifyOrder(order: DbOrder): boolean {
  const st = deriveStatus(order)
  if (st === "cancelled" || st === "refunded") return false
  const vos = order.vendor_orders
  if (vos && vos.length > 0) {
    return vos.every((v) => v.status === "pending")
  }
  return st === "pending"
}

const EDIT_CITIES = [
  "Lefkoşa", "Girne", "Gazimağusa", "Güzelyurt", "İskele", "Lefke", "Diğer",
] as const

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

function EditOrderModal({
  order,
  onClose,
  onSuccess,
}: {
  order: DbOrder
  onClose: () => void
  onSuccess: () => void
}) {
  const a = order.delivery_address
  const [fullName, setFullName]     = useState(a?.fullName ?? "")
  const [phone, setPhone]           = useState(a?.phone ?? "")
  const [line1, setLine1]           = useState(a?.line1 ?? "")
  const [city, setCity]             = useState(a?.city ?? "Lefkoşa")
  const [district, setDistrict]     = useState(a?.district ?? "")
  const [notes, setNotes]           = useState(a?.notes ?? "")
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${order.id}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          line1: line1.trim(),
          city,
          district: district.trim(),
          notes: notes.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Güncellenemedi.")
        return
      }
      onSuccess()
      onClose()
    } catch {
      setError("Bağlantı hatası.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Teslimat adresini düzenle</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-secondary transition-colors"
            aria-label="Kapat"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Satıcı onayından önce adresinizi güncelleyebilirsiniz.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="eo-name">Ad Soyad</Label>
            <Input id="eo-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eo-phone">Telefon</Label>
            <Input id="eo-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required minLength={7} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eo-line1">Adres satırı</Label>
            <Input id="eo-line1" value={line1} onChange={(e) => setLine1(e.target.value)} required minLength={5} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eo-city">Şehir</Label>
              <select
                id="eo-city"
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {EDIT_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eo-dist">Semt</Label>
              <Input id="eo-dist" value={district} onChange={(e) => setDistrict(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="eo-notes">Not (isteğe bağlı)</Label>
            <textarea
              id="eo-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              maxLength={500}
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
            <Button type="submit" className="flex-1 gap-2" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── OrderCard ────────────────────────────────────────────────────────────────
function OrderCard({ order, onReturnSuccess }: { order: DbOrder; onReturnSuccess: () => void }) {
  const [expanded, setExpanded]   = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [showEdit, setShowEdit]     = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const status        = deriveStatus(order)
  const cfg           = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const StatusIcon    = cfg.icon
  const progressStep  = Math.max(0, STATUS_STEPS.indexOf(status))
  const addr          = order.delivery_address
  const returnOk      = isReturnEligible(order)
  const returnRequested = status === "return_requested"
  const canModify     = canCustomerModifyOrder(order)

  async function handleCancelOrder() {
    if (!canModify) return
    if (!window.confirm("Bu siparişi iptal etmek istediğinize emin misiniz?")) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        window.alert(typeof data.error === "string" ? data.error : "İptal edilemedi.")
        return
      }
      onReturnSuccess()
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      {showReturn && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturn(false)}
          onSuccess={() => { setShowReturn(false); onReturnSuccess() }}
        />
      )}
      {showEdit && (
        <EditOrderModal
          order={order}
          onClose={() => setShowEdit(false)}
          onSuccess={onReturnSuccess}
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
              <p className="font-semibold text-sm font-mono">
                {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
              </p>
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
                {status === "pending" && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Siparişiniz satıcı onayı bekliyor. Satıcı onayladığında bu sipariş için bildirim ve durum güncellemesi alırsınız.
                  </div>
                )}
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

            {canModify && (
              <>
                <Separator />
                <div className="px-5 py-3 flex flex-wrap gap-2 items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Satıcı onayından önce adresi düzenleyebilir veya siparişi iptal edebilirsiniz.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setShowEdit(true)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                    >
                      {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                      İptal
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Durum geçmişi (satıcı güncellemeleri) */}
            {(order.order_status_history?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div className="px-5 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    İşlem geçmişi
                  </p>
                  <ul className="space-y-1.5 text-xs">
                    {order.order_status_history
                      .slice()
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((h) => (
                        <li key={h.id} className="flex justify-between gap-3 text-muted-foreground">
                          <span>
                            {h.old_status ? `${h.old_status} → ` : ""}
                            <span className="text-foreground font-medium">{h.new_status}</span>
                            {h.notes ? ` — ${h.notes}` : ""}
                          </span>
                          <time className="shrink-0 tabular-nums">
                            {new Date(h.created_at).toLocaleString("tr-TR")}
                          </time>
                        </li>
                      ))}
                  </ul>
                </div>
              </>
            )}

            {/* Satıcı bazlı durum + takip */}
            {(order.vendor_orders?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div className="px-5 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Satıcı Bazlı Durum
                  </p>
                  {order.vendor_orders!.map((v) => {
                    const label = v.vendor_stores?.name ?? v.store_id.slice(0, 8)
                    const st = v.status as OrderStatus
                    const subCfg = STATUS_CONFIG[st] ?? STATUS_CONFIG.pending
                    const SubIcon = subCfg.icon
                    return (
                      <div key={v.id} className="flex flex-col gap-0.5 text-sm border rounded-lg px-3 py-2 bg-muted/20">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground font-medium">{label}</span>
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                            subCfg.color,
                          )}>
                            <SubIcon className="h-3 w-3" />{subCfg.label}
                          </span>
                        </div>
                        {v.tracking_number && (
                          <p className="text-xs text-muted-foreground">
                            Takip no: <span className="font-mono text-foreground">{v.tracking_number}</span>
                          </p>
                        )}
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
            <option value="confirmed">Sipariş onaylandı</option>
            <option value="preparing">Hazırlanıyor</option>
            <option value="shipped">Kargoya teslim edildi</option>
            <option value="exchange_requested">Değişim talep edildi</option>
            <option value="delivered">Teslim alındı</option>
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
