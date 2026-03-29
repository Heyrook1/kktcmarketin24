import Link from "next/link"
import {
  Smartphone, Shirt, Home, Sparkles, Dumbbell,
  Baby, Watch, ShoppingBasket, Heart, BookOpen,
  ArrowRight,
} from "lucide-react"
import { categories } from "@/lib/data/categories"
import { cn } from "@/lib/utils"

const ICON_META: Record<string, { Icon: React.ElementType; bg: string; fg: string; hoverBg: string }> = {
  "electronics": { Icon: Smartphone,     bg: "bg-blue-100 dark:bg-blue-950",    fg: "text-blue-600 dark:text-blue-400",    hoverBg: "group-hover:bg-blue-600"    },
  "fashion":     { Icon: Shirt,          bg: "bg-rose-100 dark:bg-rose-950",    fg: "text-rose-600 dark:text-rose-400",    hoverBg: "group-hover:bg-rose-500"    },
  "home-garden": { Icon: Home,           bg: "bg-amber-100 dark:bg-amber-950",  fg: "text-amber-600 dark:text-amber-400",  hoverBg: "group-hover:bg-amber-500"   },
  "beauty":      { Icon: Sparkles,       bg: "bg-purple-100 dark:bg-purple-950",fg: "text-purple-600 dark:text-purple-400",hoverBg: "group-hover:bg-purple-500"  },
  "sports":      { Icon: Dumbbell,       bg: "bg-green-100 dark:bg-green-950",  fg: "text-green-600 dark:text-green-400",  hoverBg: "group-hover:bg-green-600"   },
  "kids-baby":   { Icon: Baby,           bg: "bg-sky-100 dark:bg-sky-950",      fg: "text-sky-600 dark:text-sky-400",      hoverBg: "group-hover:bg-sky-500"     },
  "jewelry":     { Icon: Watch,          bg: "bg-yellow-100 dark:bg-yellow-950",fg: "text-yellow-600 dark:text-yellow-400",hoverBg: "group-hover:bg-yellow-500"  },
  "groceries":   { Icon: ShoppingBasket, bg: "bg-lime-100 dark:bg-lime-950",    fg: "text-lime-700 dark:text-lime-400",    hoverBg: "group-hover:bg-lime-600"    },
  "health":      { Icon: Heart,          bg: "bg-red-100 dark:bg-red-950",      fg: "text-red-600 dark:text-red-400",      hoverBg: "group-hover:bg-red-500"     },
  "books":       { Icon: BookOpen,       bg: "bg-orange-100 dark:bg-orange-950",fg: "text-orange-600 dark:text-orange-400",hoverBg: "group-hover:bg-orange-500"  },
}

export function CategoryGrid() {
  return (
    <section className="border-b bg-background">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">

          {categories.map((cat) => {
            const meta = ICON_META[cat.id] ?? {
              Icon: Sparkles,
              bg: "bg-secondary",
              fg: "text-foreground",
              hoverBg: "group-hover:bg-primary",
            }
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={cn(
                  "group flex-shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5",
                  "text-sm font-medium transition-all duration-150 whitespace-nowrap",
                  "bg-background border-border text-foreground",
                  "hover:border-transparent hover:shadow-sm",
                )}
              >
                <span className={cn(
                  "flex items-center justify-center h-6 w-6 rounded-full transition-colors duration-150 flex-shrink-0",
                  meta.bg,
                  meta.hoverBg,
                )}>
                  <meta.Icon className={cn(
                    "h-3.5 w-3.5 transition-colors duration-150",
                    meta.fg,
                    "group-hover:text-white",
                  )} />
                </span>
                <span className="group-hover:text-primary transition-colors">{cat.name}</span>
              </Link>
            )
          })}

          <Link
            href="/products"
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 whitespace-nowrap ml-1"
          >
            {"Tüm Kategoriler"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

        </div>
      </div>
    </section>
  )
}
