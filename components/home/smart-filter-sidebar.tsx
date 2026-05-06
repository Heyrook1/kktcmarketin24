import { useState } from "react"
import { X, ChevronDown, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface FilterState {
  priceRange: [number, number]
  brands: string[]
  inStock: boolean
}

interface SmartFilterSidebarProps {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  isOpen: boolean
  onClose: () => void
}

export function SmartFilterSidebar({ filters, setFilters, isOpen, onClose }: SmartFilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    price: true,
    brands: true,
    availability: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[280px] bg-background border-r transform transition-transform duration-300 ease-in-out md:relative md:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <SlidersHorizontal className="h-5 w-5" />
              <span>Filtreler</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Availability */}
            <div className="space-y-4">
              <button 
                onClick={() => toggleSection('availability')}
                className="flex items-center justify-between w-full font-medium"
              >
                Stok Durumu
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.availability ? "rotate-180" : "")} />
              </button>
              {expandedSections.availability && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="inStock"
                    checked={filters.inStock}
                    onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                    className="rounded border-input bg-transparent"
                  />
                  <label htmlFor="inStock" className="text-sm">Stokta Olanlar</label>
                </div>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Price Range (Simplified) */}
            <div className="space-y-4">
              <button 
                onClick={() => toggleSection('price')}
                className="flex items-center justify-between w-full font-medium"
              >
                Fiyat
                <ChevronDown className={cn("h-4 w-4 transition-transform", expandedSections.price ? "rotate-180" : "")} />
              </button>
              {expandedSections.price && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceRange[0] || ''}
                    onChange={(e) => setFilters({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceRange[1] || ''}
                    onChange={(e) => setFilters({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-background">
            <Button 
              className="w-full"
              onClick={() => {
                setFilters({ priceRange: [0, 0], brands: [], inStock: false })
              }}
              variant="outline"
            >
              Filtreleri Temizle
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
