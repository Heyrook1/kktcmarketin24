"use client"

import type { User } from "@supabase/supabase-js"
import { AccountShell } from "@/components/account/account-shell"

interface AccountContentProps {
  user: User
  profile: Record<string, unknown> | null
}

export function AccountContent({ user, profile }: AccountContentProps) {
  return <AccountShell user={user} profile={profile} />
}
