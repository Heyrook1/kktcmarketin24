import { redirect } from "next/navigation"

export default function MessagingPage() {
  redirect("/account?tab=messages")
}
