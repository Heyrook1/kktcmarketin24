import { Skeleton } from "@/components/ui/skeleton"

export default function HelpLoading() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-3xl text-center">
          <Skeleton className="mx-auto mb-5 h-6 w-32 rounded-full" />
          <Skeleton className="mx-auto h-10 w-72 md:w-96" />
          <Skeleton className="mx-auto mt-4 h-5 w-80 max-w-full" />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl space-y-16 px-4 py-12">
        <section className="space-y-6">
          <Skeleton className="mx-auto h-8 w-64" />
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-28 rounded-full" />
            ))}
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <Skeleton className="mx-auto h-8 w-72" />
          <div className="grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-2xl border bg-card p-6">
                <Skeleton className="mb-4 h-6 w-2/3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <Skeleton className="mx-auto h-8 w-40" />
          <div className="grid gap-8 md:grid-cols-5">
            <div className="space-y-4 md:col-span-2">
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
            <div className="rounded-2xl border bg-card p-6 md:col-span-3">
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
