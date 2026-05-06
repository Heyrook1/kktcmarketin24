export interface FilterState {
  priceRange: [number, number]
  brands: string[]
  inStock: boolean
  gender: string[]
  size: string[]
  sort: string
}

import { Button } from "@/components/ui/button"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineFilterPanelProps {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  onClose: () => void
}

const GENDERS = ["Kadın", "Erkek", "Unisex", "Çocuk"]
const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
const SORT_OPTIONS = [
  { id: "newest", label: "Yeniden Eskiye" },
  { id: "price_asc", label: "Ucuzdan Pahalıya" },
  { id: "price_desc", label: "Pahalıdan Ucuza" },
  { id: "popular", label: "En Çok Satanlar" },
]

export function InlineFilterPanel({ filters, setFilters, onClose }: InlineFilterPanelProps) {
  const toggleArrayItem = (key: 'gender' | 'size' | 'brands', value: string) => {
    const current = filters[key]
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value]
    setFilters({ ...filters, [key]: updated })
  }

  const handleClear = () => {
    setFilters({
      priceRange: [0, 0],
      brands: [],
      inStock: false,
      gender: [],
      size: [],
      sort: "newest"
    })
  }

  return (
    <div className="bg-card border rounded-2xl shadow-sm p-5 mb-6 transition-all animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-5 pb-3 border-b">
        <h3 className="font-semibold text-lg">Filtrele ve Sırala</h3>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Filtreyi kapat" className="h-8 w-8 rounded-full">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Sort Options */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Sıralama</h4>
          <div className="flex flex-col gap-2">
            {SORT_OPTIONS.map(opt => (
              <label key={opt.id} htmlFor={`sort-${opt.id}`} className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                  filters.sort === opt.id ? "border-primary bg-primary" : "border-muted-foreground group-hover:border-primary"
                )} aria-hidden="true">
                  {filters.sort === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <input
                  id={`sort-${opt.id}`}
                  name="sort-filter"
                  type="radio"
                  className="sr-only"
                  checked={filters.sort === opt.id}
                  onChange={() => setFilters({ ...filters, sort: opt.id })}
                />
                <span className={cn("text-sm transition-colors", filters.sort === opt.id ? "font-medium text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Cinsiyet</h4>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map(g => (
              <button
                key={g}
                onClick={() => toggleArrayItem('gender', g)}
                aria-pressed={filters.gender.includes(g)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  filters.gender.includes(g) 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="pt-4 space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Stok Durumu</h4>
            <label htmlFor="inStock-filter" className="flex items-center gap-2 cursor-pointer group">
              <div className={cn(
                "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                filters.inStock ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground group-hover:border-primary"
              )} aria-hidden="true">
                {filters.inStock && <Check className="w-3 h-3" />}
              </div>
              <input
                id="inStock-filter"
                type="checkbox"
                className="sr-only"
                checked={filters.inStock}
                onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                Sadece stokta olanlar
              </span>
            </label>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Beden</h4>
          <div className="flex flex-wrap gap-2">
            {SIZES.map(s => (
              <button
                key={s}
                onClick={() => toggleArrayItem('size', s)}
                aria-pressed={filters.size.includes(s)}
                className={cn(
                  "w-10 h-10 rounded-lg text-xs font-medium border transition-all flex items-center justify-center",
                  filters.size.includes(s) 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="space-y-3 flex flex-col h-full">
          <h4 className="font-medium text-sm text-muted-foreground">Fiyat Aralığı</h4>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
              <input
                type="number"
                placeholder="Min"
                aria-label="Minimum fiyat"
                value={filters.priceRange[0] || ''}
                onChange={(e) => setFilters({ ...filters, priceRange: [Number(e.target.value), filters.priceRange[1]] })}
                className="w-full h-9 pl-7 pr-3 rounded-lg border bg-secondary/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₺</span>
              <input
                type="number"
                placeholder="Max"
                aria-label="Maksimum fiyat"
                value={filters.priceRange[1] || ''}
                onChange={(e) => setFilters({ ...filters, priceRange: [filters.priceRange[0], Number(e.target.value)] })}
                className="w-full h-9 pl-7 pr-3 rounded-lg border bg-secondary/20 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div className="mt-auto pt-6 flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClear}
              className="flex-1 rounded-xl"
            >
              Temizle
            </Button>
            <Button 
              onClick={onClose}
              className="flex-1 rounded-xl shadow-md hover:-translate-y-0.5 transition-all"
            >
              Uygula
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
