import type { Metadata } from "next"
import Link from "next/link"
import { FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Kullanım Şartları | Marketin24",
  description:
    "Marketin24 platformunu kullanırken geçerli olan kullanım şartlarını, alıcı ve satıcı sorumluluklarını öğrenin.",
}

const LAST_UPDATED = "22 Mart 2026"

const SECTIONS = [
  {
    id: "platform-kullanimi",
    title: "1. Platform Kullanımı",
    content: `Marketin24, Kuzey Kıbrıs Türk Cumhuriyeti'nde faaliyet gösteren elektronik bir pazaryeri platformudur. Platformu kullanmaya başlamakla bu şartları kabul etmiş sayılırsınız. Platform, alıcı ile satıcı arasında aracılık hizmeti sunar; satıcıların sunduğu ürün ve hizmetlerin tarafı değildir. Sipariş vermek için kayıtlı bir hesap oluşturulması zorunludur. Her siparişten önce telefon numaranıza SMS ile 6 haneli doğrulama kodu gönderilir; 15 dakika içinde doğrulanmayan siparişler otomatik olarak iptal edilir.`,
  },
  {
    id: "satici-sorumluluklari",
    title: "2. Satıcı Sorumlulukları",
    items: [
      "Listelenen ürünlerin yasal, güvenli ve ilan bilgileriyle örtüşür nitelikte olması.",
      "Stok bilgisinin gerçek zamanlı ve doğru tutulması.",
      "Onaylanan siparişlerin belirtilen süre içinde kargoya verilmesi.",
      "Müşteri iade taleplerinin platform kuralları çerçevesinde değerlendirilmesi.",
      "Yasal fatura veya fiş düzenlenmesi.",
      "Platform tarafından belirlenen komisyon ve ücretlerin zamanında ödenmesi.",
      "Yanıltıcı, sahte veya izinsiz lisanslı ürün listelememek.",
    ],
  },
  {
    id: "alici-sorumluluklari",
    title: "3. Alıcı Sorumlulukları",
    items: [
      "Gerçek ve güncel iletişim bilgileri sağlamak.",
      "SMS doğrulamasını zamanında tamamlamak.",
      "Teslimat adresinde bulunmak veya önceden teslim alacak kişiyi bildirmek.",
      "Kapıda ödeme siparişlerinde ödemeyi nakit olarak hazır tutmak.",
      "Platformu yasadışı amaçlarla, bot veya otomatize araçlarla kullanmamak.",
      "İade taleplerini dürüst ve gerçeğe uygun biçimde oluşturmak.",
    ],
  },
  {
    id: "odeme",
    title: "4. Ödeme — Kapıda Ödeme",
    content: `Marketin24'te ödeme yöntemi olarak yalnızca kapıda nakit ödeme kabul edilmektedir. Siparişiniz SMS ile doğrulandıktan ve satıcı tarafından onaylandıktan sonra ürün teslimatı sırasında ödeme yapılır. Tüm ürün fiyatları ve sipariş toplam tutarı, sipariş anında sunucumuz tarafından veri tabanından hesaplanır; istemci taraflı fiyat değişiklikleri kabul edilmez. Gösterilen fiyatlar KDV dahil olup geçerli kargo ücreti ayrıca belirtilir.`,
  },
  {
    id: "iade-politikasi",
    title: "5. İade Politikası",
    items: [
      "Ürün tesliminden itibaren 14 (on dört) gün içinde iade hakkı mevcuttur.",
      "İade edilecek ürün orijinal ambalajında, kullanılmamış ve hasarsız olmalıdır.",
      "Gıda, kişisel bakım, indirilenler ve açılmış yazılım ürünleri iade kapsamı dışındadır.",
      "Hasarlı veya yanlış ürün teslimatında iade kargo ücreti satıcı tarafından karşılanır.",
      "Para iadesi, ürünün satıcıya ulaşıp onaylanmasından itibaren 3–7 iş günü içinde yapılır.",
      "İade talebi 'Siparişlerim' sayfasından oluşturulur; sonuç e-posta ile bildirilir.",
    ],
  },
  {
    id: "gizlilik",
    title: "6. Gizlilik",
    content: `Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenmektedir. Toplanan veriler; kimlik bilgileri, sipariş bilgileri, teknik veriler ve SMS OTP loglarını kapsamakta olup yalnızca hizmetin sunulması, dolandırıcılığın önlenmesi ve yasal yükümlülüklerin yerine getirilmesi amacıyla kullanılmaktadır. Verileriniz üçüncü taraflarla (kargo şirketi, SMS sağlayıcısı, yasal talepler) yalnızca zorunlu hallerde paylaşılır. Ayrıntılı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.`,
  },
  {
    id: "yasakli",
    title: "7. Yasaklı Ürün ve Davranışlar",
    items: [
      "Ateşli silahlar, patlayıcılar ve bunların parçaları.",
      "Uyuşturucu ve psikotropik maddeler.",
      "Sahte, kalpazanlık veya izinsiz lisanslı ürünler.",
      "Canlı hayvanlar ve nesli tehlike altındaki türlere ait ürünler.",
      "Reçeteli ilaçlar ve tıbbi cihazlar (yetkisiz satış).",
      "Sahte yorum, derecelendirme veya üçüncü taraf kimliğine bürünme.",
    ],
  },
  {
    id: "ip",
    title: "8. Fikri Mülkiyet",
    content: `Platform logosu, tasarımı, kodu ve içeriği Marketin24'e aittir. Satıcılar, kendi ürünlerine ilişkin içeriklerin haklarını elinde bulundurmakta ve bu içerikleri yayımlamak için gerekli lisanslara sahip olduklarını beyan etmektedir. İçerik ihlali iddialarını info@marketin24.com adresine bildirebilirsiniz.`,
  },
  {
    id: "sorumluluk",
    title: "9. Sorumluluk Sınırlaması",
    content: `Platform, satıcıların ürün kalitesi ve teslimat performansı dahil olmak üzere kullanıcıların uğrayabileceği dolaylı veya özel zararlardan sorumlu değildir. Doğrudan zararlar bakımından azami sorumluluk tutarı, ilgili işlem bedelini aşamaz.`,
  },
  {
    id: "hukuk",
    title: "10. Uygulanacak Hukuk",
    content: `Bu şartlar, Kuzey Kıbrıs Türk Cumhuriyeti hukukuna tabidir. Uyuşmazlıklar öncelikle taraflar arasında müzakere yoluyla çözülmeye çalışılır; çözüme kavuşturulamazsa Lefkoşa mahkemelerinde görülür.`,
  },
  {
    id: "iletisim",
    title: "11. İletişim",
    content: `Bu şartlar hakkındaki sorularınız için: info@marketin24.com | +90 533 873 43 17 | Lefkoşa, KKTC`,
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-primary text-primary-foreground px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-4">
            <FileText className="h-3.5 w-3.5" />
            Yasal
          </div>
          <h1 className="text-3xl font-bold text-balance md:text-4xl">Kullanım Şartları</h1>
          <p className="mt-2 text-primary-foreground/75 text-sm">
            Son güncelleme: {LAST_UPDATED}
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-4">

          {/* Table of Contents */}
          <nav aria-label="İçindekiler" className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                İçindekiler
              </p>
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-xs text-muted-foreground hover:text-primary transition-colors py-0.5 leading-relaxed"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </nav>

          {/* Content */}
          <article className="lg:col-span-3 space-y-10">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary leading-relaxed">
              Bu şartlar platformumuzu kullanmadan önce dikkatlice okunmalıdır. Platformu kullanmaya devam ederek bu şartları kabul etmiş sayılırsınız.
            </div>

            {SECTIONS.map(({ id, title, content, items }) => (
              <section
                key={id}
                id={id}
                aria-labelledby={`${id}-heading`}
                className="space-y-3 scroll-mt-20"
              >
                <h2 id={`${id}-heading`} className="text-lg font-semibold border-b pb-2">
                  {title}
                </h2>
                {content && (
                  <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
                )}
                {items && (
                  <ul className="space-y-2">
                    {items.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
                      >
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
                          aria-hidden="true"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            <div className="border-t pt-8 flex flex-col sm:flex-row gap-3 justify-between items-start">
              <p className="text-xs text-muted-foreground">
                Sorularınız için:{" "}
                <a
                  href="mailto:info@marketin24.com"
                  className="text-primary underline underline-offset-2"
                >
                  info@marketin24.com
                </a>
              </p>
              <Link
                href="/privacy"
                className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Gizlilik Politikası &rarr;
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
