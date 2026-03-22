"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import {
  Package, MapPin, Phone, Banknote, Store,
  ShoppingBag, ArrowRight, Clock, MessageCircle, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface Item {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  line_total: number
  image_url: string | null
  store_id: string
}

interface SubOrder {
  id: string
  store_id: string
  store_name: string
  subtotal: number
  step_status: string
}

interface StoreInfo {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
}

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  delivery_address: Record<string, string> | null
  subtotal: number
  shipping_fee: number
  discount_amount: number | null
  total: number
  order_number: string | null
  saga_status: string
  payment_status: string
  order_items: Item[]
  order_vendor_sub_orders: SubOrder[]
}

interface Props {
  order: Order
  storeMap: Record<string, StoreInfo>
  formatPrice: (n: number) => string
  formatDate: (s: string) => string
}

export function OrderConfirmationClient({ order, storeMap, formatPrice, formatDate }: Props) {
  const emailSentRef = useRef(false)

  // Fire email notifications once after mount
  useEffect(() => {
    if (emailSentRef.current) return
    emailSentRef.current = true
    fetch("/api/notifications/order-placed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    }).catch(() => {/* fire-and-forget */})
  }, [order.id])

  const delivery = order.delivery_address as {
    fullName?: string; phone?: string; line1?: string; city?: string; notes?: string
  } | null

  const subOrders = order.order_vendor_sub_orders ?? []
  const items     = order.order_items ?? []
  const orderNum  = order.order_number ?? `MKT-${order.id.slice(0, 8).toUpperCase()}`

  // First vendor WhatsApp / phone for primary CTA
  const firstStore    = subOrders[0] ? storeMap[subOrders[0].store_id] : null
  const whatsappNum   = firstStore?.whatsapp ?? firstStore?.phone ?? null
  const whatsappHref  = whatsappNum
    ? `https://wa.me/${whatsappNum.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Merhaba, ${orderNum} numaralı siparişim hakkında bilgi almak istiyorum.`
      )}`
    : null

  return (
    <div className="min-h-screen bg-secondary/20">

      {/* Inject keyframes for the checkmark animation */}
      <style>{`
        @keyframes check-pop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ring-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.35); }
          70%  { box-shadow: 0 0 0 18px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        .check-pop  { animation: check-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.15s both; }
        .ring-pulse { animation: ring-pulse 1.6s ease-out 0.3s 2; }
      `}</style>

      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* ── Success hero ── */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div
              className="ring-pulse flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 border-4 border-emerald-300"
            >
              {/* Animated SVG checkmark */}
              <svg
                className="check-pop h-12 w-12 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold">Siparişiniz Alındı!</h1>

          <div className="mt-3 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-mono font-semibold text-foreground shadow-sm">
            <Package className="h-4 w-4 text-primary" />
            {orderNum}
          </div>

          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-pretty">
            Siparişiniz onaylandı. Teslimat sırasında kapıda ödeme yapacaksınız.
          </p>

          {/* Estimated delivery callout */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-2 text-sm text-amber-800 dark:text-amber-400 font-medium">
            <Clock className="h-4 w-4 shrink-0" />
            1–3 iş günü içinde teslim edilecektir
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="secondary" className="text-xs px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {formatDate(order.created_at)}
            </Badge>
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1">
              <Banknote className="h-3 w-3 mr-1" />
              Kapıda Ödeme
            </Badge>
            <Badge variant="outline" className="text-xs px-3 py-1">
              <Package className="h-3 w-3 mr-1" />
              Hazırlanıyor
            </Badge>
          </div>
        </div>

        {/* ── Vendor message ── */}
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3 text-sm">
          <Store className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Satıcı siparişinizi en kısa sürede hazırlayacak ve kargolayacaktır.</span>{" "}
            Kargo bilgileriniz SMS ve e-posta ile iletilecektir.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Delivery info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Teslimat Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{delivery?.fullName ?? order.customer_name}</p>
              <p className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {delivery?.phone ?? order.customer_phone}
              </p>
              {delivery?.line1 && <p className="text-muted-foreground">{delivery.line1}</p>}
              {delivery?.city && <p className="text-muted-foreground">{delivery.city}</p>}
              {delivery?.notes && (
                <div className="rounded-lg bg-secondary/60 border px-3 py-2 mt-2">
                  <p className="text-xs text-muted-foreground">Not: {delivery.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment summary */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Ödeme Özeti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Kapıda Ödeme</span>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs">
                  Onay Bekleniyor
                </Badge>
              </div>
              <Separator />
              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Kargo</span>
                  <span className="text-emerald-600 font-medium">Ücretsiz</span>
                </div>
                {(order.discount_amount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>İndirim</span>
                    <span>-{formatPrice(order.discount_amount ?? 0)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Toplam</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order items grouped by vendor */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                Sipariş Detayı
                <Badge variant="secondary" className="ml-auto text-xs">
                  {items.length} ürün
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {subOrders.length > 0
                ? subOrders.map((sub) => {
                    const subItems    = items.filter((i) => i.store_id === sub.store_id)
                    const storeInfo   = storeMap[sub.store_id]
                    const waNum       = storeInfo?.whatsapp ?? storeInfo?.phone ?? null
                    const waLink      = waNum
                      ? `https://wa.me/${waNum.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Merhaba, ${orderNum} numaralı siparişim hakkında bilgi almak istiyorum.`
                        )}`
                      : null

                    return (
                      <div key={sub.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <Store className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold">{sub.store_name}</span>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1 text-xs font-medium text-white hover:bg-[#22c55e] transition-colors"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              Satıcı ile İletişim
                            </a>
                          )}
                        </div>
                        <ul className="space-y-3 pl-9">
                          {subItems.map((item) => (
                            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                {item.image_url
                                  ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.image_url}
                                      alt={item.product_name}
                                      className="h-10 w-10 rounded-lg object-cover border flex-shrink-0"
                                    />
                                  )
                                  : (
                                    <div className="h-10 w-10 rounded-lg bg-secondary border flex-shrink-0 flex items-center justify-center">
                                      <Package className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )
                                }
                                <span className="truncate text-muted-foreground">{item.product_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                <span>{item.quantity} adet</span>
                                <span className="font-semibold text-foreground">{formatPrice(item.line_total)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })
                : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="h-10 w-10 rounded-lg object-cover border flex-shrink-0"
                            />
                          )}
                          <span className="truncate text-muted-foreground">{item.product_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                          <span>{item.quantity} adet</span>
                          <span className="font-semibold text-foreground">{formatPrice(item.line_total)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )
              }
            </CardContent>
          </Card>
        </div>

        {/* ── CTA buttons ── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          {whatsappHref && (
            <Button
              asChild
              size="lg"
              className="rounded-xl gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white"
            >
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                Satıcı ile İletişim
              </a>
            </Button>
          )}
          <Button asChild size="lg" className="rounded-xl gap-2">
            <Link href="/products">
              Alışverişe Devam Et
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl gap-1.5">
            <Link href="/account">
              Siparişlerimi Görüntüle
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  )
}
