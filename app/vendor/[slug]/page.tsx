import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Star, MapPin, BadgeCheck, Package, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductGrid } from "@/components/product/product-grid"
import { ShareButtons } from "@/components/shared/share-buttons"
import { getVendorBySlug, vendors } from "@/lib/data/vendors"
import { getProductsByVendor } from "@/lib/data/products"

interface VendorPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params
  const vendor = getVendorBySlug(slug)

  if (!vendor) {
    return { title: "Vendor Not Found" }
  }

  return {
    title: vendor.name,
    description: vendor.description,
    openGraph: {
      title: `${vendor.name} - Marketin24`,
      description: vendor.description,
      images: [vendor.coverImage],
    },
  }
}

export function generateStaticParams() {
  return vendors.map((vendor) => ({
    slug: vendor.slug,
  }))
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { slug } = await params
  const vendor = getVendorBySlug(slug)

  if (!vendor) {
    notFound()
  }

  const products = getProductsByVendor(vendor.id)

  return (
    <div>
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 w-full">
        <Image
          src={vendor.coverImage}
          alt={vendor.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Vendor Info */}
        <div className="relative -mt-16 md:-mt-20 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-2xl overflow-hidden border-4 border-background bg-secondary flex-shrink-0 shadow-lg">
              <Image
                src={vendor.logo}
                alt={vendor.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Details */}
            <div className="flex-1 pt-2 md:pt-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{vendor.name}</h1>
                    {vendor.verified && (
                      <BadgeCheck className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendor.location}</span>
                  </div>
                </div>

                <ShareButtons
                  url={`/vendor/${vendor.slug}`}
                  title={`Check out ${vendor.name} on Marketin24`}
                  description={vendor.description}
                />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{vendor.rating}</span>
                  <span className="text-muted-foreground">
                    ({vendor.reviewCount} reviews)
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{vendor.productCount} products</span>
                </div>
                <Separator orientation="vertical" className="h-5 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {vendor.joinedDate}</span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                {vendor.description}
              </p>

              {/* Social Links */}
              {Object.values(vendor.socialLinks).some(Boolean) && (
                <div className="flex flex-wrap gap-2 mt-4">
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
              )}
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Products */}
        <section className="pb-12">
          <h2 className="text-2xl font-bold mb-6">All Products ({products.length})</h2>
          <ProductGrid products={products} />
        </section>
      </div>
    </div>
  )
}
