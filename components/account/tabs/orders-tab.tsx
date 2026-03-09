"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Package, Truck, CheckCircle, Clock, XCircle, RefreshCw,
  ChevronDown, ChevronUp, MapPin, Hash, Calendar,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useAccountStore, Order, OrderStatus } from "@/lib/store/account-store"
import { cn } from "@/lib/utils"

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Beklemede",         color: "bg-amber-100 text-amber-700 border-amber-200",   icon: Clock },
  confirmed: { label: "Onaylandi",         color: "bg-blue-100 text-blue-700 border-blue-200",      icon: CheckCircle },
  preparing: { label: "Hazirlaniyor",      color: "bg-purple-100 text-purple-700 border-purple-200",icon: Package },
  shipped:   { label: "Kargoda",           color: "bg-cyan-100 text-cyan-700 border-cyan-200",      icon: Truck },
  delivered: { label: "Teslim Edildi",     color: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle },
  cancelled: { label: "Iptal Edildi",      color: "bg-red-100 text-red-700 border-red-200",         icon: XCircle },
  refunded:  { label: "Iade Edildi",       color: "bg-gray-100 text-gray-700 border-gray-200",      icon: RefreshCw },
}

const STATUS_ORDER: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "delivered"]

function fmt(n: number) {
  return n.toLocaleString("tr-TR") + " ₺"
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[order.status]
  const StatusIcon = cfg.icon

  const progressStep = STATUS_ORDER.indexOf(order.status)

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
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
            <p className="font-semibold text-sm">{order.id}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", cfg.color)}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </span>
          <span className="font-bold text-sm">{fmt(order.total)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t">
          {/* Progress tracker */}
          {!["cancelled", "refunded"].includes(order.status) && (
            <div className="px-5 py-4 bg-secondary/30">
              <div className="flex items-center gap-0">
                {STATUS_ORDER.map((s, i) => {
                  const done = i <= progressStep
                  const active = i === progressStep
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-all",
                          done ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border text-muted-foreground",
                          active && "ring-2 ring-primary/30 ring-offset-1"
                        )}>
                          {done ? <CheckCircle className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                        </div>
                        <span className={cn("text-[9px] font-medium whitespace-nowrap hidden sm:block", done ? "text-primary" : "text-muted-foreground")}>
                          {STATUS_CONFIG[s].label}
                        </span>
                      </div>
                      {i < STATUS_ORDER.length - 1 && (
                        <div className={cn("h-0.5 flex-1 mx-1 rounded transition-all", i < progressStep ? "bg-primary" : "bg-border")} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="px-5 py-4 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="relative h-14 w-14 rounded-lg overflow-hidden border shrink-0 bg-secondary">
                  <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">{item.vendorName}
                    {item.size && ` · Beden: ${item.size}`}
                    {item.color && ` · Renk: ${item.color}`}
                  </p>
                  <p className="text-xs mt-0.5">{item.quantity} adet × {fmt(item.price)}</p>
                </div>
                <p className="font-semibold text-sm shrink-0">{fmt(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Summary + meta */}
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              {order.trackingNumber && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Hash className="h-3.5 w-3.5 shrink-0" />
                  <span>Takip: <span className="font-mono text-foreground">{order.trackingNumber}</span></span>
                </div>
              )}
              {order.estimatedDelivery && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Tahmini teslimat: {new Date(order.estimatedDelivery).toLocaleDateString("tr-TR")}</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{order.deliveryAddress.fullName} · {order.deliveryAddress.line1}, {order.deliveryAddress.district}/{order.deliveryAddress.city}</span>
              </div>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Ara toplam</span><span>{fmt(order.subtotal)}</span></div>
              {order.shippingFee > 0 && <div className="flex justify-between text-muted-foreground"><span>Kargo</span><span>{fmt(order.shippingFee)}</span></div>}
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Indirim {order.couponCode && `(${order.couponCode})`}</span><span>-{fmt(order.discount)}</span></div>}
              <Separator />
              <div className="flex justify-between font-bold"><span>Toplam</span><span>{fmt(order.total)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function OrdersTab() {
  const { orders } = useAccountStore()
  const [filter, setFilter] = useState<OrderStatus | "all">("all")

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Siparislerin ({orders.length})</h2>
        <select
          className="text-sm border rounded-lg px-3 py-1.5 bg-background"
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
        >
          <option value="all">Tum Siparisler</option>
          <option value="pending">Beklemede</option>
          <option value="confirmed">Onaylandi</option>
          <option value="preparing">Hazirlaniyor</option>
          <option value="shipped">Kargoda</option>
          <option value="delivered">Teslim Edildi</option>
          <option value="cancelled">Iptal Edildi</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Bu filtreye ait siparis bulunamadi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  )
}
