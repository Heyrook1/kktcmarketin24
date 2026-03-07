"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Minus, Plus, ShoppingCart, Check, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { VendorBadge } from "@/components/vendor/vendor-badge"
import { PriceDisplay } from "@/components/shared/price-display"
import { ShareButtons } from "@/components/shared/share-buttons"
import { useCartStore } from "@/lib/store/cart-store"
import type { Product } from "@/lib/data/products"
import type { Vendor } from "@/lib/data/vendors"
import type { Category } from "@/lib/data/categories"

interface ProductDetailProps {
  product: Product
  vendor?: Vendor
  category?: Category
}

export function ProductDetail({ product, vendor, category }: ProductDetailProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem, openCart } = useCartStore()

  const handleAddToCart = () => {
    addItem(product, quantity)
    openCart()
  }

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const incrementQuantity = () => {
    if (quantity < product.stockCount) setQuantity(quantity + 1)
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-foreground transition-colors">
          Products
        </Link>
        {category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/category/${category.slug}`}
              className="hover:text-foreground transition-colors"
            >
              {category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="flex flex-col gap-4">
          {/* Main Image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary">
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {product.originalPrice && product.originalPrice > product.price && (
              <Badge className="absolute top-4 left-4 bg-red-500">Sale</Badge>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - Image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          {/* Vendor Badge */}
          <VendorBadge vendorId={product.vendorId} size="md" />

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold mt-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-muted text-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="mt-4">
            <PriceDisplay
              price={product.price}
              originalPrice={product.originalPrice}
              size="lg"
            />
          </div>

          {/* Description */}
          <p className="mt-4 text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          <Separator className="my-6" />

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            {product.inStock ? (
              <>
                <Check className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">In Stock</span>
                <span className="text-muted-foreground text-sm">
                  ({product.stockCount} available)
                </span>
              </>
            ) : (
              <span className="text-red-600 font-medium">Out of Stock</span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          {product.inStock && (
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              {/* Quantity Selector */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={incrementQuantity}
                  disabled={quantity >= product.stockCount}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Add to Cart Button */}
              <Button size="lg" className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          )}

          <Separator className="my-6" />

          {/* Share & Category */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Share:</span>
              <ShareButtons
                url={`/products/${product.id}`}
                title={product.name}
                description={product.description}
              />
            </div>
            {category && (
              <Link href={`/category/${category.slug}`}>
                <Badge variant="secondary">{category.name}</Badge>
              </Link>
            )}
          </div>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
