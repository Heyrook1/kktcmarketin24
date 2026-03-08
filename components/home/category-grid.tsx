import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { categories } from "@/lib/data/categories"
import { Button } from "@/components/ui/button"

export function CategoryGrid() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Kategorilere Göz At</h2>
            <p className="text-muted-foreground mt-1">
              İhtiyacınız olan her şey kategorilerimizde
            </p>
          </div>
          <Button variant="ghost" asChild className="hidden sm:flex">
            <Link href="/products">
              Tümünü Gör
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="group flex-shrink-0 w-36 sm:w-auto"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                  sizes="(max-width: 640px) 144px, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-medium text-white text-sm">{category.name}</h3>
                  <p className="text-white/70 text-xs mt-0.5">
                    {category.productCount} ürün
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 sm:hidden">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/products">
              Tüm Kategoriler
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
