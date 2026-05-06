import { cn } from "@/lib/utils"
import { Category } from "@/lib/data/categories"
import Image from "next/image"

interface HomeCategoryStripProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
}

export function HomeCategoryStrip({ categories, selectedCategory, onSelectCategory }: HomeCategoryStripProps) {
  return (
    <div className="w-full bg-background border-b shadow-sm relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-4 overflow-x-auto py-4 scrollbar-hide">
          <button
            onClick={() => onSelectCategory(null)}
            className="flex flex-col items-center gap-2 group flex-shrink-0 w-20"
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 border-2",
              selectedCategory === null 
                ? "border-primary p-0.5 shadow-md" 
                : "border-transparent bg-secondary group-hover:border-primary/50 group-hover:bg-secondary/80"
            )}>
              <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                Tümü
              </div>
            </div>
            <span className={cn(
              "text-xs font-medium text-center line-clamp-2 leading-tight transition-colors",
              selectedCategory === null ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
            )}>
              Tüm Ürünler
            </span>
          </button>
          
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className="flex flex-col items-center gap-2 group flex-shrink-0 w-20"
            >
              <div className={cn(
                "w-16 h-16 rounded-full transition-all duration-200 border-2 overflow-hidden",
                selectedCategory === category.id
                  ? "border-primary p-0.5 shadow-md" 
                  : "border-transparent bg-secondary group-hover:border-primary/50"
              )}>
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="64px"
                  />
                </div>
              </div>
              <span className={cn(
                "text-xs font-medium text-center line-clamp-2 leading-tight transition-colors",
                selectedCategory === category.id ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
