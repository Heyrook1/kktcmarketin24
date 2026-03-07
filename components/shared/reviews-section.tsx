"use client"

import { useState } from "react"
import Image from "next/image"
import { Star, ThumbsUp, ChevronDown, ChevronUp, CheckCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
}

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
  compact?: boolean
  maxVisible?: number
}

export function ReviewsSection({ 
  reviews, 
  averageRating, 
  totalReviews,
  compact = false,
  maxVisible = 3
}: ReviewsSectionProps) {
  const [showAll, setShowAll] = useState(false)
  const [helpfulClicks, setHelpfulClicks] = useState<Set<string>>(new Set())

  const displayedReviews = showAll ? reviews : reviews.slice(0, maxVisible)

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => {
    const count = reviews.filter(r => Math.floor(r.rating) === rating).length
    return {
      rating,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
    }
  })

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId)
      } else {
        newSet.add(reviewId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>
      {/* Summary */}
      <div className={cn(
        "flex flex-col md:flex-row gap-6 p-4 bg-secondary/30 rounded-xl",
        compact && "p-3"
      )}>
        {/* Average rating */}
        <div className="flex flex-col items-center justify-center text-center min-w-[120px]">
          <p className="text-4xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
          <div className="flex items-center gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "h-4 w-4",
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {totalReviews} değerlendirme
          </p>
        </div>

        {/* Rating distribution */}
        {!compact && (
          <div className="flex-1 space-y-1.5">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm w-3">{rating}</span>
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews list */}
      {displayedReviews.length > 0 ? (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                "p-4 border rounded-xl transition-colors hover:bg-secondary/20",
                compact && "p-3"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary flex-shrink-0">
                  {review.userAvatar ? (
                    <Image
                      src={review.userAvatar}
                      alt={review.userName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{review.userName}</span>
                    {review.verified && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Onaylı Alıcı
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-3.5 w-3.5",
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.date)}
                    </span>
                  </div>

                  {review.title && (
                    <p className="font-medium mt-2">{review.title}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {review.comment}
                  </p>

                  {/* Helpful button */}
                  <div className="flex items-center gap-4 mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 text-xs gap-1",
                        helpfulClicks.has(review.id) && "text-primary"
                      )}
                      onClick={() => handleHelpful(review.id)}
                    >
                      <ThumbsUp className={cn(
                        "h-3.5 w-3.5",
                        helpfulClicks.has(review.id) && "fill-current"
                      )} />
                      Faydalı ({review.helpful + (helpfulClicks.has(review.id) ? 1 : 0)})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Henüz değerlendirme yapılmamış.
        </div>
      )}

      {/* Show more/less */}
      {reviews.length > maxVisible && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
            className="gap-1"
          >
            {showAll ? (
              <>
                Daha Az Göster
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Tümünü Göster ({reviews.length})
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
