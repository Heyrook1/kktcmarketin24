import type { Metadata } from "next"
import { AccountContent } from "./account-content"

export const metadata: Metadata = {
  title: "Hesabim",
  description: "Profilinizi, siparislerinizi, kuponlarinizi ve destek taleplerinizi yonetin.",
}

export default function AccountPage() {
  return <AccountContent />
}
