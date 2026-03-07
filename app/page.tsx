import { CyprusHero } from "@/components/home/cyprus-hero"
import { LiveBrandAds } from "@/components/home/live-brand-ads"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedProducts, NewArrivals, BestSellers, PromoBanner } from "@/components/home/featured-products"

export default function HomePage() {
  return (
    <>
      <CyprusHero />
      <LiveBrandAds />
      <CategoryGrid />
      <FeaturedProducts />
      <PromoBanner />
      <NewArrivals />
      <BestSellers />
    </>
  )
}
