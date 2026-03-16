"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  CheckCircle2, Package, Truck, XCircle, DoorOpen,
  ChevronDown, ShieldCheck, ShieldAlert, ShieldQuestion, Shield,
  AlertTriangle, Loader2,
} from "lucide-react"
import type { ReliabilityScore } from "@/lib/reliability"

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
  orderId: string
  onEventRecorded: (orderId: string, eventType: string) => void
}

const EVENT_OPTIONS = [
  { type: "confirmed",               label: "Siparişi Onayla",          icon: CheckCircle2, color: "text-blue-600" },
  { type: "delivered",               label: "Teslim Edildi",             icon: Package,      color: "text-emerald-600" },
  { type: "cancelled_after_dispatch", label: "Kargo Sonrası İptal",      icon: XCircle,      color: "text-amber-600" },
  { type: "door_refused",            label: "Kapıda Ret",                icon: DoorOpen,     color: "text-red-600" },
] as const

export function DeliveryEventMenu({ orderId, onEventRecorded }: DeliveryEventMenuProps) {
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
      const res = await fetch(`/api/orders/${orderId}/delivery-event`, {
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
      onEventRecorded(orderId, selectedEvent.type)
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

// ── Orders table ───────────────────────────────────────────────────────────────

export type OrderRow = {
  id: string
  customer_name: string
  customer_email: string
  items_count: number
  total: number
  status: string
  created_at: string
  reliability: ReliabilityScore | null
}

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

export function VendorOrdersTable({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState(initialOrders)

  const handleEventRecorded = (orderId: string, eventType: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: eventType === "delivered" ? "delivered" : eventType === "confirmed" ? "confirmed" : o.status }
          : o
      )
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            {["Müşteri", "Güvenilirlik", "Ürün", "Tutar", "Durum", "Tarih", "İşlem"].map((h) => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium leading-tight">{order.customer_name}</p>
                <p className="text-xs text-muted-foreground">{order.customer_email}</p>
              </td>
              <td className="px-4 py-3">
                <CustomerReliabilityBadge score={order.reliability} />
              </td>
              <td className="px-4 py-3 text-center">{order.items_count}</td>
              <td className="px-4 py-3 font-semibold">₺{Number(order.total).toLocaleString("tr-TR")}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className={`text-xs font-medium border-0 ${STATUS_COLORS[order.status] ?? "bg-muted text-muted-foreground"}`}>
                  {STATUS_LABELS[order.status] ?? order.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(order.created_at).toLocaleDateString("tr-TR")}
              </td>
              <td className="px-4 py-3">
                <DeliveryEventMenu orderId={order.id} onEventRecorded={handleEventRecorded} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
