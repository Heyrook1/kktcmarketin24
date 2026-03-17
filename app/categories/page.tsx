import { Metadata } from "next"
import Link from "next/link"
import {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen, type LucideIcon,
} from "lucide-react"
import { categories } from "@/lib/data/categories"
import { products } from "@/lib/data/products"
import { Card, CardContent } from "@/components/ui/card"

// ISR: product counts update with each revalidation cycle
export const revalidate = 3600

const ICON_MAP: Record<string, LucideIcon> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

export const metadata: Metadata = {
  title: "Tüm Kategoriler | Marketin24",
  description: "Marketin24'te tüm kategorileri keşfedin. Elektronik, moda, ev & bahçe, güzellik, spor ve daha fazlası.",
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Tüm Kategoriler
        </h1>
        <p className="mt-2 text-muted-foreground">
          Kategoriye göre ürünlere göz atın
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => {
          // COUNT is derived live — never read from a stored field
          const count = products.filter(p => p.categoryId === category.id).length
          const IconComponent = ICON_MAP[category.icon] ?? Smartphone

          return (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <Card className="group h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {count} {count === 1 ? "ürün" : "ürün"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
