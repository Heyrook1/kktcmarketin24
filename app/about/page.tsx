import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ShieldCheck, Users, MapPin, TrendingUp, Package, HeartHandshake } from "lucide-react"

export const metadata: Metadata = {
  title: "Hakkımızda | Marketin24",
  description:
    "KKTC'nin ilk çoklu satıcı pazaryeri Marketin24 hakkında bilgi edinin. Misyonumuz, vizyonumuz ve değerlerimiz.",
  openGraph: {
    title: "Hakkımızda | Marketin24",
    description: "KKTC'nin güvenilir çoklu satıcı pazaryeri hakkında daha fazla bilgi edinin.",
  },
}

const stats = [
  { label: "Aktif Satıcı",     value: "50+",   icon: Users },
  { label: "Ürün Çeşidi",      value: "1.000+", icon: Package },
  { label: "Mutlu Müşteri",    value: "5.000+", icon: HeartHandshake },
  { label: "KKTC Geneli Teslimat", value: "8 Bölge", icon: MapPin },
]

const values = [
  {
    icon: ShieldCheck,
    title: "Güven",
    description:
      "Tüm satıcılarımız kimlik ve belge doğrulamasından geçer. Onaylı rozeti yalnızca denetlenmiş mağazalara verilir.",
  },
  {
    icon: TrendingUp,
    title: "Büyüme",
    description:
      "KKTC'li girişimcilerin dijital pazara açılmasına destek olarak yerel ekonomiyi güçlendiriyoruz.",
  },
  {
    icon: HeartHandshake,
    title: "Müşteri Odaklılık",
    description:
      "Kolay iade, şeffaf fiyatlandırma ve güvenli ödeme ile alışverişinizi sorunsuz hale getiriyoruz.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">KKTC&apos;nin Dijital Çarşısı</h1>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Marketin24, Kuzey Kıbrıs Türk Cumhuriyeti&apos;ndeki onaylı satıcıları tek çatı altında
            buluşturan çoklu satıcı pazaryeridir. 2024 yılında kurulan platformumuz, yerel
            üreticiler ve girişimciler için güvenli bir dijital satış ortamı sunar.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-3 text-center p-6 rounded-2xl bg-secondary/40">
                <s.icon className="h-8 w-8 text-primary" />
                <span className="text-3xl font-bold">{s.value}</span>
                <span className="text-sm text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-4">Misyonumuz</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            KKTC&apos;deki küçük ve orta ölçekli işletmelerin, teknolojinin gücüyle müşterilere
            daha hızlı, daha güvenli ve daha ekonomik ulaşmasını sağlamak. Yerel üreticiyi
            desteklemek, tüketiciye güvenilir seçenekler sunmak ve ada ekonomisine katkıda
            bulunmak temel önceliklerimizdir.
          </p>
          <h2 className="text-2xl font-bold mb-4">Vizyonumuz</h2>
          <p className="text-muted-foreground leading-relaxed">
            Doğu Akdeniz&apos;in en güvenilir ve büyük yerel pazaryeri olmak; KKTC markalarını
            bölgesel ve global platformlara taşımak.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-secondary/20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Değerlerimiz</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl bg-background p-8 shadow-sm border">
                <v.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-4">Siz de Katılın</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Ürünlerinizi binlerce KKTC&apos;li müşteriye ulaştırmak için hemen satıcı başvurusu yapın.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/seller-application"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 font-semibold hover:bg-primary/90 transition-colors"
            >
              Satıcı Ol
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 font-semibold hover:bg-secondary transition-colors"
            >
              Bize Ulaşın
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
