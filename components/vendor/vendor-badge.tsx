"use client"

import Image from "next/image"
import { useState } from "react"
import { getVendorById } from "@/lib/data/vendors"
import { VendorProfileSheet } from "./vendor-profile-sheet"
import { cn } from "@/lib/utils"
import { BadgeCheck } from "lucide-react"

interface VendorBadgeProps {
  vendorId: string
  size?: "sm" | "md"
  showLogo?: boolean
  className?: string
}

export function VendorBadge({
  vendorId,
  size = "sm",
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

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors",
          className
        )}
      >
        {showLogo && (
          <div
            className={cn(
              "relative overflow-hidden rounded-full bg-secondary flex-shrink-0",
              size === "sm" ? "h-5 w-5" : "h-6 w-6"
            )}
          >
            <Image
              src={vendor.logo}
              alt={vendor.name}
              fill
              className="object-cover"
              sizes={size === "sm" ? "20px" : "24px"}
            />
          </div>
        )}
        <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
          {vendor.name}
        </span>
        {vendor.verified && (
          <BadgeCheck className={cn("text-primary", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        )}
      </button>

      <VendorProfileSheet
        vendorId={vendorId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </>
  )
}
