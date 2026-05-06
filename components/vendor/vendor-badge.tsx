"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { getVendorById } from "@/lib/data/vendors"
import { VendorProfileSheet } from "./vendor-profile-sheet"
import { cn } from "@/lib/utils"
import { BadgeCheck, Store } from "lucide-react"

interface VendorBadgeProps {
  vendorId: string
  size?: "sm" | "md"
  /** "inline" = clickable pill (product card), "card" = trust block (product detail) */
  variant?: "inline" | "card"
  showLogo?: boolean
  className?: string
}

export function VendorBadge({
  vendorId,
  size = "sm",
  variant = "inline",
  showLogo = true,
  className,
}: VendorBadgeProps) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const vendor = getVendorById(vendorId)

  if (!vendor) return null

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSheetOpen(true)
  }

  const avatar = (
    <div className={cn(
      "relative rounded-full overflow-hidden bg-secondary flex-shrink-0 ring-1 ring-border",
      size === "sm" ? "h-5 w-5" : "h-8 w-8"
    )}>
      {vendor.logo?.trim() ? (
        <Image src={vendor.logo} alt={vendor.name} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center font-semibold text-muted-foreground"
          style={{ fontSize: size === "sm" ? 10 : 13 }}
        >
          {vendor.name.slice(0, 1).toUpperCase()}
        </div>
      )}
    </div>
  )

  /* ── Card variant — used on product detail page ─────────────────────────── */
  if (variant === "card") {
    return (
      <>
        <button
          onClick={handleClick}
          className={cn(
            "group w-full flex items-center gap-3 rounded-xl border bg-secondary/40 px-4 py-3",
            "hover:bg-secondary/70 hover:border-primary/30 transition-all text-left",
            className
          )}
        >
          {/* Avatar */}
          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-secondary ring-2 ring-border flex-shrink-0">
            {vendor.logo?.trim() ? (
              <Image src={vendor.logo} alt={vendor.name} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <Store className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {vendor.name}
              </span>
              {vendor.verified && (
                <BadgeCheck className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {vendor.verified ? "Onaylı Satıcı · KKTC" : "Satıcı · KKTC"}
            </span>
          </div>

          {/* CTA hint */}
          <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            Mağazayı Gör →
          </span>
        </button>

        <VendorProfileSheet vendorId={vendorId} open={sheetOpen} onOpenChange={setSheetOpen} />
      </>
    )
  }

  /* ── Inline variant — used on product card ──────────────────────────────── */
  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5",
          "bg-secondary/70 hover:bg-secondary transition-colors",
          className
        )}
      >
        {showLogo && avatar}
        <span className={cn("font-medium text-foreground/80", size === "sm" ? "text-xs" : "text-sm")}>
          {vendor.name}
        </span>
        {vendor.verified && (
          <BadgeCheck className={cn("text-primary flex-shrink-0", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        )}
      </button>

      <VendorProfileSheet vendorId={vendorId} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
