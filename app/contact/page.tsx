import type { Metadata } from "next"
import Link from "next/link"
import { Mail, Phone, MapPin, Clock, MessageSquare, HelpCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "İletişim | Marketin24",
  description:
    "Marketin24 müşteri hizmetleri ile iletişime geçin. Soru, öneri ve şikayetleriniz için buradayız.",
  openGraph: {
    title: "İletişim | Marketin24",
    description: "Marketin24 destek ekibi ile iletişime geçin.",
  },
}

const contactItems = [
  {
    icon: Mail,
    label: "E-posta",
    value: "destek@marketin24.com",
    href: "mailto:destek@marketin24.com",
  },
  {
    icon: Phone,
    label: "Telefon",
    value: "+90 533 873 43 17",
    href: "tel:+905338734317",
  },
  {
    icon: MapPin,
    label: "Adres",
    value: "Lefkoşa, KKTC",
    href: "https://maps.google.com/?q=Lefkoşa,KKTC",
  },
  {
    icon: Clock,
    label: "Çalışma Saatleri",
    value: "Pazartesi – Cuma 09:00–18:00",
    href: null,
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Bize Ulaşın</h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Sorularınız, önerileriniz veya sorunlarınız için destek ekibimiz size yardımcı olmaktan memnuniyet duyar.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold mb-6">İletişim Bilgileri</h2>
            <div className="flex flex-col gap-5">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="text-base font-medium hover:text-primary transition-colors"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-base font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick links */}
            <div className="mt-10 rounded-2xl border bg-secondary/30 p-6">
              <h3 className="text-sm font-semibold mb-4">Hızlı Bağlantılar</h3>
              <div className="flex flex-col gap-3">
                <Link
                  href="/help"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  Yardım Merkezi &amp; Sık Sorulan Sorular
                </Link>
                <Link
                  href="/seller-application"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Satıcı Başvurusu
                </Link>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Mesaj Gönderin</h2>
            <form
              action="https://formspree.io/f/placeholder"
              method="POST"
              className="flex flex-col gap-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium">
                    Adınız Soyadınız
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ali Yılmaz"
                    className="rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-posta
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="ali@ornek.com"
                    className="rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-sm font-medium">
                  Konu
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="general">Genel Soru</option>
                  <option value="order">Sipariş &amp; Teslimat</option>
                  <option value="return">İade &amp; Değişim</option>
                  <option value="seller">Satıcı Desteği</option>
                  <option value="technical">Teknik Sorun</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-sm font-medium">
                  Mesajınız
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Mesajınızı buraya yazın..."
                  className="rounded-xl border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
              >
                Gönder
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
