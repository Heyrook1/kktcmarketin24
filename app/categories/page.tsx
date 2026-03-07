import { Metadata } from "next"
import Link from "next/link"
import { categories } from "@/lib/data/categories"
import { products } from "@/lib/data/products"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "All Categories",
  description: "Browse all product categories on Marketin24. Find electronics, fashion, home & garden, beauty, sports, and more.",
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          All Categories
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse products by category
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => {
          const productCount = products.filter(p => p.category === category.slug).length
          const IconComponent = category.icon
          
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
                    {productCount} {productCount === 1 ? "product" : "products"}
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
