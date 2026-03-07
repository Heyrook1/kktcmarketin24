"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, BadgeCheck, ExternalLink, Package } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ShareButtons } from "@/components/shared/share-buttons"
import { ProductCard } from "@/components/product/product-card"
import { getVendorById } from "@/lib/data/vendors"
import { getProductsByVendor } from "@/lib/data/products"

interface VendorProfileSheetProps {
  vendorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function VendorProfileSheet({
  vendorId,
  open,
  onOpenChange,
}: VendorProfileSheetProps) {
  const vendor = getVendorById(vendorId)
  const products = getProductsByVendor(vendorId)

  if (!vendor) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <ScrollArea className="flex-1">
          {/* Cover Image */}
          <div className="relative h-32 w-full">
            <Image
              src={vendor.coverImage}
              alt={vendor.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>

          {/* Vendor Info */}
          <div className="px-6 pb-6">
            {/* Logo and Name */}
            <div className="flex items-end gap-4 -mt-10 relative z-10">
              <div className="relative h-20 w-20 rounded-xl overflow-hidden border-4 border-background bg-secondary flex-shrink-0">
                <Image
                  src={vendor.logo}
                  alt={vendor.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg truncate">{vendor.name}</h2>
                  {vendor.verified && (
                    <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{vendor.location}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{vendor.rating}</span>
                <span className="text-sm text-muted-foreground">
                  ({vendor.reviewCount} reviews)
                </span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Package className="h-4 w-4" />
                <span>{vendor.productCount} products</span>
              </div>
            </div>

            {/* Description */}
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {vendor.description}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4">
              <ShareButtons
                url={`/vendor/${vendor.slug}`}
                title={`Check out ${vendor.name} on Marketin24`}
                description={vendor.description}
              />
              <Button asChild variant="outline" size="sm">
                <Link href={`/vendor/${vendor.slug}`} onClick={() => onOpenChange(false)}>
                  View Full Store
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>

            {/* Social Links */}
            {Object.values(vendor.socialLinks).some(Boolean) && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-2">
                  {vendor.socialLinks.instagram && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendor.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </a>
                    </Badge>
                  )}
                  {vendor.socialLinks.facebook && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendor.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Facebook
                      </a>
                    </Badge>
                  )}
                  {vendor.socialLinks.twitter && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendor.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Twitter
                      </a>
                    </Badge>
                  )}
                  {vendor.socialLinks.website && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendor.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Website
                      </a>
                    </Badge>
                  )}
                </div>
              </>
            )}

            {/* Featured Products */}
            <Separator className="my-4" />
            <div>
              <h3 className="font-semibold mb-3">Featured Products</h3>
              <div className="grid grid-cols-2 gap-3">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} onClick={() => onOpenChange(false)}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
              {products.length > 4 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  asChild
                  onClick={() => onOpenChange(false)}
                >
                  <Link href={`/vendor/${vendor.slug}`}>
                    View All {products.length} Products
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
