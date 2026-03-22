import type { Metadata } from "next"
import { HelpPageClient } from "./help-client"

export const metadata: Metadata = {
  title: "Yardım Merkezi | Marketin24",
  description:
    "Sık sorulan sorular, iade ve kargo politikası, iletişim formu. Marketin24 destek merkezi.",
  openGraph: {
    title: "Yardım Merkezi | Marketin24",
    description: "Sorularınız için Marketin24 yardım merkezini ziyaret edin.",
  },
}

export default function HelpPage() {
  return <HelpPageClient />
}
