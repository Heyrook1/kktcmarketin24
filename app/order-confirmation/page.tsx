import { redirect } from "next/navigation"

export default function OrderConfirmationIndexPage() {
  redirect("/account?tab=orders")
}
