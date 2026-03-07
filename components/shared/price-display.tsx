import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  price: number
  originalPrice?: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceDisplay({
  price,
  originalPrice,
  size = "md",
  className,
}: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span
        className={cn(
          "font-semibold text-foreground tabular-nums",
          sizeClasses[size]
        )}
      >
        {formatPrice(price)}
      </span>
      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through tabular-nums",
              size === "lg" ? "text-base" : "text-sm"
            )}
          >
            {formatPrice(originalPrice)}
          </span>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
            -{discountPercentage}%
          </span>
        </>
      )}
    </div>
  )
}
