import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <main className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="space-y-8">
        <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
          <Skeleton className="mb-4 h-5 w-32 rounded-full" />
          <Skeleton className="mb-3 h-10 w-full max-w-xl" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border p-4">
                <Skeleton className="mb-4 h-10 w-10 rounded-xl" />
                <Skeleton className="mb-2 h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-3 rounded-2xl border bg-card p-3">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-5 w-1/3" />
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
