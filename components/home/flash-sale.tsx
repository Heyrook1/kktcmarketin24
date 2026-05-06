"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Zap, ArrowRight, Clock, ShoppingCart, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCartStore } from "@/lib/store/cart-store"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/data/products"

interface FlashSaleProps {
  products: Product[]
}

function useCountdown() {
  const [time, setTime] = useState({ h: 0, m: 0, s: 0 })

  useEffect(() => {
    const tick = () => {
      const now  = new Date()
      const end  = new Date()
      end.setHours(23, 59, 59, 999)
      const diff = Math.max(0, end.getTime() - now.getTime())
      setTime({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return time
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function FlashProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCartStore()
  const [added, setAdded]     = useState(false)

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  const soldRatio = product.stockCount
    ? Math.min(100, Math.round(((100 - product.stockCount) / 100) * 100))
    : 60

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product)
    openCart()
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col flex-shrink-0 w-[180px] sm:w-[200px] h-full rounded-2xl border bg-card overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-secondary/20">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="200px"
        />
        {discount > 0 && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-sm bg-primary/95">
            <Flame className="h-3 w-3" />
            -%{discount}
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground bg-background px-3 py-1 rounded-full shadow-sm">Tükendi</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-[13px] font-semibold line-clamp-2 leading-snug text-foreground/90">{product.name}</p>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-primary">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through font-medium">{formatPrice(product.originalPrice)}</span>
            )}
          </div>
        </div>

        <div className="space-y-2 mt-auto">
          {/* Stock progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Durum</span>
              <span className="text-[10px] font-bold text-primary">{soldRatio > 80 ? "Sınırlı Stok" : "Satışta"}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  soldRatio > 80 ? "bg-red-500" : "bg-primary"
                )}
                style={{ width: `${soldRatio}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-bold transition-all duration-200 shadow-sm",
              added
                ? "bg-green-500 text-white shadow-green-500/20"
                : product.inStock
                ? "bg-primary/90 text-primary-foreground hover:bg-primary hover:shadow-primary/20 backdrop-blur-sm active:scale-95"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {added ? "Eklendi ✓" : product.inStock ? "Sepete Ekle" : "Tükendi"}
          </button>
        </div>
      </div>
    </Link>
  )
}

export function FlashSaleSection({ products }: FlashSaleProps) {
  const { h, m, s } = useCountdown()

  const flashProducts = products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .slice(0, 8)

  if (flashProducts.length === 0) return null

  return (
    <section className="py-8 md:py-10 border-b bg-gradient-to-b from-primary/5 via-transparent to-transparent">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Badge */}
            <div className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-md shadow-primary/10">
              <Zap className="h-4 w-4 fill-primary-foreground animate-pulse" />
              <span className="font-black text-sm tracking-wide">FLAŞ SATIŞ</span>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-xl shadow-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-semibold hidden md:block">Kalan Süre:</span>
              <div className="flex items-center gap-1">
                {[pad(h), pad(m), pad(s)].map((val, i) => (
                  <div key={i} className="flex items-center gap-1">
                    {i > 0 && <span className="text-muted-foreground font-bold text-sm leading-none">:</span>}
                    <div className="min-w-[32px] h-8 flex items-center justify-center bg-slate-900 dark:bg-slate-800 text-white rounded-md text-sm font-black tabular-nums">
                      {val}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary hover:text-primary hover:bg-primary/10 font-bold gap-1 self-start sm:self-auto rounded-full px-5"
          >
            <Link href="/urunler?sort=price-low">
              Tümünü Gör
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Product strip */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 -mx-4 px-4 snap-x snap-mandatory">
          {flashProducts.map((product) => (
            <div key={product.id} className="snap-start h-full">
              <FlashProductCard product={product} />
            </div>
          ))}

          {/* "See all" card */}
          <Link
            href="/urunler?sort=price-low"
            className="snap-start flex-shrink-0 w-[180px] sm:w-[200px] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 group"
          >
            <div className="h-14 w-14 rounded-full bg-background shadow-md flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-bold text-primary text-center px-4 leading-relaxed">
              Tüm İndirimli<br />Ürünleri Keşfet
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}
