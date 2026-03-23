import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VendorSidebar } from "./vendor-sidebar"

export const dynamic = "force-dynamic"

export default async function VendorPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?next=/vendor-panel")

  return (
    <div className="flex min-h-screen bg-background">
      <VendorSidebar />
      <main className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  )
}
