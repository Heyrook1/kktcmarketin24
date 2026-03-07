import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been successfully placed",
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="pt-8 pb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>

          <div className="bg-secondary/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-3 text-sm">
              <Package className="h-5 w-5 text-primary" />
              <span>
                You will receive an email confirmation with tracking details shortly.
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/products">
                Continue Shopping
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
