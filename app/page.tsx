import { CyprusHero } from "@/components/home/cyprus-hero"
import { CategoryGrid } from "@/components/home/category-grid"
import { LiveBrandAds } from "@/components/home/live-brand-ads"
import { FeaturedProducts, NewArrivals, BestSellers, PromoBanner } from "@/components/home/featured-products"

export default function HomePage() {
  return (
    <>
      <CyprusHero />
      <CategoryGrid />
      <LiveBrandAds />
      <FeaturedProducts />
      <PromoBanner />
      <NewArrivals />
      <BestSellers />
    </>
  )
}
