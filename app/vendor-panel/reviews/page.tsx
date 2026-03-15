import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  )
}

export default async function VendorReviewsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/vendor-panel/reviews")

  const { data: store } = await supabase
    .from("vendor_stores").select("id").eq("owner_id", user.id).single()
  if (!store) redirect("/vendor-panel")

  const { data: reviews } = await supabase
    .from("vendor_reviews")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })

  const items = reviews ?? []
  const avgRating = items.length
    ? (items.reduce((s, r) => s + r.rating, 0) / items.length).toFixed(1)
    : null

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Yorumlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} müşteri yorumu</p>
        </div>
        {avgRating && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
            <span className="text-xl font-bold text-amber-700">{avgRating}</span>
            <span className="text-xs text-amber-600">/ 5</span>
          </div>
        )}
      </div>

      {/* Rating distribution */}
      {items.length > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-4 grid grid-cols-5 gap-3">
            {[5, 4, 3, 2, 1].map(star => {
              const count = items.filter(r => r.rating === star).length
              const pct = Math.round((count / items.length) * 100)
              return (
                <div key={star} className="flex flex-col items-center gap-1.5 text-xs">
                  <div className="w-full bg-muted rounded-full overflow-hidden h-20 flex flex-col justify-end">
                    <div
                      className="w-full bg-amber-400 rounded-full transition-all"
                      style={{ height: `${pct}%`, minHeight: pct > 0 ? 4 : 0 }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />{star}
                  </div>
                  <span className="font-semibold text-foreground">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Review list */}
      {items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Star className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Henüz yorum yapılmamış.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(review => (
            <Card key={review.id} className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {review.reviewer_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{review.reviewer_name}</p>
                      <StarRow rating={review.rating} />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(review.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{review.comment}</p>
                )}
                {!review.is_published && (
                  <p className="mt-2 text-xs text-amber-600 font-medium">Yayında Degil</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
