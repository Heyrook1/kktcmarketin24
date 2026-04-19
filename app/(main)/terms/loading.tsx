import { Skeleton } from "@/components/ui/skeleton"

export default function TermsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl space-y-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-48" />
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <Skeleton className="hidden h-80 rounded-xl lg:block" />
          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl border p-5">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-10/12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
