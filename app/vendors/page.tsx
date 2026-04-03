import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { vendors } from "@/lib/data/vendors"
import { products } from "@/lib/data/products"
import { categories } from "@/lib/data/categories"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, MapPin, CheckCircle, Store, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Satıcılarımız",
  description: "Marketin24'te onaylı satıcılarımızla tanışın. Tüm kategorilerde rekabetçi fiyatlar sunan kaliteli satıcılar.",
}

export default function VendorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Satıcılarımız
          </h1>
          <p className="mt-2 text-muted-foreground">
            Marketin24'te onaylı satıcılardan alışveriş yapın
          </p>
        </div>

        {/* "Satıcı Ol" physical button — top-right of page header */}
        <Button
          asChild
          size="default"
          className="shrink-0 gap-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <Link href="/seller-application">
            <Store className="h-4 w-4" />
            Satıcı Ol
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vendors.map((vendor) => {
          const vendorProducts = products.filter(p => p.vendorId === vendor.id)
          const vendorCategories = vendor.categories
            .map(catId => categories.find(c => c.id === catId))
            .filter(Boolean)
          
          return (
            <Link key={vendor.id} href={`/vendor/${vendor.slug}`}>
              <Card className="group h-full cursor-pointer overflow-hidden transition-all hover:border-primary hover:shadow-lg">
                {/* Cover Image */}
                <div className="relative h-24 bg-gradient-to-r from-primary/20 to-accent/20">
                  {vendor.coverImage && (
                    <Image
                      src={vendor.coverImage}
                      alt={vendor.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                
                <CardContent className="relative pt-0">
                  {/* Logo */}
                  <div className="relative -mt-10 mb-3 flex justify-center">
                    <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-background bg-background shadow-md">
                      {vendor.logo?.trim() ? (
                        <Image
                          src={vendor.logo}
                          alt={vendor.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                          {vendor.name.slice(0, 1)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <h3 className="font-semibold text-foreground">
                        {vendor.name}
                      </h3>
                      {vendor.verified && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{vendor.location}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{vendor.rating}</span>
                      <span className="text-sm text-muted-foreground">
                        ({vendor.reviewCount} değerlendirme)
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {vendor.description}
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {vendorProducts.length} ürün
                      </Badge>
                      {vendorCategories.slice(0, 2).map((category) => (
                        <Badge key={category?.id} variant="outline" className="text-xs">
                          {category?.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
