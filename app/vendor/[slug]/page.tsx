import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Star, MapPin, BadgeCheck, Package, Calendar, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductGrid } from "@/components/product/product-grid"
import { ReviewsSection } from "@/components/shared/reviews-section"
import { ShareButtons } from "@/components/shared/share-buttons"
import { getVendorBySlug, vendors } from "@/lib/data/vendors"
import { getProductsByVendor } from "@/lib/data/products"
import { getVendorReviews, getVendorAverageRating } from "@/lib/data/vendor-reviews"
import { createClient } from "@/lib/supabase/server"
import type { Product } from "@/lib/data/products"
import { normalizeCat } from "@/lib/normalize-product-category"

interface VendorPageProps {
  params: Promise<{ slug: string }>
}

export const dynamicParams = true

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params
  const vendor = getVendorBySlug(slug)

  if (!vendor) {
    const supabase = await createClient()
    const { data: storeRaw } = await supabase
      .from("vendor_stores")
      .select("name, description, cover_url")
      .eq("slug", slug)
      .maybeSingle()

    if (!storeRaw) return { title: "Vendor Not Found" }

    return {
      title: `${storeRaw.name} - Marketin24`,
      description: storeRaw.description ?? undefined,
      openGraph: {
        title: storeRaw.name,
        description: storeRaw.description ?? undefined,
        images: storeRaw.cover_url ? [storeRaw.cover_url] : [],
      },
    }
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
  const staticVendor = getVendorBySlug(slug)

  const toDbProduct = (p: {
    id: string
    name: string
    description: string | null
    price: number
    compare_price: number | null
    category: string | null
    image_url: string | null
    images: string[] | null
    tags: string[] | null
    stock: number | null
    created_at: string
    store_id: string
  }): Product => {
    const dbImages: string[] = p.images?.length ? p.images : []
    const allImages =
      dbImages.length > 0
        ? dbImages
        : p.image_url
          ? [p.image_url]
          : ["/placeholder.jpg"]

    return {
      id: p.id,
      name: p.name,
      slug: p.id,
      description: p.description ?? "",
      price: Number(p.price),
      originalPrice: p.compare_price ? Number(p.compare_price) : undefined,
      images: allImages,
      categoryId: normalizeCat(p.category),
      vendorId: p.store_id,
      rating: 0,
      reviewCount: 0,
      inStock: (p.stock ?? 0) > 0,
      stockCount: p.stock ?? 0,
      tags: p.tags ?? [],
      featured: false,
      createdAt: p.created_at,
    }
  }

  type ReviewForUi = {
    id: string
    userName: string
    userAvatar?: string
    rating: number
    title: string
    comment: string
    date: string
    verified: boolean
    helpful: number
    images?: string[]
    vendorReply?: any
  }

  let products: Product[] = []
  let vendorReviews: ReviewForUi[] = []
  let vendorAvgRating = 0
  let vendorReviewCount = 0
  let vendorProductCount = 0

  let vendorForUi =
    (staticVendor
      ? (() => {
          const staticProducts = getProductsByVendor(staticVendor.id)
          const staticReviewsRaw = getVendorReviews(staticVendor.id)
          const staticReviews: ReviewForUi[] = staticReviewsRaw.map((r) => ({
            id: r.id,
            userName: r.userName,
            userAvatar: r.userAvatar,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            date: r.date,
            verified: r.verified,
            helpful: r.helpful,
          }))

          products = staticProducts
          vendorReviews = staticReviews
          vendorReviewCount = staticReviews.length
          vendorProductCount = staticProducts.length
          vendorAvgRating = getVendorAverageRating(staticVendor.id) || staticVendor.rating

          return {
            ...(staticVendor as any),
            rating: vendorAvgRating,
            reviewCount: vendorReviewCount,
            productCount: vendorProductCount,
          }
        })()
      : null) as any

  if (!vendorForUi) {
    const supabase = await createClient()

    const { data: storeRaw } = await supabase
      .from("vendor_stores")
      .select("id, name, slug, description, logo_url, cover_url, location, is_active, is_verified, created_at")
      .eq("slug", slug)
      .maybeSingle()

    if (!storeRaw) notFound()

    const [{ data: productsRaw }, { data: reviewsRaw }] = await Promise.all([
      supabase
        .from("vendor_products")
        .select(
          "id, name, description, price, compare_price, category, image_url, images, tags, stock, created_at, store_id",
        )
        .eq("store_id", storeRaw.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("vendor_reviews")
        .select("id, reviewer_name, rating, comment, is_published, created_at")
        .eq("store_id", storeRaw.id)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    const safeProducts = (productsRaw ?? []).map((r) => toDbProduct(r as any))
    products = safeProducts
    vendorProductCount = safeProducts.length

    const safeReviews: ReviewForUi[] = (reviewsRaw ?? []).map((r) => ({
      id: r.id,
      userName: r.reviewer_name,
      rating: r.rating,
      title: "",
      comment: r.comment ?? "",
      date: r.created_at,
      verified: true,
      helpful: 0,
    }))
    vendorReviews = safeReviews
    vendorReviewCount = safeReviews.length

    vendorAvgRating =
      vendorReviewCount === 0
        ? 0
        : Math.round((safeReviews.reduce((s, rev) => s + rev.rating, 0) / vendorReviewCount) * 10) / 10

    const joinedDate = storeRaw.created_at ? String(storeRaw.created_at).slice(0, 7) : ""

    vendorForUi = {
      id: storeRaw.id,
      name: storeRaw.name,
      slug: storeRaw.slug,
      description: storeRaw.description ?? "",
      logo: storeRaw.logo_url ?? "",
      coverImage: storeRaw.cover_url ?? "",
      rating: vendorAvgRating,
      joinedDate,
      location: storeRaw.location ?? "",
      categories: [],
      socialLinks: {},
      verified: storeRaw.is_verified,
      productCount: vendorProductCount,
      reviewCount: vendorReviewCount,
    } as any
  }

  return (
    <div>
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 w-full">
        {vendorForUi.coverImage?.trim() ? (
          <Image
            src={vendorForUi.coverImage}
            alt={vendorForUi.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-muted to-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4">
        {/* Vendor Info */}
        <div className="relative -mt-16 md:-mt-20 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="relative h-28 w-28 md:h-36 md:w-36 rounded-2xl overflow-hidden border-4 border-background bg-secondary flex-shrink-0 shadow-lg">
              {vendorForUi.logo?.trim() ? (
                <Image
                  src={vendorForUi.logo}
                  alt={vendorForUi.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-muted-foreground">
                  {vendorForUi.name.slice(0, 1)}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 pt-2 md:pt-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{vendorForUi.name}</h1>
                    {vendorForUi.verified && (
                      <BadgeCheck className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{vendorForUi.location}</span>
                  </div>
                </div>

                <ShareButtons
                  url={`/vendor/${vendorForUi.slug}`}
                  title={`Check out ${vendorForUi.name} on Marketin24`}
                  description={vendorForUi.description}
                />
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
                <div className="flex items-center gap-1.5">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{vendorForUi.rating}</span>
                  <span className="text-muted-foreground">
                    ({vendorReviewCount} reviews)
                  </span>
                </div>
                <Separator orientation="vertical" className="h-5 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{vendorProductCount} products</span>
                </div>
                <Separator orientation="vertical" className="h-5 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {vendorForUi.joinedDate}</span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-4 text-muted-foreground leading-relaxed max-w-2xl">
                {vendorForUi.description}
              </p>

              {/* Social Links */}
              {Object.values(vendorForUi.socialLinks).some(Boolean) && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {vendorForUi.socialLinks.instagram && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendorForUi.socialLinks.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Instagram
                      </a>
                    </Badge>
                  )}
                  {vendorForUi.socialLinks.facebook && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendorForUi.socialLinks.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Facebook
                      </a>
                    </Badge>
                  )}
                  {vendorForUi.socialLinks.twitter && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendorForUi.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Twitter
                      </a>
                    </Badge>
                  )}
                  {vendorForUi.socialLinks.website && (
                    <Badge variant="secondary" asChild>
                      <a
                        href={vendorForUi.socialLinks.website}
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

        {/* Tabs for Products and Reviews */}
        <Tabs defaultValue="products" className="pb-12">
          <TabsList className="mb-6">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Ürünler ({products.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Değerlendirmeler ({vendorReviewCount})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <ProductGrid products={products} />
          </TabsContent>
          
          <TabsContent value="reviews">
            <div className="max-w-3xl">
              <ReviewsSection
                reviews={vendorReviews as any}
                averageRating={vendorAvgRating}
                totalReviews={vendorReviewCount}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
