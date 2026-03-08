"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import {
  Star, MapPin, BadgeCheck, ExternalLink, Package,
  AlertTriangle, MessageSquare, ShoppingBag, Calendar,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ShareButtons } from "@/components/shared/share-buttons"
import { EnhancedProductCard } from "@/components/product/enhanced-product-card"
import { getVendorById } from "@/lib/data/vendors"
import { getProductsByVendor } from "@/lib/data/products"
import { getVendorReviews, getVendorAverageRating } from "@/lib/data/vendor-reviews"
import { cn } from "@/lib/utils"

interface VendorProfileSheetProps {
  vendorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VendorProfileSheet({ vendorId, open, onOpenChange }: VendorProfileSheetProps) {
  const vendor = getVendorById(vendorId)
  const products = getProductsByVendor(vendorId)
  const vendorReviews = getVendorReviews(vendorId)
  const avgRating = getVendorAverageRating(vendorId) || vendor?.rating || 0
  const [helpfulSet, setHelpfulSet] = useState<Set<string>>(new Set())

  if (!vendor) return null

  const hasNoProducts = products.length === 0

  const ratingDistribution = [5, 4, 3, 2, 1].map((r) => {
    const count = vendorReviews.filter((rev) => Math.floor(rev.rating) === r).length
    return { rating: r, count, percentage: vendorReviews.length > 0 ? (count / vendorReviews.length) * 100 : 0 }
  })

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric" })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <ScrollArea className="flex-1 relative">
          {/* Cover */}
          <div className="relative h-36 w-full overflow-hidden">
            <Image src={vendor.coverImage} alt={vendor.name} fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          </div>

          <div className="px-5 pb-6">
            {/* Logo + name row */}
            <div className="flex items-end gap-4 -mt-10 relative z-10 mb-4">
              <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-4 border-background bg-secondary flex-shrink-0 shadow-lg">
                <Image src={vendor.logo} alt={vendor.name} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <SheetTitle className="font-bold text-lg leading-tight">{vendor.name}</SheetTitle>
                  {vendor.verified && <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{vendor.location}</span>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-sm">{vendor.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-0.5">{vendor.reviewCount} yorum</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
                <div className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 text-primary" />
                  <span className="font-bold text-sm">{vendor.productCount}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-0.5">Ürün</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/50 text-center">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="font-bold text-sm">{vendor.joinedDate.slice(0, 7)}</span>
                </div>
                <span className="text-xs text-muted-foreground mt-0.5">Katılım</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{vendor.description}</p>

            {/* Social links */}
            {Object.values(vendor.socialLinks).some(Boolean) && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {vendor.socialLinks.instagram && (
                  <Badge variant="secondary" className="cursor-pointer" asChild>
                    <a href={vendor.socialLinks.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                  </Badge>
                )}
                {vendor.socialLinks.facebook && (
                  <Badge variant="secondary" className="cursor-pointer" asChild>
                    <a href={vendor.socialLinks.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                  </Badge>
                )}
                {vendor.socialLinks.website && (
                  <Badge variant="secondary" className="cursor-pointer" asChild>
                    <a href={vendor.socialLinks.website} target="_blank" rel="noopener noreferrer">Website</a>
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mb-5">
              <Button asChild className="flex-1 gap-1.5 rounded-xl">
                <Link href={`/vendor/${vendor.slug}`} onClick={() => onOpenChange(false)}>
                  <ExternalLink className="h-4 w-4" />
                  Mağazayı Gör
                </Link>
              </Button>
              <ShareButtons
                url={`/vendor/${vendor.slug}`}
                title={`${vendor.name} mağazasına göz at`}
                description={vendor.description}
              />
            </div>

            <Separator className="mb-4" />

            {/* Tabs: Products / Reviews */}
            <Tabs defaultValue="products">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="products" className="flex-1 gap-1.5">
                  <ShoppingBag className="h-4 w-4" />
                  Ürünler ({products.length})
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1 gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Yorumlar ({vendorReviews.length})
                </TabsTrigger>
              </TabsList>

              {/* Products tab */}
              <TabsContent value="products">
                {hasNoProducts ? (
                  <div className="flex flex-col items-center gap-3 py-10 px-4 text-center rounded-2xl border border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-10 w-10 text-amber-400" />
                    <div>
                      <p className="font-semibold text-amber-800">Bu satıcının şu an aktif ürünü yok</p>
                      <p className="text-sm text-amber-600 mt-1">Yeni ürünler için satıcı sayfasını takip edebilirsiniz.</p>
                    </div>
                    <Button variant="outline" asChild size="sm">
                      <Link href={`/vendor/${vendor.slug}`} onClick={() => onOpenChange(false)}>
                        Mağazayı ziyaret et
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {products.slice(0, 4).map((product) => (
                      <div key={product.id} onClick={() => onOpenChange(false)}>
                        <EnhancedProductCard product={product} showReviews={false} showSizes={false} showStock />
                      </div>
                    ))}
                  </div>
                )}
                {products.length > 4 && (
                  <Button variant="outline" className="w-full mt-3 rounded-xl" asChild onClick={() => onOpenChange(false)}>
                    <Link href={`/vendor/${vendor.slug}`}>
                      Tüm {products.length} ürünü gör
                    </Link>
                  </Button>
                )}
              </TabsContent>

              {/* Reviews tab */}
              <TabsContent value="reviews">
                {vendorReviews.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Star className="h-10 w-10 text-muted-foreground/30" />
                    <p className="font-medium text-muted-foreground">Henüz değerlendirme yok</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Rating summary */}
                    <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl border">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
                        <div className="flex items-center gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={cn("h-3.5 w-3.5", s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{vendorReviews.length} yorum</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {ratingDistribution.map(({ rating, count, percentage }) => (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="text-xs w-3">{rating}</span>
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <Progress value={percentage} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground w-4 text-right">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review cards */}
                    {vendorReviews.map((rev) => (
                      <div key={rev.id} className="p-4 rounded-xl border bg-card">
                        <div className="flex items-start gap-3">
                          <div className="relative h-9 w-9 rounded-full overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-border">
                            {rev.userAvatar ? (
                              <Image src={rev.userAvatar} alt={rev.userName} fill className="object-cover" sizes="36px" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-muted-foreground">
                                {rev.userName[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm">{rev.userName}</span>
                              {rev.verified && (
                                <Badge variant="secondary" className="text-xs gap-1 py-0">
                                  <BadgeCheck className="h-3 w-3 text-green-600" />
                                  Onaylı
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={cn("h-3 w-3", s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                              ))}
                              <span className="text-xs text-muted-foreground">{formatDate(rev.date)}</span>
                            </div>
                            {rev.title && <p className="font-semibold text-sm mt-1.5">{rev.title}</p>}
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rev.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
