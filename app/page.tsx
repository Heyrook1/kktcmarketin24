import { Suspense } from "react"
import { CyprusHero } from "@/components/home/cyprus-hero"
import { MobileLocaleBar } from "@/components/home/mobile-locale-bar"
import { LiveBrandAds } from "@/components/home/live-brand-ads"
import { PromoBanner, FeaturedProducts, NewArrivals, BestSellers } from "@/components/home/featured-products"
import { HomeBrowse } from "@/components/home/home-browse"
import { AnnouncementTicker } from "@/components/home/announcement-ticker"
import { FlashSaleSection } from "@/components/home/flash-sale"
import { CampaignBanners } from "@/components/home/campaign-banners"
import { createClient } from "@/lib/supabase/server"
import { mapVendorProductRowToListProduct } from "@/lib/map-vendor-product-list"
import { categories } from "@/lib/data/categories"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: rawProducts } = await supabase
    .from("vendor_products")
    .select(
      "id, name, description, price, compare_price, category, image_url, images, tags, is_active, stock, created_at, store_id, vendor_stores(id, name, slug)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100)

  const initialProducts = (rawProducts ?? []).map((p) =>
    mapVendorProductRowToListProduct(p as Parameters<typeof mapVendorProductRowToListProduct>[0])
  )

  // Products with a discount for flash sale
  const flashProducts = initialProducts
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .slice(0, 8)

  return (
    <>
      <HomeBrowse initialProducts={initialProducts} categories={categories}>

        {/* 1 — Duyuru ticker (hareketli yazı) */}
        <AnnouncementTicker />

        {/* 2 — Ana hero slider + side ads + güven bandı */}
        <CyprusHero />

        {/* 3 — Dil/para birimi (sadece mobil) */}
        <MobileLocaleBar />

        {/* 4 — Canlı marka kampanyaları */}
        <LiveBrandAds />

        {/* 5 — Flaş Satış (geri sayımlı, indirimli ürünler) */}
        {flashProducts.length > 0 && (
          <FlashSaleSection products={flashProducts} />
        )}

        {/* 6 — Öne çıkan ürünler (DB'den) */}
        <Suspense fallback={null}><FeaturedProducts /></Suspense>

        {/* 7 — Kampanya banner grid (5 büyük banner) */}
        <CampaignBanners />

        {/* 8 — Yeni gelenler */}
        <Suspense fallback={null}><NewArrivals /></Suspense>

        {/* 9 — Promosyon banner */}
        <PromoBanner />

        {/* 10 — En çok satanlar */}
        <Suspense fallback={null}><BestSellers /></Suspense>

      </HomeBrowse>
    </>
  )
}
