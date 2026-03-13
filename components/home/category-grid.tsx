"use client"

import Link from "next/link"
import {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { categories } from "@/lib/data/categories"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/store/language-store"

// Map category ids to Lucide icons + a colour accent
const ICON_MAP: Record<string, { Icon: React.ElementType; bg: string; fg: string }> = {
  "electronics":  { Icon: Smartphone,     bg: "bg-blue-50",    fg: "text-blue-600"   },
  "fashion":      { Icon: Shirt,          bg: "bg-rose-50",    fg: "text-rose-600"   },
  "home-garden":  { Icon: Home,           bg: "bg-amber-50",   fg: "text-amber-600"  },
  "beauty":       { Icon: Sparkles,       bg: "bg-purple-50",  fg: "text-purple-600" },
  "sports":       { Icon: Dumbbell,       bg: "bg-green-50",   fg: "text-green-600"  },
  "kids-baby":    { Icon: Baby,           bg: "bg-sky-50",     fg: "text-sky-600"    },
  "jewelry":      { Icon: Watch,          bg: "bg-yellow-50",  fg: "text-yellow-600" },
  "groceries":    { Icon: ShoppingBasket, bg: "bg-lime-50",    fg: "text-lime-700"   },
  "health":       { Icon: Heart,          bg: "bg-red-50",     fg: "text-red-600"    },
  "books":        { Icon: BookOpen,       bg: "bg-orange-50",  fg: "text-orange-600" },
}

export function CategoryGrid() {
  const t = useT()
  return (
    <section className="bg-background border-b">
      <div className="container mx-auto px-4">
        {/* ── scrollable chip row ─────────────────────────────── */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0 md:flex-wrap">
          {categories.map((cat) => {
            const meta = ICON_MAP[cat.id] ?? { Icon: Sparkles, bg: "bg-secondary", fg: "text-foreground" }
            return (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5",
                  "text-sm font-medium transition-all duration-150",
                  "hover:border-primary hover:bg-primary hover:text-primary-foreground",
                  "bg-background border-border text-foreground"
                )}
              >
                <span className={cn("flex items-center justify-center h-5 w-5 rounded-full", meta.bg)}>
                  <meta.Icon className={cn("h-3 w-3", meta.fg)} />
                </span>
                {cat.name}
                <span className="text-xs text-muted-foreground tabular-nums">
                  {cat.productCount}
                </span>
              </Link>
            )
          })}

          {/* View all */}
          <Button variant="ghost" size="sm" className="flex-shrink-0 rounded-full text-primary gap-1 ml-1" asChild>
            <Link href="/products">
              {t.categories.viewAll} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
