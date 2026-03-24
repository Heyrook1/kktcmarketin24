"use client"

import { useState, useCallback, useRef } from "react"
import { X, Plus, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  TAG_TAXONOMY,
  BRAND_TAGS,
  ATTRIBUTE_TAGS,
  getTagMeta,
  getSuggestedTagsForCategory,
  categorySlugToTaxonomyKey,
} from "@/lib/tag-taxonomy"

const MAX_TAGS = 20

interface SmartTagEditorProps {
  value: string[]
  onChange: (tags: string[]) => void
  categorySlug?: string   // e.g. "electronics" — used to auto-suggest tags
  className?: string
}

function tagColor(color: string) {
  const map: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    gray:   "bg-secondary text-muted-foreground border-border",
  }
  return map[color] ?? map.gray
}

// Build a flat list of all known tags for autocomplete
function buildAllTags(): Array<{ tag: string; label: string; color: string; type: string }> {
  const list: Array<{ tag: string; label: string; color: string; type: string }> = []
  for (const [key, meta] of Object.entries(TAG_TAXONOMY)) {
    list.push({ tag: key, label: meta.label, color: meta.color, type: "kategori" })
    for (const [subKey, subMeta] of Object.entries(meta.subcategories)) {
      list.push({ tag: subKey, label: subMeta.label, color: subMeta.color, type: "alt kategori" })
    }
  }
  for (const [key, label] of Object.entries(BRAND_TAGS)) {
    list.push({ tag: key, label, color: "purple", type: "marka" })
  }
  for (const [key, label] of Object.entries(ATTRIBUTE_TAGS)) {
    list.push({ tag: key, label, color: "gray", type: "özellik" })
  }
  return list
}

const ALL_TAGS = buildAllTags()

export function SmartTagEditor({ value, onChange, categorySlug, className }: SmartTagEditorProps) {
  const [input, setInput]       = useState("")
  const [focused, setFocused]   = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  const catKey = categorySlug ? categorySlugToTaxonomyKey(categorySlug) : undefined
  const suggested = catKey
    ? getSuggestedTagsForCategory(catKey).filter((t) => !value.includes(t))
    : []

  const filtered = input.length > 0
    ? ALL_TAGS
        .filter((t) => !value.includes(t.tag) &&
          (t.tag.includes(input.toLowerCase()) || t.label.toLowerCase().includes(input.toLowerCase())))
        .slice(0, 8)
    : []

  const addTag = useCallback((tag: string) => {
    const normalized = tag.toLowerCase().replace(/\s+/g, "-").trim()
    if (!normalized || value.includes(normalized) || value.length >= MAX_TAGS) return
    onChange([...value, normalized])
    setInput("")
    inputRef.current?.focus()
  }, [value, onChange])

  const removeTag = useCallback((tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }, [value, onChange])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault()
      addTag(input.trim().replace(/,/g, ""))
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Input + tag cloud */}
      <div
        className={cn(
          "min-h-[2.5rem] flex flex-wrap gap-1.5 p-2 rounded-lg border bg-background transition-colors cursor-text",
          focused ? "border-primary ring-2 ring-primary/20" : "border-border"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => {
          const meta = getTagMeta(tag)
          return (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium",
                tagColor(meta.color)
              )}
            >
              {meta.label}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                aria-label={`${meta.label} etiketini kaldır`}
                className="hover:opacity-60 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )
        })}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={value.length === 0 ? "Etiket ekle (örn. samsung, 5g, android)..." : ""}
          className="flex-1 min-w-[140px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          aria-label="Etiket ekle"
          disabled={value.length >= MAX_TAGS}
        />
      </div>

      {/* Autocomplete dropdown */}
      {focused && filtered.length > 0 && (
        <div className="border rounded-lg bg-background shadow-md overflow-hidden">
          {filtered.map((item) => (
            <button
              key={item.tag}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); addTag(item.tag) }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors text-left"
            >
              <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 font-medium">{item.label}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.type}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add custom tag button */}
      {input.trim() && !filtered.find((t) => t.tag === input.trim().toLowerCase()) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-xs h-7"
          onClick={() => addTag(input.trim())}
        >
          <Plus className="h-3 w-3" />
          &ldquo;{input.trim()}&rdquo; ekle
        </Button>
      )}

      {/* Suggested tags based on category */}
      {suggested.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Kategori önerileri:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((tag) => {
              const meta = getTagMeta(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-opacity hover:opacity-80",
                    tagColor(meta.color)
                  )}
                >
                  <Plus className="h-2.5 w-2.5" />
                  {meta.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Attribute quick-select */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Hızlı özellik ekle:</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ATTRIBUTE_TAGS)
            .filter(([k]) => !value.includes(k))
            .slice(0, 10)
            .map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => addTag(key)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                + {label}
              </button>
            ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {value.length}/{MAX_TAGS} etiket &mdash; virgül veya Enter ile ekleyin
      </p>
    </div>
  )
}
