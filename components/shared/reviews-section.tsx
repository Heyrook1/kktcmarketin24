"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Star, ThumbsUp, ChevronDown, ChevronUp, CheckCircle,
  User, MessageSquare, BadgeCheck, Send, X, LogIn,
  AlertTriangle, Sparkles, UserCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useReviewUser } from "@/hooks/use-review-user"

interface VendorReply {
  vendorId: string
  vendorName: string
  vendorLogo: string
  reply: string
  date: string
}

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
  images?: string[]
  vendorReply?: VendorReply
}

type SortKey = "recent" | "highest" | "lowest" | "helpful"

interface ReviewsSectionProps {
  reviews: Review[]
  averageRating: number | undefined
  totalReviews: number
  productId?: string
  compact?: boolean
  maxVisible?: number
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Puan seçin">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={value === s}
          aria-label={`${s} yıldız`}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110 focus-visible:outline-none"
        >
          <Star
            className={cn(
              "h-7 w-7 transition-colors",
              (hovered || value) >= s ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            )}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-medium text-muted-foreground">
          {["", "Çok kötü", "Kötü", "Orta", "İyi", "Mükemmel"][value]}
        </span>
      )}
    </div>
  )
}

export function ReviewsSection({
  reviews: initialReviews,
  averageRating = 0,
  totalReviews,
  compact = false,
  maxVisible = 4,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [showAll, setShowAll] = useState(false)
  const [helpfulClicks, setHelpfulClicks] = useState<Set<string>>(new Set())
  const [sortKey, setSortKey] = useState<SortKey>("recent")
  const [showForm, setShowForm] = useState(false)

  // Auth + profile
  const reviewUser = useReviewUser()

  // Form state
  const [formRating, setFormRating] = useState(0)
  const [formTitle, setFormTitle] = useState("")
  const [formComment, setFormComment] = useState("")
  const [formName, setFormName] = useState("")
  const [formError, setFormError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Auto-fill name from profile whenever the form opens or user loads
  useEffect(() => {
    if (reviewUser.nameFromProfile) {
      setFormName(reviewUser.fullName)
    }
  }, [reviewUser.nameFromProfile, reviewUser.fullName])

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortKey === "highest") return b.rating - a.rating
    if (sortKey === "lowest") return a.rating - b.rating
    if (sortKey === "helpful") return b.helpful - a.helpful
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, maxVisible)

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => {
    const count = reviews.filter((r) => Math.floor(r.rating) === rating).length
    return { rating, count, percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0 }
  })

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicks((prev) => {
      const next = new Set(prev)
      next.has(reviewId) ? next.delete(reviewId) : next.add(reviewId)
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (formRating === 0) { setFormError("Lütfen bir puan seçin."); return }
    if (!formName.trim()) { setFormError("Lütfen adınızı girin."); return }
    if (!formComment.trim() || formComment.trim().length < 10) {
      setFormError("Yorum en az 10 karakter olmalıdır."); return
    }

    const newReview: Review = {
      id: `user-${Date.now()}`,
      userName: formName.trim(),
      rating: formRating,
      title: formTitle.trim() || "Değerlendirme",
      comment: formComment.trim(),
      date: new Date().toISOString().slice(0, 10),
      verified: false,
      helpful: 0,
    }

    setReviews((prev) => [newReview, ...prev])
    setFormRating(0)
    setFormTitle("")
    setFormComment("")
    setFormName("")
    setSubmitted(true)
    setShowForm(false)
    setTimeout(() => setSubmitted(false), 5000)
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" })

  const sortLabels: Record<SortKey, string> = {
    recent: "En Yeni",
    highest: "En Yüksek",
    lowest: "En Düşük",
    helpful: "En Faydalı",
  }

  return (
    <div className={cn("space-y-6", compact && "space-y-4")}>

      {/* Summary bar */}
      <div className={cn("flex flex-col md:flex-row gap-6 p-5 bg-secondary/40 rounded-2xl border", compact && "p-3")}>
        <div className="flex flex-col items-center justify-center text-center min-w-[120px]">
          <p className="text-5xl font-bold leading-none">{averageRating.toFixed(1)}</p>
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={cn("h-4 w-4", star <= Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1.5">{totalReviews} değerlendirme</p>
        </div>
        {!compact && (
          <div className="flex-1 space-y-1.5">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-10 flex-shrink-0">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </div>
                <Progress value={percentage} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
          <div className="flex flex-col items-center justify-center gap-2">
            <Button
              size="sm"
              className="gap-2 rounded-xl whitespace-nowrap"
              onClick={() => { setShowForm((v) => !v); setSubmitted(false) }}
            >
              <Star className="h-4 w-4" />
              {showForm ? "Vazgeç" : "Yorum Yaz"}
            </Button>
          </div>
      </div>

      {/* Success banner */}
      {submitted && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Yorumunuz eklendi. Teşekkür ederiz!
        </div>
      )}

      {/* Review submission form */}
      {showForm && (
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base">Değerlendirmenizi yazın</h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Formu kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Separator />

          {/* Login wall — shown while loading or when not logged in */}
          {(reviewUser.isLoading || !reviewUser.isLoggedIn) ? (
            <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary border">
                <LogIn className="h-7 w-7 text-muted-foreground" />
              </div>
              {reviewUser.isLoading ? (
                <p className="text-sm text-muted-foreground animate-pulse">Hesap bilgileri yükleniyor...</p>
              ) : (
                <>
                  <div>
                    <p className="font-semibold">Yorum yapmak için giriş yapın</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Değerlendirme yapabilmek için bir hesabınız olmalıdır. Giriş yaptıktan sonra adınız otomatik doldurulur.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" className="gap-2 rounded-xl">
                      <Link href="/login">
                        <LogIn className="h-4 w-4" />
                        Giriş Yap
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="rounded-xl">
                      <Link href="/auth/sign-up">Kayıt Ol</Link>
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Missing name warning */}
              {reviewUser.nameMissing && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    Profilinizde kayıtlı ad bilgisi bulunamadı. Lütfen aşağıya adınızı girin veya{" "}
                    <Link href="/account" className="underline font-medium hover:text-amber-900">
                      hesap sayfanızdan
                    </Link>{" "}
                    adınızı kaydedin.
                  </span>
                </div>
              )}

              {/* Star picker */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Puanınız <span className="text-red-500">*</span>
                </label>
                <StarPicker value={formRating} onChange={setFormRating} />
              </div>

              {/* Name — auto-filled and locked if from profile */}
              <div className="space-y-1.5">
                <label htmlFor="review-name" className="text-sm font-medium">
                  Adınız <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  {reviewUser.nameFromProfile && (
                    <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                      <UserCircle className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <input
                    id="review-name"
                    type="text"
                    value={formName}
                    onChange={(e) => !reviewUser.nameFromProfile && setFormName(e.target.value)}
                    readOnly={reviewUser.nameFromProfile}
                    placeholder="Adınız Soyadınız"
                    maxLength={60}
                    className={cn(
                      "w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition",
                      reviewUser.nameFromProfile && "pl-9 bg-primary/5 border-primary/30 text-foreground cursor-default select-none",
                      !reviewUser.nameFromProfile && reviewUser.nameMissing && "border-amber-400 focus-visible:ring-amber-400/50"
                    )}
                  />
                  {reviewUser.nameFromProfile && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary hidden sm:inline">Profilden</span>
                    </div>
                  )}
                </div>
                {reviewUser.nameFromProfile && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    Profilinizden otomatik dolduruldu.{" "}
                    <Link href="/account" className="underline hover:text-foreground">Değiştir</Link>
                  </p>
                )}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label htmlFor="review-title" className="text-sm font-medium">
                  Başlık{" "}
                  <span className="text-muted-foreground text-xs font-normal">(isteğe bağlı)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Yorumunuzu özetleyin"
                  maxLength={80}
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition"
                />
              </div>

              {/* Comment */}
              <div className="space-y-1.5">
                <label htmlFor="review-comment" className="text-sm font-medium">
                  Yorumunuz <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="review-comment"
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="Ürün hakkındaki deneyiminizi paylaşın..."
                  rows={4}
                  maxLength={800}
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">{formComment.length}/800</p>
              </div>

              {formError && (
                <p className="text-sm text-red-500 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Vazgeç
                </Button>
                <Button type="submit" size="sm" className="gap-2 rounded-xl">
                  <Send className="h-4 w-4" />
                  Yorumu Gönder
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Sort + count header */}
      {reviews.length > 0 && !compact && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">{reviews.length} yorum</span>
          <div className="flex items-center gap-1">
            {(Object.keys(sortLabels) as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  sortKey === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                {sortLabels[key]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews list */}
      {displayedReviews.length > 0 ? (
        <div className="space-y-4">
          {displayedReviews.map((review) => (
            <div
              key={review.id}
              className={cn(
                "rounded-xl border bg-card overflow-hidden transition-shadow hover:shadow-md",
                compact && "rounded-lg"
              )}
            >
              <div className={cn("p-4", compact && "p-3")}>
                <div className="flex items-start gap-3">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-secondary flex-shrink-0 ring-2 ring-border">
                    {review.userAvatar ? (
                      <Image src={review.userAvatar} alt={review.userName} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-secondary">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{review.userName}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs gap-1 py-0">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          Onaylı Alıcı
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={cn("h-3.5 w-3.5", star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30")} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDate(review.date)}</span>
                    </div>
                    {review.title && <p className="font-semibold text-sm mt-2">{review.title}</p>}
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{review.comment}</p>

                    {/* Review images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {review.images.map((img, i) => (
                          <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border flex-shrink-0">
                            <Image src={img} alt={`Yorum görseli ${i + 1}`} fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("h-7 text-xs gap-1 px-2", helpfulClicks.has(review.id) && "text-primary bg-primary/10")}
                        onClick={() => handleHelpful(review.id)}
                      >
                        <ThumbsUp className={cn("h-3.5 w-3.5", helpfulClicks.has(review.id) && "fill-current")} />
                        Faydalı ({review.helpful + (helpfulClicks.has(review.id) ? 1 : 0)})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor reply */}
              {review.vendorReply && (
                <>
                  <Separator />
                  <div className="px-4 py-3 bg-primary/5">
                    <div className="flex items-start gap-3">
                      <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-background border flex-shrink-0">
                        <Image src={review.vendorReply.vendorLogo} alt={review.vendorReply.vendorName} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-semibold text-primary">Satıcı Yanıtı</span>
                          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">{review.vendorReply.vendorName}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{formatDate(review.vendorReply.date)}</span>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{review.vendorReply.reply}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-xl bg-secondary/20">
          <Star className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">Henüz değerlendirme yapılmamış.</p>
          <p className="text-sm text-muted-foreground mt-1">Bu ürünü satın alan ilk değerlendiren siz olun!</p>
          {!compact && (
            <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={() => setShowForm(true)}>
              <Star className="h-4 w-4" /> Yorum Yaz
            </Button>
          )}
        </div>
      )}

      {reviews.length > maxVisible && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setShowAll(!showAll)} className="gap-1.5">
            {showAll
              ? <><ChevronUp className="h-4 w-4" /> Daha Az Göster</>
              : <><ChevronDown className="h-4 w-4" /> Tümünü Göster ({reviews.length})</>
            }
          </Button>
        </div>
      )}
    </div>
  )
}
