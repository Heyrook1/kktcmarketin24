import { Skeleton } from "@/components/ui/skeleton"

export default function PrivacyLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-56" />
          <div className="flex flex-wrap gap-2 pt-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-28 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-4">
          <Skeleton className="hidden h-72 rounded-xl lg:block" />
          <div className="space-y-8 lg:col-span-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[92%]" />
                <Skeleton className="h-4 w-[80%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
