"use client"

import { Suspense } from "react"
import type { User } from "@supabase/supabase-js"
import { AccountShell } from "@/components/account/account-shell"

interface AccountContentProps {
  user: User
  profile: Record<string, unknown> | null
}

function AccountShellFallback() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse mb-4" />
      <div className="h-64 rounded-xl border bg-card animate-pulse" />
    </div>
  )
}

export function AccountContent({ user, profile }: AccountContentProps) {
  return (
    <Suspense fallback={<AccountShellFallback />}>
      <AccountShell user={user} profile={profile} />
    </Suspense>
  )
}
