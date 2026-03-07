import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { vendors } from "@/lib/data/vendors"
import { products } from "@/lib/data/products"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, MapPin, CheckCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "Our Vendors",
  description: "Meet our verified vendors on Marketin24. Quality sellers offering competitive prices across all categories.",
}

export default function VendorsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Our Vendors
        </h1>
        <p className="mt-2 text-muted-foreground">
          Shop from verified sellers on Marketin24
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vendors.map((vendor) => {
          const vendorProducts = products.filter(p => p.vendorId === vendor.id)
          
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
                      <Image
                        src={vendor.logo}
                        alt={vendor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>

                  {/* Vendor Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <h3 className="font-semibold text-foreground">
                        {vendor.name}
                      </h3>
                      {vendor.isVerified && (
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
                        ({vendor.reviewCount} reviews)
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {vendor.description}
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {vendorProducts.length} products
                      </Badge>
                      {vendor.specialties.slice(0, 2).map((specialty) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
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
