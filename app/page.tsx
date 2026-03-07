import { HeroSection } from "@/components/home/hero-section"
import { CategoryGrid } from "@/components/home/category-grid"
import { FeaturedProducts, NewArrivals, BestSellers, PromoBanner } from "@/components/home/featured-products"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryGrid />
      <FeaturedProducts />
      <PromoBanner />
      <NewArrivals />
      <BestSellers />
    </>
  )
}
