"use client"

import { useState } from "react"
import { Plus, X, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────
export interface VariantRow {
  label: string
  stock: string
  price: string  // empty = use base price
}

export interface VariantSet {
  sizes:   VariantRow[]
  colors:  VariantRow[]
  volumes: VariantRow[]
}

// ── Category → variant config mapping ─────────────────────────────────────────
interface VariantConfig {
  showSizes:   boolean
  showColors:  boolean
  showVolumes: boolean
  sizeLabel:   string        // e.g. "Beden", "Numara", "Yaş"
  volumeLabel: string        // e.g. "Hacim", "Kapasite", "Ağırlık"
  sizePresets: string[][]    // groups of quick-add presets
  volumePresets: string[][]
  colorPresets:  string[]
  sizePlaceholder: string
  volumePlaceholder: string
}

const CATEGORY_CONFIG: Record<string, VariantConfig> = {
  fashion: {
    showSizes: true, showColors: true, showVolumes: false,
    sizeLabel: "Beden", volumeLabel: "Hacim",
    sizePresets: [
      ["XS", "S", "M", "L", "XL", "XXL"],
      ["34", "36", "38", "40", "42", "44", "46"],
    ],
    volumePresets: [],
    colorPresets: ["Siyah", "Beyaz", "Lacivert", "Gri", "Kırmızı", "Bej", "Haki", "Pembe"],
    sizePlaceholder: "örn. S, M, L, XL, 38, 42…",
    volumePlaceholder: "",
  },
  "kids-baby": {
    showSizes: true, showColors: true, showVolumes: false,
    sizeLabel: "Yaş / Beden", volumeLabel: "Hacim",
    sizePresets: [
      ["0-3 Ay", "3-6 Ay", "6-12 Ay", "1-2 Yıl", "2-4 Yıl", "4-6 Yıl", "6-8 Yıl", "8-10 Yıl"],
      ["56", "62", "68", "74", "80", "86", "92", "98", "104", "110", "116"],
    ],
    volumePresets: [],
    colorPresets: ["Mavi", "Pembe", "Sarı", "Beyaz", "Yeşil", "Mor", "Kırmızı", "Gri"],
    sizePlaceholder: "örn. 0-3 Ay, 62, S…",
    volumePlaceholder: "",
  },
  sports: {
    showSizes: true, showColors: true, showVolumes: false,
    sizeLabel: "Numara / Beden", volumeLabel: "Kapasite",
    sizePresets: [
      ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
      ["XS", "S", "M", "L", "XL", "XXL"],
    ],
    volumePresets: [],
    colorPresets: ["Siyah", "Beyaz", "Mavi", "Kırmızı", "Gri", "Yeşil", "Turuncu"],
    sizePlaceholder: "örn. 40, 41, 42 veya S, M, L…",
    volumePlaceholder: "",
  },
  beauty: {
    showSizes: false, showColors: true, showVolumes: true,
    sizeLabel: "Beden", volumeLabel: "Hacim (ml)",
    sizePresets: [],
    volumePresets: [
      ["10 ml", "30 ml", "50 ml", "100 ml", "200 ml"],
      ["5 ml", "15 ml", "25 ml", "50 ml", "75 ml", "100 ml"],
    ],
    colorPresets: ["Şeffaf", "Pembe", "Mor", "Altın", "Gümüş"],
    sizePlaceholder: "",
    volumePlaceholder: "örn. 30 ml, 50 ml, 100 ml…",
  },
  electronics: {
    showSizes: false, showColors: true, showVolumes: true,
    sizeLabel: "Beden", volumeLabel: "Kapasite / Depolama",
    sizePresets: [],
    volumePresets: [
      ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"],
      ["8 GB", "16 GB", "32 GB", "64 GB"],
    ],
    colorPresets: ["Siyah", "Beyaz", "Gümüş", "Uzay Grisi", "Altın", "Mavi"],
    sizePlaceholder: "",
    volumePlaceholder: "örn. 128 GB, 256 GB…",
  },
  "home-garden": {
    showSizes: true, showColors: true, showVolumes: false,
    sizeLabel: "Boyut", volumeLabel: "Hacim",
    sizePresets: [
      ["S", "M", "L", "XL"],
      ["40x40 cm", "50x50 cm", "60x60 cm", "80x80 cm"],
    ],
    volumePresets: [],
    colorPresets: ["Beyaz", "Bej", "Gri", "Siyah", "Kahverengi", "Mavi", "Yeşil"],
    sizePlaceholder: "örn. S, M, L veya 40x40 cm…",
    volumePlaceholder: "",
  },
  jewelry: {
    showSizes: true, showColors: true, showVolumes: false,
    sizeLabel: "Yüzük / Bileklik Ölçüsü", volumeLabel: "Hacim",
    sizePresets: [
      ["48", "50", "52", "54", "56", "58", "60"],
      ["XS", "S", "M", "L", "XL"],
    ],
    volumePresets: [],
    colorPresets: ["Altın", "Gümüş", "Rose Gold", "Bronz", "Siyah"],
    sizePlaceholder: "örn. 52, 54 veya S, M, L…",
    volumePlaceholder: "",
  },
  food: {
    showSizes: false, showColors: false, showVolumes: true,
    sizeLabel: "Beden", volumeLabel: "Ağırlık / Hacim",
    sizePresets: [],
    volumePresets: [
      ["100 gr", "250 gr", "500 gr", "1 kg", "2 kg", "5 kg"],
      ["100 ml", "250 ml", "500 ml", "1 lt", "2 lt"],
    ],
    colorPresets: [],
    sizePlaceholder: "",
    volumePlaceholder: "örn. 250 gr, 500 gr, 1 kg…",
  },
}

const DEFAULT_CONFIG: VariantConfig = {
  showSizes: true, showColors: true, showVolumes: true,
  sizeLabel: "Beden / Boyut", volumeLabel: "Hacim / Kapasite",
  sizePresets: [["XS", "S", "M", "L", "XL", "XXL"]],
  volumePresets: [["30 ml", "50 ml", "100 ml"]],
  colorPresets: ["Siyah", "Beyaz", "Gri", "Mavi", "Kırmızı"],
  sizePlaceholder: "örn. S, M, L…",
  volumePlaceholder: "örn. 30 ml, 100 ml…",
}

// ── Single variant row ─────────────────────────────────────────────────────────
function VariantRow({
  row, basePrice, showPrice, onUpdate, onRemove,
}: {
  row: VariantRow
  basePrice: number
  showPrice: boolean
  onUpdate: (field: keyof VariantRow, val: string) => void
  onRemove: () => void
}) {
  const parsedPrice = row.price ? Number(row.price) : null
  const diff = parsedPrice !== null ? parsedPrice - basePrice : 0

  return (
    <div className="flex items-center gap-2 group/row">
      <Input
        placeholder="Seçenek"
        value={row.label}
        onChange={(e) => onUpdate("label", e.target.value)}
        className="h-8 text-sm flex-1 min-w-0"
      />
      <Input
        type="number" min="0" placeholder="Stok"
        value={row.stock}
        onChange={(e) => onUpdate("stock", e.target.value)}
        className="h-8 text-sm w-[72px] flex-shrink-0"
      />
      {showPrice && (
        <div className="relative flex-shrink-0 w-[110px]">
          <Input
            type="number" min="0" step="0.01"
            placeholder="Fiyat ₺"
            value={row.price}
            onChange={(e) => onUpdate("price", e.target.value)}
            className="h-8 text-sm pr-8"
          />
          {parsedPrice !== null && basePrice > 0 && diff !== 0 && (
            <span className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold",
              diff > 0 ? "text-green-600" : "text-red-500"
            )}>
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover/row:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Single section (sizes / colors / volumes) ──────────────────────────────────
function VariantSection({
  title, emptyHint, placeholder, rows, basePrice, showPrice, presets, colorPresets,
  onChange,
}: {
  title: string
  emptyHint: string
  placeholder: string
  rows: VariantRow[]
  basePrice: number
  showPrice: boolean
  presets?: string[][]
  colorPresets?: string[]
  onChange: (rows: VariantRow[]) => void
}) {
  const [customInput, setCustomInput] = useState("")

  const addRow = (label = "") =>
    onChange([...rows, { label, stock: "", price: "" }])

  const addPresetGroup = (group: string[]) => {
    const existing = new Set(rows.map((r) => r.label.trim().toLowerCase()))
    const toAdd = group.filter((g) => !existing.has(g.toLowerCase()))
    if (!toAdd.length) return
    onChange([...rows, ...toAdd.map((label) => ({ label, stock: "", price: "" }))])
  }

  const addCustom = () => {
    const val = customInput.trim()
    if (!val) return
    // Support comma-separated input
    const labels = val.split(",").map((s) => s.trim()).filter(Boolean)
    const existing = new Set(rows.map((r) => r.label.trim().toLowerCase()))
    const toAdd = labels.filter((l) => !existing.has(l.toLowerCase()))
    onChange([...rows, ...toAdd.map((label) => ({ label, stock: "", price: "" }))])
    setCustomInput("")
  }

  const updateRow = (i: number, field: keyof VariantRow, val: string) =>
    onChange(rows.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const removeRow = (i: number) =>
    onChange(rows.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
          >
            Tümünü temizle
          </button>
        )}
      </div>

      {/* Quick preset buttons */}
      {presets && presets.length > 0 && (
        <div className="space-y-1.5">
          {presets.map((group, gi) => (
            <div key={gi} className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => addPresetGroup(group)}
                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
              >
                <Zap className="h-2.5 w-2.5" />
                Hepsini ekle
              </button>
              {group.map((label) => {
                const exists = rows.some((r) => r.label.trim().toLowerCase() === label.toLowerCase())
                return (
                  <button
                    key={label}
                    type="button"
                    disabled={exists}
                    onClick={() => addRow(label)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-md border font-medium transition-colors",
                      exists
                        ? "border-border/30 text-muted-foreground/40 cursor-not-allowed bg-secondary/20"
                        : "border-border text-foreground hover:border-primary/60 hover:bg-secondary/60"
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Color presets (circles) */}
      {colorPresets && colorPresets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {colorPresets.map((color) => {
            const exists = rows.some((r) => r.label.trim().toLowerCase() === color.toLowerCase())
            return (
              <button
                key={color}
                type="button"
                disabled={exists}
                onClick={() => addRow(color)}
                className={cn(
                  "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                  exists
                    ? "border-border/30 text-muted-foreground/40 cursor-not-allowed"
                    : "border-border text-foreground hover:border-primary/60 hover:bg-primary/5"
                )}
              >
                {exists ? "✓ " : ""}{color}
              </button>
            )
          })}
        </div>
      )}

      {/* Custom add row */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder || "Özel seçenek ekle (virgülle ayırın)"}
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom() } }}
          className="h-8 text-sm flex-1"
        />
        <Button type="button" size="sm" variant="outline" onClick={addCustom} className="h-8 gap-1 px-3 text-xs">
          <Plus className="h-3 w-3" /> Ekle
        </Button>
      </div>

      {/* Rows */}
      {rows.length > 0 && (
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex items-center gap-2 px-1 mb-1">
            <span className="text-[10px] text-muted-foreground flex-1">Seçenek</span>
            <span className="text-[10px] text-muted-foreground w-[72px] flex-shrink-0">Stok (adet)</span>
            {showPrice && (
              <span className="text-[10px] text-muted-foreground w-[110px] flex-shrink-0 flex items-center gap-1">
                Fiyat ₺
                <span title="Boş bırakılırsa temel fiyat kullanılır">
                  <Info className="h-2.5 w-2.5 text-muted-foreground/60" />
                </span>
              </span>
            )}
            <span className="w-8 flex-shrink-0" />
          </div>
          {rows.map((row, i) => (
            <VariantRow
              key={i}
              row={row}
              basePrice={basePrice}
              showPrice={showPrice}
              onUpdate={(field, val) => updateRow(i, field, val)}
              onRemove={() => removeRow(i)}
            />
          ))}
        </div>
      )}

      {rows.length === 0 && (
        <p className="text-xs text-muted-foreground/60 italic">{emptyHint}</p>
      )}
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
interface SmartVariantEditorProps {
  categoryId: string
  basePrice: number
  variants: VariantSet
  onChange: (variants: VariantSet) => void
}

export function SmartVariantEditor({ categoryId, basePrice, variants, onChange }: SmartVariantEditorProps) {
  const cfg = CATEGORY_CONFIG[categoryId] ?? DEFAULT_CONFIG

  const set = <K extends keyof VariantSet>(key: K, rows: VariantRow[]) =>
    onChange({ ...variants, [key]: rows })

  const hasAny = variants.sizes.length > 0 || variants.colors.length > 0 || variants.volumes.length > 0

  return (
    <div className="space-y-6">
      {/* Info banner */}
      {!hasAny && (
        <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3.5 py-3">
          <Zap className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {categoryId
              ? <>Kategori <span className="font-semibold text-foreground">{CATEGORY_CONFIG[categoryId] ? `"${categoryId}"` : "tanımlı"}</span> için önerilen varyantlar aşağıda hazır — hızlı ekle butonlarını kullanın.</>
              : "Önce kategori seçin; uygun varyant önerileri otomatik görünür."}
          </p>
        </div>
      )}

      {/* Sizes */}
      {cfg.showSizes && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">B</div>
            <h4 className="text-sm font-semibold">{cfg.sizeLabel}</h4>
            {variants.sizes.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-auto">{variants.sizes.length} seçenek</Badge>
            )}
          </div>
          <VariantSection
            title=""
            emptyHint={`Henüz ${cfg.sizeLabel.toLowerCase()} eklenmedi. Yukarıdaki hazır seçeneklerden ekleyin.`}
            placeholder={cfg.sizePlaceholder}
            rows={variants.sizes}
            basePrice={basePrice}
            showPrice={false}
            presets={cfg.sizePresets}
            onChange={(rows) => set("sizes", rows)}
          />
        </div>
      )}

      {/* Colors */}
      {cfg.showColors && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-pink-100 flex items-center justify-center text-pink-600 text-xs font-bold">R</div>
            <h4 className="text-sm font-semibold">Renkler</h4>
            {variants.colors.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-auto">{variants.colors.length} renk</Badge>
            )}
          </div>
          <VariantSection
            title=""
            emptyHint="Henüz renk eklenmedi. Yaygın renkleri tıklayarak veya özel renk girerek ekleyin."
            placeholder="Renk adı girin (virgülle ayırın)"
            rows={variants.colors}
            basePrice={basePrice}
            showPrice={false}
            colorPresets={cfg.colorPresets}
            onChange={(rows) => set("colors", rows)}
          />
        </div>
      )}

      {/* Volumes */}
      {cfg.showVolumes && (
        <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">H</div>
            <h4 className="text-sm font-semibold">{cfg.volumeLabel}</h4>
            {variants.volumes.length > 0 && (
              <Badge variant="secondary" className="text-xs ml-auto">{variants.volumes.length} seçenek</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Her kapasite seçeneği için ayrı fiyat belirleyebilirsiniz. Boş bırakılırsa temel fiyat kullanılır.
          </p>
          <VariantSection
            title=""
            emptyHint={`Henüz ${cfg.volumeLabel.toLowerCase()} eklenmedi.`}
            placeholder={cfg.volumePlaceholder}
            rows={variants.volumes}
            basePrice={basePrice}
            showPrice={true}
            presets={cfg.volumePresets}
            onChange={(rows) => set("volumes", rows)}
          />
        </div>
      )}
    </div>
  )
}

// ── Tag builder helper (used by parent forms) ──────────────────────────────────
export function variantsToTags(variants: VariantSet): string[] {
  const tags: string[] = []
  for (const row of variants.sizes) {
    if (!row.label.trim()) continue
    const base = `size:${row.label.trim().toUpperCase()}`
    tags.push(row.stock ? `${base}:${row.stock}` : base)
  }
  for (const row of variants.colors) {
    if (!row.label.trim()) continue
    const base = `color:${row.label.trim().toLowerCase()}`
    tags.push(row.stock ? `${base}:${row.stock}` : base)
  }
  for (const row of variants.volumes) {
    if (!row.label.trim()) continue
    const base = `volume:${row.label.trim()}`
    const withStock = row.stock ? `${base}:${row.stock}` : base
    tags.push(row.price ? `${withStock}:${row.price}` : withStock)
  }
  return tags
}

export function tagsToVariants(tags: string[]): VariantSet {
  const sizes:   VariantRow[] = []
  const colors:  VariantRow[] = []
  const volumes: VariantRow[] = []
  for (const tag of tags) {
    const lower = tag.toLowerCase()
    if (lower.startsWith("size:")) {
      const parts = tag.slice(5).split(":")
      sizes.push({ label: parts[0] ?? "", stock: parts[1] ?? "", price: "" })
    } else if (lower.startsWith("color:")) {
      const parts = tag.slice(6).split(":")
      colors.push({ label: parts[0] ?? "", stock: parts[1] ?? "", price: "" })
    } else if (lower.startsWith("volume:")) {
      const parts = tag.slice(7).split(":")
      volumes.push({ label: parts[0] ?? "", stock: parts[1] ?? "", price: parts[2] ?? "" })
    }
  }
  return { sizes, colors, volumes }
}
