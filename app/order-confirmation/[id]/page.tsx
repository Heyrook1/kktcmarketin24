import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  CheckCircle2, Package, MapPin, Phone, Banknote,
  Store, ShoppingBag, ArrowRight, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"
import { formatPrice, formatDate } from "@/lib/format"

export const metadata: Metadata = {
  title: "Sipariş Onaylandı | Marketin24",
  description: "Siparişiniz başarıyla alındı",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params

  // Server-side fetch — uses anon/user session; RLS orders_select_own applies
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id,
      created_at,
      customer_name,
      customer_phone,
      delivery_address,
      subtotal,
      shipping_fee,
      discount_amount,
      total,
      saga_status,
      payment_status,
      order_items (
        id,
        product_name,
        quantity,
        unit_price,
        line_total,
        image_url,
        store_id
      ),
      order_vendor_sub_orders (
        id,
        store_id,
        store_name,
        subtotal,
        step_status
      ),
      order_status_history (
        id,
        new_status,
        notes,
        created_at
      )
    `)
    .eq("id", id)
    .single()

  if (!order) notFound()

  const delivery  = order.delivery_address as {
    fullName?: string; phone?: string; line1?: string; city?: string; notes?: string
  } | null

  const subOrders = (order.order_vendor_sub_orders ?? []) as Array<{
    id: string; store_id: string; store_name: string; subtotal: number; step_status: string
  }>

  const items = (order.order_items ?? []) as Array<{
    id: string; product_name: string; quantity: number;
    unit_price: number; line_total: number; image_url: string | null; store_id: string
  }>

  return (
    <div className="min-h-screen bg-secondary/20">
      <div className="container mx-auto px-4 py-10 max-w-4xl">

        {/* Success hero */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 border-4 border-emerald-200">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold md:text-3xl">Siparişiniz Alındı!</h1>
          <p className="text-muted-foreground mt-2 text-pretty">
            Siparişiniz onaylandı. Teslimat sırasında kapıda ödeme yapacaksınız.
          </p>
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
              {delivery?.line1 && (
                <p className="text-muted-foreground">{delivery.line1}</p>
              )}
              {delivery?.city && (
                <p className="text-muted-foreground">{delivery.city}</p>
              )}
              {delivery?.notes && (
                <div className="rounded-lg bg-secondary/60 border px-3 py-2 mt-2">
                  <p className="text-xs text-muted-foreground">Not: {delivery.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* COD payment info */}
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Ödeme Yöntemi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Kapıda Ödeme</span>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-100 border-emerald-200 border text-xs">
                  Onay Bekleniyor
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Kurye ürünlerinizi teslim ettiğinde nakit veya kart ile ödeme yapabilirsiniz.
              </p>
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
                    <span>-{formatPrice(order.discount_amount)}</span>
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

          {/* Items grouped by vendor */}
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
            <CardContent className="space-y-5">
              {subOrders.length > 0
                ? subOrders.map((sub) => {
                    const subItems = items.filter((i) => i.store_id === sub.store_id)
                    return (
                      <div key={sub.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                            <Store className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold">{sub.store_name}</span>
                          <Badge variant="outline" className="ml-auto text-xs">
                            {formatPrice(sub.subtotal)}
                          </Badge>
                        </div>
                        <ul className="space-y-3 pl-9">
                          {subItems.map((item) => (
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
                                <span className="truncate text-muted-foreground">
                                  {item.product_name}
                                </span>
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

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-xl gap-2">
            <Link href="/products">
              Alışverişe Devam Et
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl">
            <Link href="/account">Siparişlerimi Görüntüle</Link>
          </Button>
        </div>

      </div>
    </div>
  )
}
