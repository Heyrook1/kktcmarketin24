"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { VendorOrderProgress } from "@/components/shared/vendor-order-progress"
import { ThreadChatPanel } from "@/components/shared/thread-chat-panel"
import {
  CheckCircle2, Package, Truck, XCircle, DoorOpen,
  ChevronDown, ShieldCheck, ShieldAlert, ShieldQuestion, Shield,
  AlertTriangle, Loader2,
} from "lucide-react"
import type { ReliabilityScore } from "@/lib/reliability"
import {
  VENDOR_STATUS_COLORS,
  VENDOR_STATUS_LABELS,
  getAllowedNextVendorStatuses,
  normalizeVendorOrderStatus,
  type CanonicalVendorOrderStatus,
} from "@/lib/order-status/vendor-status"

// ── Reliability badge ──────────────────────────────────────────────────────────

const TIER_CONFIG = {
  excellent: { label: "Mükemmel", color: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: ShieldCheck },
  good:      { label: "İyi",      color: "bg-blue-100 text-blue-800 border-blue-200",       icon: ShieldCheck },
  fair:      { label: "Orta",     color: "bg-amber-100 text-amber-800 border-amber-200",    icon: ShieldQuestion },
  poor:      { label: "Düşük",    color: "bg-red-100 text-red-800 border-red-200",          icon: ShieldAlert },
} as const

export function CustomerReliabilityBadge({ score }: { score: ReliabilityScore | null }) {
  if (!score) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium bg-muted/50 text-muted-foreground border-border">
        <Shield className="h-3 w-3" />
        Yeni
      </span>
    )
  }

  const tier = TIER_CONFIG[score.tier]
  const Icon = tier.icon

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium cursor-default ${tier.color}`}>
            <Icon className="h-3 w-3" />
            {score.score}/100 · {tier.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-52 text-xs space-y-1.5 p-3">
          <p className="font-semibold text-sm mb-1">Müşteri Güvenilirlik Skoru</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
            <span>Toplam sipariş</span>      <span className="text-foreground font-medium">{score.totalOrders}</span>
            <span>Teslim edildi</span>       <span className="text-foreground font-medium">{score.successfulDeliveries}</span>
            <span>Kapı reddi</span>          <span className={`font-medium ${score.doorRefusals > 0 ? "text-red-600" : "text-foreground"}`}>{score.doorRefusals}</span>
            <span>Kargo sonrası iptal</span> <span className={`font-medium ${score.cancellationsAfterDispatch > 0 ? "text-amber-600" : "text-foreground"}`}>{score.cancellationsAfterDispatch}</span>
            <span>No-show</span>             <span className={`font-medium ${score.noShowCount > 0 ? "text-amber-600" : "text-foreground"}`}>{score.noShowCount}</span>
          </div>
          {score.secondaryVerificationRequired && (
            <p className="mt-1.5 rounded bg-red-50 border border-red-200 text-red-700 px-2 py-1">
              İkincil doğrulama gerekli
            </p>
          )}
          {score.flaggedAt && (
            <p className="mt-1.5 rounded bg-red-50 border border-red-200 text-red-700 px-2 py-1">
              Hesap işaretlendi
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ── Delivery event menu ────────────────────────────────────────────────────────

interface DeliveryEventMenuProps {
  /** `vendor_orders.id` — local row id for UI updates */
  vendorOrderId: string
  /** Parent `orders.id` — required by delivery-event API */
  parentOrderId: string | null
  onEventRecorded: (vendorOrderId: string, eventType: string) => Promise<void>
}

const EVENT_OPTIONS = [
  { type: "confirmed",               label: "Siparişi Onayla",          icon: CheckCircle2, color: "text-blue-600" },
  { type: "delivered",               label: "Teslim Edildi",             icon: Package,      color: "text-emerald-600" },
  { type: "cancelled_after_dispatch", label: "Kargo Sonrası İptal",      icon: XCircle,      color: "text-amber-600" },
  { type: "door_refused",            label: "Kapıda Ret",                icon: DoorOpen,     color: "text-red-600" },
] as const

export function DeliveryEventMenu({ vendorOrderId, parentOrderId, onEventRecorded }: DeliveryEventMenuProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<typeof EVENT_OPTIONS[number] | null>(null)
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = (event: typeof EVENT_OPTIONS[number]) => {
    setSelectedEvent(event)
    setNotes("")
    setError(null)
    setOpen(false)
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedEvent) return
    setLoading(true)
    setError(null)
    try {
      const endpoint = parentOrderId
        ? `/api/orders/${parentOrderId}/delivery-event`
        : `/api/vendor/orders/${vendorOrderId}/delivery-event`
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: selectedEvent.type, notes }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "İşlem başarısız.")
        return
      }
      setDialogOpen(false)
      await onEventRecorded(vendorOrderId, selectedEvent.type)
    } catch {
      setError("Sunucu hatası. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
            Güncelle <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {EVENT_OPTIONS.map((opt, i) => {
            const Icon = opt.icon
            return (
              <div key={opt.type}>
                {i === 2 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={`gap-2 text-sm cursor-pointer ${opt.color}`}
                  onClick={() => handleSelect(opt)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {opt.label}
                </DropdownMenuItem>
              </div>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvent && <selectedEvent.icon className={`h-5 w-5 ${selectedEvent.color}`} />}
              {selectedEvent?.label}
            </DialogTitle>
            <DialogDescription>
              Bu etkinlik müşterinin güvenilirlik skorunu etkiler.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            {!parentOrderId && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Legacy sipariş satırı algılandı. Sistem ana siparişi otomatik eşleştirerek kaydetmeyi deneyecek.
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="event-notes">Not (isteğe bağlı)</Label>
              <Textarea
                id="event-notes"
                placeholder="Etkinlikle ilgili ek bilgi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)} disabled={loading}>
                Vazgeç
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={loading}>
                {loading ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Kaydediliyor</> : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Fulfillment status (vendor_orders) ───────────────────────────────────────

export type OrderRow = {
  id: string
  /** Parent `orders.id`; null for legacy rows before migration 021 */
  parentOrderId: string | null
  order_number: string | null
  store_name?: string | null
  customer_name: string
  customer_email: string
  items_count: number
  total: number
  status: string
  tracking_number: string | null
  created_at: string
  reliability: ReliabilityScore | null
}

type VendorOrderDetails = {
  id: string
  order_id: string | null
  order_number: string | null
  store_id: string
  store_name: string | null
  status: string
  tracking_number: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  payment_status: string | null
  coupon_code: string | null
  subtotal: number
  shipping_fee: number
  discount_amount: number
  total: number
  created_at: string
  delivery_address: {
    fullName?: string
    phone?: string
    line1?: string
    city?: string
    district?: string
    notes?: string
  } | null
  items: Array<{
    id: string
    product_name: string
    image_url: string | null
    quantity: number
    unit_price: number
    line_total: number
    store_id: string
  }>
  history: Array<{
    id: string
    old_status: string | null
    new_status: string
    notes: string | null
    created_at: string
  }>
}

const ACTION_LABELS: Record<CanonicalVendorOrderStatus, string> = {
  confirmed: "Siparis onaylandi",
  shipped: "Siparis kargoda",
  exchange_requested: "Degisim / iade edildi",
  delivered: "Musteriye teslim edildi",
  cancelled: "Siparis iptal edildi",
}

function VendorOrderStatusMenu({
  row,
  onStatusUpdated,
}: {
  row: OrderRow
  onStatusUpdated: (vendorOrderId: string, newStatus: CanonicalVendorOrderStatus) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [trackDialog, setTrackDialog] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<CanonicalVendorOrderStatus | null>(null)
  const [tracking, setTracking] = useState("")

  const actions = getAllowedNextVendorStatuses(row.status).map((next) => ({
    value: next,
    label: ACTION_LABELS[next],
    needsTracking: next === "shipped",
  }))
  if (actions.length === 0) return null

  async function applyStatus(status: CanonicalVendorOrderStatus, trackingNumber?: string) {
    setLoading(true)
    setErr(null)
    try {
      const res = await fetch(`/api/vendor/orders/${row.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(status === "shipped" && trackingNumber !== undefined ? { trackingNumber } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const payload = data as { error?: string; allowedNext?: string[] }
        const detail =
          payload.allowedNext && payload.allowedNext.length > 0
            ? ` (İzinli: ${payload.allowedNext.join(", ")})`
            : ""
        setErr((payload.error ?? "Güncellenemedi.") + detail)
        return
      }
      await onStatusUpdated(row.id, status)
      setOpen(false)
      setTrackDialog(false)
      setPendingStatus(null)
      setTracking("")
    } catch {
      setErr("Bağlantı hatası.")
    } finally {
      setLoading(false)
    }
  }

  function chooseAction(a: (typeof actions)[number]) {
    setErr(null)
    if (a.needsTracking) {
      setPendingStatus(a.value)
      setTracking("")
      setTrackDialog(true)
      setOpen(false)
      return
    }
    void applyStatus(a.value)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="h-7 gap-1 text-xs">
            Durum <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {actions.map((a) => (
            <DropdownMenuItem
              key={a.value}
              className="text-sm cursor-pointer"
              onClick={() => chooseAction(a)}
            >
              {a.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {err && !trackDialog && (
        <p className="mt-1 max-w-44 text-[11px] leading-tight text-destructive">{err}</p>
      )}

      <Dialog open={trackDialog} onOpenChange={(v) => { setTrackDialog(v); if (!v) setPendingStatus(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Kargoya teslim</DialogTitle>
            <DialogDescription>
              Takip numarası (isteğe bağlı) müşteriye e-posta ile bildirilir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="track-no">Takip numarası</Label>
            <Textarea
              id="track-no"
              rows={2}
              placeholder="Kargo firması takip no..."
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              className="resize-none"
            />
            {err && (
              <p className="text-xs text-destructive">{err}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setTrackDialog(false)}>Vazgeç</Button>
              <Button
                size="sm"
                disabled={loading}
                onClick={() => pendingStatus && applyStatus(pendingStatus, tracking || undefined)}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Orders table ───────────────────────────────────────────────────────────────

export function VendorOrdersTable({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [mounted, setMounted] = useState(false)
  const [orders, setOrders] = useState(initialOrders)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detail, setDetail] = useState<VendorOrderDetails | null>(null)
  const showStoreColumn = orders.some((o) => Boolean(o.store_name))

  async function fetchOrderDetail(vendorOrderId: string): Promise<VendorOrderDetails> {
    const res = await fetch(`/api/vendor/orders/${vendorOrderId}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error((data as { error?: string }).error ?? "Sipariş detayı yüklenemedi.")
    }
    return (data as { order: VendorOrderDetails }).order
  }

  async function refreshOrderRow(vendorOrderId: string): Promise<void> {
    const latest = await fetchOrderDetail(vendorOrderId)
    setOrders((prev) =>
      prev.map((order) =>
        order.id === vendorOrderId
          ? {
              ...order,
              status: latest.status,
              tracking_number: latest.tracking_number,
              total: latest.total,
              customer_name: latest.customer_name,
              customer_email: latest.customer_email,
            }
          : order
      )
    )
    setDetail((prev) => (prev && prev.id === vendorOrderId ? latest : prev))
  }

  const handleEventRecorded = async (vendorOrderId: string, eventType: string) => {
    if (eventType === "delivered" || eventType === "confirmed") {
      const optimisticStatus = eventType as CanonicalVendorOrderStatus
      setOrders((prev) => prev.map((o) => (o.id === vendorOrderId ? { ...o, status: optimisticStatus } : o)))
      setDetail((prev) => (prev && prev.id === vendorOrderId ? { ...prev, status: optimisticStatus } : prev))
    }
    try {
      await refreshOrderRow(vendorOrderId)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Sipariş yenilenemedi.")
    }
  }

  const handleStatusUpdated = async (vendorOrderId: string, newStatus: CanonicalVendorOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === vendorOrderId ? { ...o, status: newStatus } : o))
    )
    setDetail((prev) => (prev && prev.id === vendorOrderId ? { ...prev, status: newStatus } : prev))
    try {
      await refreshOrderRow(vendorOrderId)
    } catch (error) {
      setDetailError(error instanceof Error ? error.message : "Sipariş yenilenemedi.")
    }
  }

  const openDetails = async (vendorOrderId: string) => {
    setDetailOpen(true)
    setSelectedId(vendorOrderId)
    setDetailLoading(true)
    setDetailError(null)
    try {
      const latest = await fetchOrderDetail(vendorOrderId)
      setDetail(latest)
    } catch {
      setDetailError("Bağlantı hatası. Lütfen tekrar deneyin.")
      setDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const selectedRow = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent Radix-generated ID mismatch during hydration in large tables.
  if (!mounted) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Sipariş listesi yükleniyor...
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <Truck className="h-10 w-10 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Henüz sipariş yok.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {[
              "Müşteri",
              ...(showStoreColumn ? ["Mağaza"] : []),
              "Güvenilirlik",
              "Ürün",
              "Tutar",
              "Sipariş no.",
              "Durum",
              "Tarih",
              "İşlem",
            ].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.id}
              className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => void openDetails(order.id)}
            >
              <td className="px-4 py-3">
                <p className="font-medium leading-tight">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">{order.customer_email}</p>
              </td>
              {showStoreColumn && (
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {order.store_name ?? "—"}
                </td>
              )}
              <td className="px-4 py-3">
                <CustomerReliabilityBadge score={order.reliability} />
              </td>
              <td className="px-4 py-3 text-center">{order.items_count}</td>
              <td className="px-4 py-3 font-semibold">₺{Number(order.total).toLocaleString("tr-TR")}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {order.order_number ?? "—"}
                {order.tracking_number && (
                  <span className="block text-[10px] mt-0.5 text-foreground">Takip: {order.tracking_number}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={`text-xs font-medium border-0 ${VENDOR_STATUS_COLORS[normalizeVendorOrderStatus(order.status)]}`}
                >
                  {VENDOR_STATUS_LABELS[normalizeVendorOrderStatus(order.status)]}
                </Badge>
                <div className="mt-2">
                  <VendorOrderProgress status={order.status} compact />
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(order.created_at).toLocaleDateString("tr-TR")}
              </td>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  <VendorOrderStatusMenu row={order} onStatusUpdated={handleStatusUpdated} />
                  <DeliveryEventMenu
                    vendorOrderId={order.id}
                    parentOrderId={order.parentOrderId ?? null}
                    onEventRecorded={handleEventRecorded}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sipariş Detayı</DialogTitle>
            <DialogDescription>
              Mağaza sipariş satırını müşteri sipariş görünümüne benzer şekilde inceleyip yönetebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          {detailLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Detay yükleniyor...
            </div>
          )}

          {!detailLoading && detailError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {detailError}
            </div>
          )}

          {!detailLoading && !detailError && detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Sipariş No</p>
                  <p className="font-medium">{detail.order_number ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Mağaza</p>
                  <p className="font-medium">{detail.store_name ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Durum</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-xs font-medium border-0 ${VENDOR_STATUS_COLORS[normalizeVendorOrderStatus(detail.status)]}`}
                  >
                    {VENDOR_STATUS_LABELS[normalizeVendorOrderStatus(detail.status)]}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-2">Durum ilerlemesi</p>
                <VendorOrderProgress status={detail.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                {selectedRow && <VendorOrderStatusMenu row={selectedRow} onStatusUpdated={handleStatusUpdated} />}
                {selectedRow && (
                  <DeliveryEventMenu
                    vendorOrderId={selectedRow.id}
                    parentOrderId={selectedRow.parentOrderId}
                    onEventRecorded={handleEventRecorded}
                  />
                )}
                <Button size="sm" variant="outline" onClick={() => selectedId && void refreshOrderRow(selectedId)}>
                  Yenile
                </Button>
              </div>

              {selectedRow && (
                <ThreadChatPanel
                  endpoint={`/api/messages/customer-vendor/${selectedRow.id}`}
                  title="Musteri ile Mesajlasma"
                  placeholder="Musteriye mesaj yazin..."
                  emptyText="Bu siparis satirinda henuz mesaj yok."
                />
              )}

              <div className="rounded-lg border p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">Müşteri:</span> {detail.customer_name} ({detail.customer_email})</p>
                {detail.customer_phone && <p><span className="text-muted-foreground">Telefon:</span> {detail.customer_phone}</p>}
                <p><span className="text-muted-foreground">Ödeme:</span> {detail.payment_status ?? "—"}</p>
                <p><span className="text-muted-foreground">Tarih:</span> {new Date(detail.created_at).toLocaleString("tr-TR")}</p>
                {detail.tracking_number && <p><span className="text-muted-foreground">Takip no:</span> {detail.tracking_number}</p>}
              </div>

              {detail.delivery_address && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium mb-1">Teslimat Adresi</p>
                  <p>
                    {detail.delivery_address.fullName ?? detail.customer_name}
                    {detail.delivery_address.phone ? ` · ${detail.delivery_address.phone}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {detail.delivery_address.line1 ?? "—"}
                    {detail.delivery_address.district ? `, ${detail.delivery_address.district}` : ""}
                    {detail.delivery_address.city ? ` / ${detail.delivery_address.city}` : ""}
                  </p>
                  {detail.delivery_address.notes && (
                    <p className="text-muted-foreground mt-1">Not: {detail.delivery_address.notes}</p>
                  )}
                </div>
              )}

              <div className="rounded-lg border p-3">
                <p className="font-medium text-sm mb-2">Ürünler</p>
                <div className="space-y-2">
                  {detail.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} adet × ₺{Number(item.unit_price).toLocaleString("tr-TR")}</p>
                      </div>
                      <p className="font-semibold">₺{Number(item.line_total).toLocaleString("tr-TR")}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground"><span>Ara toplam</span><span>₺{Number(detail.subtotal).toLocaleString("tr-TR")}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Kargo</span><span>₺{Number(detail.shipping_fee).toLocaleString("tr-TR")}</span></div>
                  {detail.discount_amount > 0 && (
                    <div className="flex justify-between text-emerald-700"><span>İndirim</span><span>-₺{Number(detail.discount_amount).toLocaleString("tr-TR")}</span></div>
                  )}
                  <div className="flex justify-between font-semibold"><span>Toplam</span><span>₺{Number(detail.total).toLocaleString("tr-TR")}</span></div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="font-medium text-sm mb-2">İşlem Geçmişi</p>
                {detail.history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Geçmiş kaydı yok.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm">
                    {detail.history.map((h) => (
                      <li key={h.id} className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">
                          {h.old_status ? `${VENDOR_STATUS_LABELS[normalizeVendorOrderStatus(h.old_status)]} → ` : ""}
                          <span className="text-foreground font-medium">
                            {VENDOR_STATUS_LABELS[normalizeVendorOrderStatus(h.new_status)]}
                          </span>
                          {h.notes ? ` — ${h.notes}` : ""}
                        </span>
                        <time className="text-xs text-muted-foreground shrink-0">
                          {new Date(h.created_at).toLocaleString("tr-TR")}
                        </time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
