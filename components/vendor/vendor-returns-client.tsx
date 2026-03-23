"use client"

import useSWR, { mutate as globalMutate } from "swr"
import { useState } from "react"
import Image from "next/image"
import {
  CornerUpLeft, CheckCircle, XCircle, Package, Clock,
  ChevronDown, ChevronUp, AlertTriangle, Loader2, Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
type ReturnStatus = "requested" | "approved" | "rejected" | "completed"

interface ReturnOrderItem {
  product_name: string
  quantity: number
  image_url: string | null
  unit_price: number
}
interface ReturnOrder {
  id: string
  customer_name: string
  customer_phone: string | null
  total: number
  order_items: ReturnOrderItem[]
}
interface ReturnRow {
  id: string
  order_id: string
  customer_id: string | null
  reason: string
  description: string | null
  rejection_reason: string | null
  status: ReturnStatus
  created_at: string
  updated_at: string | null
  orders: ReturnOrder | null
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<ReturnStatus, { label: string; color: string; icon: React.ElementType }> = {
  requested: { label: "Talep Edildi", color: "bg-amber-100 text-amber-800 border-amber-200",   icon: Clock },
  approved:  { label: "Onaylandı",   color: "bg-blue-100 text-blue-800 border-blue-200",       icon: CheckCircle },
  rejected:  { label: "Reddedildi",  color: "bg-red-100 text-red-800 border-red-200",           icon: XCircle },
  completed: { label: "Tamamlandı",  color: "bg-green-100 text-green-800 border-green-200",    icon: Truck },
}

function fmt(n: number) {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " ₺"
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({
  returnId,
  onClose,
  onDone,
}: {
  returnId: string
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason]   = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason.trim()) { setError("Red nedeni giriniz."); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/returns/${returnId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: reason }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Hata oluştu."); return }
      onDone()
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
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm border">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <h2 className="font-semibold text-sm">İadeyi Reddet</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="rej-reason">Red Nedeni *</label>
            <textarea
              id="rej-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Müşteriye iletilecek red gerekçesini yazın..."
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
            </div>
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" variant="destructive" className="flex-1 gap-1.5" disabled={loading}>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Reddet
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Return Row Card ──────────────────────────────────────────────────────────
function ReturnCard({ ret, onRefresh }: { ret: ReturnRow; onRefresh: () => void }) {
  const [expanded, setExpanded]       = useState(false)
  const [showReject, setShowReject]   = useState(false)
  const [actionLoading, setActLoading] = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  const cfg     = STATUS_CFG[ret.status]
  const Icon    = cfg.icon
  const order   = ret.orders

  async function doAction(action: "approve" | "complete") {
    setActLoading(action)
    setError(null)
    try {
      const res = await fetch(`/api/returns/${ret.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Hata."); return }
      onRefresh()
    } catch {
      setError("Bağlantı hatası.")
    } finally {
      setActLoading(null)
    }
  }

  return (
    <>
      {showReject && (
        <RejectModal
          returnId={ret.id}
          onClose={() => setShowReject(false)}
          onDone={() => { setShowReject(false); onRefresh() }}
        />
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header row */}
        <button
          className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-secondary/40 transition-colors text-left"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary shrink-0">
              <CornerUpLeft className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm font-mono">
                {ret.order_id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {order?.customer_name ?? "—"} ·{" "}
                {new Date(ret.created_at).toLocaleDateString("tr-TR", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", cfg.color)}>
              <Icon className="h-3 w-3" />{cfg.label}
            </span>
            <span className="text-sm font-bold hidden sm:block">
              {order ? fmt(order.total) : "—"}
            </span>
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {expanded && (
          <div className="border-t">
            {/* Order items */}
            {order?.order_items && order.order_items.length > 0 && (
              <div className="px-5 py-4 space-y-3">
                {order.order_items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border shrink-0 bg-secondary">
                      {item.image_url ? (
                        <Image src={item.image_url} alt={item.product_name} fill className="object-cover" sizes="48px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} adet × {fmt(item.unit_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Return details */}
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Neden</p>
                  <p className="mt-0.5 font-medium">{ret.reason}</p>
                </div>
                {order?.customer_phone && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Telefon</p>
                    <p className="mt-0.5 font-medium">{order.customer_phone}</p>
                  </div>
                )}
              </div>

              {ret.description && (
                <div className="rounded-lg bg-secondary/50 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Müşteri Notu</p>
                  <p className="text-sm">{ret.description}</p>
                </div>
              )}

              {ret.rejection_reason && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                  <p className="text-xs text-red-600 font-medium mb-1">Red Gerekçesi</p>
                  <p className="text-sm text-red-700">{ret.rejection_reason}</p>
                </div>
              )}

              {/* Approved instructions banner */}
              {ret.status === "approved" && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2.5 text-sm text-blue-800">
                  <p className="font-semibold mb-1">Ürün Nasıl İade Edilecek?</p>
                  <p className="text-xs leading-relaxed">
                    Müşteri ürünü orijinal ambalajıyla göndermelidir. Kargo firması ve kargo kodu
                    müşteriye bildirildiğinde "Teslim Aldım" butonuna basabilirsiniz.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="mx-5 mb-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />{error}
              </div>
            )}

            {/* Actions */}
            {ret.status === "requested" && (
              <div className="px-5 pb-4 flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => doAction("approve")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "approve"
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <CheckCircle className="h-3.5 w-3.5" />}
                  Onayla
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  onClick={() => setShowReject(true)}
                  disabled={!!actionLoading}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reddet
                </Button>
              </div>
            )}

            {ret.status === "approved" && (
              <div className="px-5 pb-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => doAction("complete")}
                  disabled={!!actionLoading}
                >
                  {actionLoading === "complete"
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Truck className="h-3.5 w-3.5" />}
                  Teslim Aldım
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ReturnSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function VendorReturnsClient() {
  const { data, error, isLoading, mutate } = useSWR<{ returns: ReturnRow[] }>(
    "/api/vendor/returns",
    fetcher,
    { revalidateOnFocus: true },
  )

  const [filter, setFilter] = useState<ReturnStatus | "all">("all")

  const allReturns = data?.returns ?? []
  const filtered   = filter === "all" ? allReturns : allReturns.filter((r) => r.status === filter)

  const counts = allReturns.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">İadeler</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? "Yükleniyor..." : `${allReturns.length} toplam iade talebi`}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => mutate()} disabled={isLoading}>
          <Loader2 className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Yenile
        </Button>
      </div>

      {/* Status pill filters */}
      <div className="flex flex-wrap gap-2">
        {(["all", "requested", "approved", "rejected", "completed"] as const).map((s) => {
          const count  = s === "all" ? allReturns.length : (counts[s] ?? 0)
          const active = filter === s
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40",
              )}
            >
              {s === "all" ? "Tümü" : STATUS_CFG[s].label}
              <span className={cn("rounded-full px-1.5 py-px text-[10px]", active ? "bg-white/20" : "bg-secondary")}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">İadeler yüklenemedi. Lütfen yenileyin.</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ReturnSkeleton key={i} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="rounded-xl border bg-card py-16 text-center">
          <CornerUpLeft className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            {filter === "all" ? "Henüz iade talebi yok." : "Bu filtreye ait iade bulunamadı."}
          </p>
        </div>
      )}

      {/* List */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((ret) => (
            <ReturnCard key={ret.id} ret={ret} onRefresh={() => mutate()} />
          ))}
        </div>
      )}
    </div>
  )
}
