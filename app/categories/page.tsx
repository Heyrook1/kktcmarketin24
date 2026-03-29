import { Metadata } from "next"
import Link from "next/link"
import {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen, type LucideIcon,
} from "lucide-react"
import { categories } from "@/lib/data/categories"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export const revalidate = 300

const ICON_MAP: Record<string, LucideIcon> = {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen,
}

export const metadata: Metadata = {
  title: "Tüm Kategoriler | Marketin24",
  description: "Marketin24'te tüm kategorileri keşfedin. Elektronik, moda, ev & bahçe, güzellik, spor ve daha fazlası.",
}

export default async function CategoriesPage() {
  // Fetch real product counts from Supabase grouped by category
  const supabase = await createClient()
  const { data: countRows } = await supabase
    .from("vendor_products")
    .select("category")
    .eq("is_active", true)

  // Build a slug → count map from real DB data
  const countMap: Record<string, number> = {}
  if (countRows) {
    for (const row of countRows) {
      if (row.category) {
        countMap[row.category] = (countMap[row.category] ?? 0) + 1
      }
    }
  }

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
          const count = countMap[category.slug] ?? 0
          const IconComponent = ICON_MAP[category.icon] ?? Smartphone

          return (
            <Link key={category.id} href={`/urunler?category=${category.slug}`}>
              <Card className="group h-full cursor-pointer transition-all hover:border-primary hover:shadow-md">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {category.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {count > 0 ? `${count} ürün` : "Yakında"}
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
