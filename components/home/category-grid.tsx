import Link from "next/link"
import {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen, ArrowRight,
} from "lucide-react"
import { categories } from "@/lib/data/categories"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* Per-category icon + accent colour — kept here so no changes to data file */
const meta: Record<string, { icon: React.ElementType; accent: string; bg: string }> = {
  electronics:  { icon: Smartphone,     accent: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  fashion:      { icon: Shirt,           accent: "#BE185D", bg: "rgba(190,24,93,0.10)" },
  "home-garden":{ icon: Home,            accent: "#15803D", bg: "rgba(21,128,61,0.10)" },
  beauty:       { icon: Sparkles,        accent: "#9333EA", bg: "rgba(147,51,234,0.10)" },
  sports:       { icon: Dumbbell,        accent: "#EA580C", bg: "rgba(234,88,12,0.10)" },
  "kids-baby":  { icon: Baby,            accent: "#0891B2", bg: "rgba(8,145,178,0.10)" },
  jewelry:      { icon: Watch,           accent: "#B45309", bg: "rgba(180,83,9,0.10)" },
  groceries:    { icon: ShoppingBasket,  accent: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  health:       { icon: Heart,           accent: "#DC2626", bg: "rgba(220,38,38,0.10)" },
  books:        { icon: BookOpen,        accent: "#7C3AED", bg: "rgba(124,58,237,0.10)" },
}

export function CategoryGrid() {
  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-1">
              Kategoriler
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
              Her İhtiyacınız Burada
            </h2>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden sm:flex text-muted-foreground">
            <Link href="/products">
              Tümünü Gör
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Grid — horizontal scroll mobile, 5-col desktop */}
        <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:overflow-visible sm:gap-4">
          {categories.map((cat) => {
            const m = meta[cat.id] ?? { icon: ShoppingBasket, accent: "#64748B", bg: "rgba(100,116,139,0.10)" }
            const Icon = m.icon
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={cn(
                  "group flex-shrink-0 w-36 sm:w-auto",
                  "flex flex-col items-center gap-3 rounded-2xl border border-border",
                  "px-3 py-5 text-center transition-all duration-200",
                  "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 hover:bg-secondary/60",
                  "bg-card"
                )}
              >
                {/* Icon circle */}
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-110"
                  style={{ background: m.bg }}
                >
                  <Icon className="h-7 w-7" style={{ color: m.accent }} />
                </div>

                {/* Name */}
                <div>
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {cat.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {cat.productCount} ürün
                  </p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Mobile "see all" */}
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
