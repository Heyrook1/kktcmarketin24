import Link from "next/link"
import Image from "next/image"
import {
  ArrowRight, SlidersHorizontal,
} from "lucide-react"
import { categories } from "@/lib/data/categories"
import { cn } from "@/lib/utils"

interface CategoryGridProps {
  selectedCategory: string | null
  onSelectCategory: (id: string | null) => void
  onFilterClick: () => void
  isFilterOpen: boolean
}

export function CategoryGrid({
  selectedCategory,
  onSelectCategory,
  onFilterClick,
  isFilterOpen,
}: CategoryGridProps) {
  return (
    <div className="w-full bg-background pt-3 pb-2 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-start gap-4 overflow-x-auto py-2 scrollbar-hide">
        
        {/* Filter Toggle Button */}
        <button
          onClick={onFilterClick}
          className="flex flex-col items-center gap-2 group flex-shrink-0 w-[72px]"
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 border-2",
            isFilterOpen 
              ? "border-primary p-0.5 shadow-md" 
              : "border-border bg-card group-hover:border-primary/50 group-hover:bg-secondary/80"
          )}>
            <div className={cn(
              "w-full h-full rounded-full flex items-center justify-center",
              isFilterOpen ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground group-hover:text-primary"
            )}>
              <SlidersHorizontal className="h-6 w-6" />
            </div>
          </div>
          <span className={cn(
            "text-[11px] font-semibold text-center whitespace-nowrap transition-colors",
            isFilterOpen ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
          )}>
            Filtrele
          </span>
        </button>

        {/* All Categories Button */}
        <button
          onClick={() => onSelectCategory(null)}
          className="flex flex-col items-center gap-2 group flex-shrink-0 w-[72px]"
        >
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 border-2",
            selectedCategory === null 
              ? "border-primary p-0.5 shadow-md" 
              : "border-border bg-card group-hover:border-primary/50 group-hover:bg-secondary/80"
          )}>
            <div className={cn(
              "w-full h-full rounded-full flex items-center justify-center font-bold text-sm",
              selectedCategory === null ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground group-hover:text-primary"
            )}>
              Tümü
            </div>
          </div>
          <span className={cn(
            "text-[11px] font-semibold text-center whitespace-nowrap transition-colors",
            selectedCategory === null ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
          )}>
            Tüm Ürünler
          </span>
        </button>

        {/* Categories (Story-style) */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-2 group flex-shrink-0 w-[76px]"
            >
              <div className={cn(
                "w-16 h-16 rounded-full transition-all duration-200 border-[3px] overflow-hidden",
                isSelected 
                  ? "border-primary p-0.5 shadow-md" 
                  : "border-transparent bg-secondary group-hover:border-primary/40 group-hover:shadow-sm"
              )}>
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="64px"
                  />
                </div>
              </div>
              <span className={cn(
                "text-[11px] font-medium text-center line-clamp-2 leading-tight transition-colors px-1",
                isSelected ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground",
              )}>
                {cat.name}
              </span>
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}
