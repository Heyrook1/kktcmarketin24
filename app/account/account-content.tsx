"use client"

import { useAccountStore } from "@/lib/store/account-store"
import { AuthGate } from "@/components/account/auth-gate"
import { AccountShell } from "@/components/account/account-shell"

export function AccountContent() {
  const { isLoggedIn } = useAccountStore()
  return isLoggedIn ? <AccountShell /> : <AuthGate />
}
