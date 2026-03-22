import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Package, Truck, ShoppingBag, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Sipariş Onaylandı | KKTC Market",
  description: "Siparişiniz başarıyla alındı.",
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>
}) {
  const { orderId } = await searchParams

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card className="shadow-sm">
        <CardContent className="pt-10 pb-8 px-8">
          {/* Icon */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sipariş Alındı!</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Siparişiniz başarıyla alındı. Kapıda ödeme seçeneğiyle ilerleyecektir.
            </p>
            {orderId && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm">
                <span className="text-muted-foreground">Sipariş No:</span>
                <span className="font-mono font-semibold text-foreground">
                  {orderId.slice(0, 8).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <Separator className="mb-6" />

          {/* Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Sipariş alındı</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Siparişiniz sisteme kaydedildi ve satıcıya iletildi.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary shrink-0">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hazırlanıyor</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Satıcı siparişinizi hazırlayacak.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary shrink-0">
                <Truck className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teslimat ve Ödeme</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ürün kapınıza teslim edildiğinde nakit veya kart ile ödeme yapabilirsiniz.
                </p>
              </div>
            </div>
          </div>

          {/* COD reminder */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 mb-6">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-400">
              <span className="font-semibold">Kapıda Ödeme:</span> Teslimat sırasında nakit veya kart ile ödeme yapabilirsiniz. Sipariş durumunu hesabınızdan takip edebilirsiniz.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="flex-1">
              <Link href="/account?tab=orders">
                <Package className="mr-2 h-4 w-4" />
                Siparişlerimi Gör
              </Link>
            </Button>
            <Button variant="outline" asChild className="flex-1">
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Alışverişe Devam
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
