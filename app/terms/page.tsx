import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, FileText, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Kullanım Koşulları | Marketin24",
  description:
    "Marketin24 KKTC pazaryeri kullanım koşulları — alıcı, satıcı ve ödeme şartları, iade politikası ve gizlilik.",
}

const LAST_UPDATED = "23 Mart 2026"

// Named anchors as requested: user-terms, vendor-terms, payment-terms, returns-policy, privacy
const SECTIONS = [
  // ── User Terms ──────────────────────────────────────────────────────────
  {
    id: "user-terms",
    label: "Kullanıcı Koşulları",
    title: "Kullanıcı Koşulları",
    subsections: [
      {
        id: "scope",
        heading: "1.1 Kapsam ve Taraflar",
        content:
          "Bu Kullanım Koşulları, Marketin24 ("Platform") ile platformu kullanan tüm alıcı ve satıcılar ("Kullanıcı") arasındaki hukuki ilişkiyi düzenler. Platformu kullanmaya başlamakla bu koşulları okuduğunuzu ve kabul ettiğinizi beyan edersiniz. Koşulları kabul etmiyorsanız platformu kullanmayınız.",
      },
      {
        id: "account",
        heading: "1.2 Hesap Oluşturma ve Güvenlik",
        items: [
          "Sipariş vermek için kayıtlı bir hesap oluşturulması zorunludur.",
          "Her siparişten önce telefon numaranıza SMS ile 6 haneli doğrulama kodu (OTP) gönderilir.",
          "Doğrulanmayan siparişler 15 dakika içinde otomatik olarak iptal edilir ve stok rezervasyonu serbest bırakılır.",
          "Hesap bilgilerinizin gizliliğinden ve güvenliğinden siz sorumlusunuzdur.",
          "Şüpheli işlemleri derhal info@marketin24.com adresine bildirmeniz gerekmektedir.",
          "Başkası adına veya sahte bilgilerle hesap açmak kesinlikle yasaktır.",
        ],
      },
      {
        id: "buyer-obligations",
        heading: "1.3 Alıcı Yükümlülükleri",
        items: [
          "Gerçek ve güncel kişisel iletişim bilgileri sağlamak.",
          "SMS doğrulamasını zamanında tamamlamak.",
          "Teslimat adresinde bulunmak veya önceden teslim alacak kişiyi bildirmek.",
          "Kapıda ödeme siparişlerinde ödemeyi nakit olarak hazır bulundurmak.",
          "Platformu yasadışı amaçlarla veya bot/otomatize araçlarla kullanmamak.",
          "İade taleplerini dürüst ve gerçeğe uygun biçimde oluşturmak.",
        ],
      },
      {
        id: "prohibited",
        heading: "1.4 Yasaklı Davranışlar",
        items: [
          "Başka kullanıcıları yanıltmak, taciz etmek veya kötüye kullanmak.",
          "Sahte yorum veya derecelendirme bırakmak.",
          "Üçüncü taraf kimliğine bürünmek.",
          "Platform altyapısına yetkisiz erişim girişiminde bulunmak.",
          "Spam, kötü amaçlı yazılım veya zararlı içerik göndermek.",
        ],
      },
    ],
  },

  // ── Vendor Terms ─────────────────────────────────────────────────────────
  {
    id: "vendor-terms",
    label: "Satıcı Koşulları",
    title: "Satıcı Koşulları",
    subsections: [
      {
        id: "platform-role",
        heading: "2.1 Platform Rolü",
        content:
          "Marketin24, alıcı ile satıcı arasında aracılık hizmeti sunan bir elektronik pazaryeridir. Platform, satıcıların sunduğu ürün ve hizmetlerin tarafı değildir; söz konusu ürün ve hizmetlerden doğan sorumluluk satıcıya aittir. Platform, uyuşmazlıklarda arabuluculuk yapabilir; ancak tarafların yerine karar verme yetkisi yoktur.",
      },
      {
        id: "vendor-obligations",
        heading: "2.2 Satıcı Yükümlülükleri",
        items: [
          "Sunulan ürünlerin yasal, güvenli ve listeleme bilgileriyle örtüşür nitelikte olması.",
          "Stok bilgisinin gerçek zamanlı ve doğru tutulması.",
          "Onaylanan siparişlerin belirtilen süre içinde kargoya verilmesi.",
          "Müşteri iade taleplerini platform kuralları çerçevesinde değerlendirmek.",
          "Yasal fatura veya fiş düzenlemek.",
          "Platform tarafından belirlenen komisyon ve ücretleri zamanında ödemek.",
          "Ürün görselleri ve açıklamalarının gerçeği yansıtmasını sağlamak.",
        ],
      },
      {
        id: "prohibited-items",
        heading: "2.3 Yasaklı Ürünler",
        items: [
          "Ateşli silahlar, patlayıcılar ve bunların aksesuarları.",
          "Uyuşturucu ve psikotropik maddeler.",
          "Kalpazanlık ürünleri, sahte veya izinsiz lisanslı içerikler.",
          "Canlı hayvanlar ve nesli tehlike altındaki türlere ait ürünler.",
          "Reçeteli ilaçlar ve tıbbi cihazlar (yetkisiz satış).",
          "Pornografik veya müstehcen içerik.",
          "İnsan organları ve dokuları.",
        ],
      },
      {
        id: "vendor-termination",
        heading: "2.4 Hesap Askıya Alma",
        content:
          "Platform, yasaklı ürün listeme, sahtecilik, sürekli kötü müşteri yorumları veya bu koşulların ihlali durumunda satıcı hesabını önceden bildirimde bulunmaksızın askıya alma veya kapatma hakkını saklı tutar.",
      },
    ],
  },

  // ── Payment Terms ─────────────────────────────────────────────────────────
  {
    id: "payment-terms",
    label: "Ödeme Koşulları",
    title: "Ödeme Koşulları",
    subsections: [
      {
        id: "pricing",
        heading: "3.1 Fiyatlandırma ve Sipariş Tutarı",
        content:
          "Tüm ürün fiyatları, indirimler ve sipariş toplam tutarı sipariş anında sunucu tarafından veri tabanından hesaplanır. İstemci (tarayıcı) tarafından iletilen fiyat bilgileri hiçbir koşulda kabul edilmez; tüm fiyatlar sunucu kayıt sisteminden doğrulanır. Gösterilen fiyatlar KDV dahildir.",
      },
      {
        id: "cod",
        heading: "3.2 Kapıda Ödeme",
        items: [
          "Kapıda ödeme yalnızca kayıtlı ve SMS doğrulamalı hesaplara açıktır.",
          "Ödeme yalnızca nakit olarak kabul edilmektedir.",
          "Kargo görevlisi teslimat sırasında ödemeyi alır.",
          "İki ardışık kapıda ödeme iptali güvenilirlik puanınızı olumsuz etkiler.",
        ],
      },
      {
        id: "refunds-payment",
        heading: "3.3 Para İadesi",
        content:
          "Onaylanan iade taleplerinde para iadesi, ürün satıcıya ulaşıp onaylanmasından itibaren 3–7 iş günü içinde yapılır. İade yöntemi kapıda ödeme siparişlerinde banka havalesi / EFT yoluyla gerçekleştirilir.",
      },
    ],
  },

  // ── Returns Policy ───────────────────────────────────────────────────────
  {
    id: "returns-policy",
    label: "İade Politikası",
    title: "İade ve Değişim Politikası",
    subsections: [
      {
        id: "return-rights",
        heading: "4.1 İade Hakkı",
        content:
          "Tüketicinin Korunması Hakkında KKTC Mevzuatı çerçevesinde, ürün tesliminden itibaren 14 (on dört) takvim günü içinde iade hakkınız mevcuttur.",
      },
      {
        id: "return-conditions",
        heading: "4.2 İade Koşulları",
        items: [
          "Ürün orijinal ambalajında, kullanılmamış ve hasarsız olmalıdır.",
          "Tüm aksesuarlar, etiketler ve belgeler eksiksiz iade edilmelidir.",
          "Gıda ve içecek ürünleri iade kapsamı dışındadır.",
          "Kişisel bakım ürünleri (ambalaj açılmış) iade edilemez.",
          "İndirilen yazılım ve dijital içerikler iade kapsamı dışındadır.",
          "Özel sipariş veya kişiselleştirilmiş ürünler iade edilemez.",
        ],
      },
      {
        id: "return-process",
        heading: "4.3 İade Süreci",
        items: [
          "'Siparişlerim' sayfasından iade talebi oluşturun.",
          "Satıcının onayının ardından kargo iade kodu iletilir.",
          "Hasarlı veya yanlış ürün teslimatında iade kargo ücreti satıcı tarafından karşılanır.",
          "Para iadesi ürün satıcıya ulaştıktan sonra 3–7 iş günü içinde yapılır.",
          "Sonuç e-posta ve platform bildirimi ile iletilir.",
        ],
      },
    ],
  },

  // ── Privacy ───────────────────────────────────────────────────────────────
  {
    id: "privacy",
    label: "Gizlilik",
    title: "Gizlilik ve Veri Koruma",
    subsections: [
      {
        id: "data-collection",
        heading: "5.1 Toplanan Veriler",
        items: [
          "Ad, soyad, e-posta adresi ve telefon numarası.",
          "Teslimat adresleri.",
          "Sipariş geçmişi ve işlem verileri.",
          "IP adresi, tarayıcı bilgisi ve cihaz tanımlayıcıları.",
          "OTP doğrulama kayıtları ve zaman damgaları.",
        ],
      },
      {
        id: "data-use",
        heading: "5.2 Veri Kullanımı",
        content:
          "Kişisel verileriniz; siparişlerin işlenmesi, teslimatın gerçekleştirilmesi, müşteri desteği sağlanması, yasal yükümlülüklerin yerine getirilmesi ve platform güvenliğinin korunması amacıyla işlenir. Verileriniz, açık rızanız olmaksızın reklam amacıyla üçüncü taraflarla paylaşılmaz.",
      },
      {
        id: "kvkk",
        heading: "5.3 KVKK Hakları",
        items: [
          "Kişisel verilerinizin işlenip işlenmediğini öğrenme hakkı.",
          "İşlenen veriler hakkında bilgi talep etme hakkı.",
          "Yanlış verilerin düzeltilmesini isteme hakkı.",
          "Koşulların sağlanması halinde verilerin silinmesini talep etme hakkı.",
          "Veri işlemeye itiraz etme hakkı.",
          "Talep süresi: 30 takvim günü.",
        ],
      },
      {
        id: "privacy-link",
        heading: "5.4 Tam Gizlilik Politikası",
        content:
          "Kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğuna ilişkin ayrıntılı bilgi için Gizlilik Politikamızı inceleyebilirsiniz.",
        link: { href: "/privacy", label: "Gizlilik Politikasını Görüntüle" },
      },
    ],
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  {
    id: "legal",
    label: "Hukuki Hükümler",
    title: "Hukuki Hükümler",
    subsections: [
      {
        id: "liability",
        heading: "6.1 Sorumluluk Sınırlaması",
        content:
          "Platform, satıcıların ürün kalitesi ve teslimat performansı dahil olmak üzere kullanıcıların uğrayabileceği dolaylı veya özel zararlardan sorumlu değildir. Doğrudan zararlar bakımından azami sorumluluk tutarı ilgili işlem bedelini geçemez.",
      },
      {
        id: "dispute",
        heading: "6.2 Uyuşmazlık Çözümü",
        content:
          "Uyuşmazlıklar öncelikle platform üzerinden taraflar arasında müzakere yoluyla çözülmeye çalışılır. Müzakere yoluyla çözülemeyen uyuşmazlıklar Lefkoşa Tüketici Hakem Heyeti'ne veya mahkemelerine taşınabilir.",
      },
      {
        id: "jurisdiction",
        heading: "6.3 Uygulanacak Hukuk ve Yargı Yetkisi",
        content:
          "Bu Koşullar, Kuzey Kıbrıs Türk Cumhuriyeti (KKTC) hukukuna tabidir. Bu koşullardan doğan tüm uyuşmazlıkların çözümünde Lefkoşa mahkemeleri yetkilidir.",
      },
      {
        id: "ip",
        heading: "6.4 Fikri Mülkiyet",
        content:
          "Platform logosu, tasarımı, yazılım kodu ve içeriği Marketin24'e aittir. Satıcılar, kendi ürünlerine ilişkin içeriklerin haklarını elinde bulundurmakta ve bu içerikleri yayımlamak için gerekli lisanslara sahip olduklarını beyan eder. İçerik ihlali iddialarını info@marketin24.com adresine bildirebilirsiniz.",
      },
      {
        id: "changes",
        heading: "6.5 Koşullardaki Değişiklikler",
        content:
          "Kullanım Koşulları önceden bildirilerek güncellenebilir. Önemli değişikliklerde kayıtlı e-posta adresinize bildirim gönderilir. Değişiklik sonrası platformu kullanmaya devam etmeniz güncel koşulları kabul ettiğiniz anlamına gelir.",
      },
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── Dark navy hero header ─────────────────────────────────────────── */}
      <header className="bg-[oklch(0.22_0.06_255)] text-white px-4 pt-6 pb-12 md:pb-16">
        <div className="container mx-auto max-w-4xl">

          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Önceki Sayfaya Dön
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-4">
            <FileText className="h-3.5 w-3.5" />
            Yasal Belge
          </div>

          <h1 className="text-3xl font-bold text-balance md:text-4xl">
            Kullanım Koşulları
          </h1>
          <p className="mt-3 text-white/60 text-sm max-w-xl leading-relaxed">
            Marketin24 KKTC pazaryerini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.
            Lütfen dikkatlice okuyunuz.
          </p>
          <p className="mt-4 text-xs text-white/40">
            Son güncelleme: <span className="text-white/60">{LAST_UPDATED}</span>
          </p>

          {/* Quick-jump anchor pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">

          {/* Sticky ToC sidebar */}
          <nav aria-label="İçindekiler" className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border bg-card p-4 space-y-0.5">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                İçindekiler
              </p>
              {SECTIONS.map((s) => (
                <div key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground hover:bg-secondary hover:text-primary transition-colors"
                  >
                    {s.label}
                  </a>
                  {s.subsections.map((sub) => (
                    <a
                      key={sub.id}
                      href={`#${sub.id}`}
                      className="flex items-center gap-1.5 rounded-md pl-5 pr-2 py-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      {sub.heading}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <article className="space-y-12 min-w-0">

            {/* Notice banner */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary leading-relaxed">
              Bu koşullar platformumuzu kullanmadan önce dikkatlice okunmalıdır. Platformu kullanmaya
              devam ederek bu koşulları kabul etmiş sayılırsınız.
            </div>

            {SECTIONS.map((section) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-20 space-y-6"
              >
                {/* Section heading with accent bar */}
                <div className="flex items-center gap-3 border-b pb-3">
                  <div className="h-5 w-1 rounded-full bg-primary shrink-0" aria-hidden="true" />
                  <h2
                    id={`${section.id}-heading`}
                    className="text-xl font-bold"
                  >
                    {section.title}
                  </h2>
                </div>

                {/* Subsections */}
                {section.subsections.map((sub) => (
                  <div
                    key={sub.id}
                    id={sub.id}
                    className="scroll-mt-24 space-y-3 pl-4 border-l-2 border-border"
                  >
                    <h3 className="text-sm font-semibold text-foreground">
                      {sub.heading}
                    </h3>

                    {"content" in sub && sub.content && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {sub.content}
                      </p>
                    )}

                    {"items" in sub && sub.items && (
                      <ul className="space-y-2">
                        {sub.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-muted-foreground leading-relaxed"
                          >
                            <span
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {"link" in sub && sub.link && (
                      <Link
                        href={sub.link.href}
                        className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                      >
                        {sub.link.label}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                ))}
              </section>
            ))}

            {/* Footer row */}
            <div className="border-t pt-8 flex flex-col sm:flex-row gap-4 justify-between items-start text-xs text-muted-foreground">
              <div className="space-y-1">
                <p className="font-medium text-foreground">İletişim</p>
                <p>
                  <a href="mailto:info@marketin24.com" className="text-primary underline underline-offset-2">
                    info@marketin24.com
                  </a>
                  {" "}| +90 533 873 43 17 | Lefkoşa, KKTC
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                  Gizlilik Politikası
                </Link>
                <Link href="/help" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                  Yardım Merkezi
                </Link>
              </div>
            </div>

          </article>
        </div>
      </div>
    </div>
  )
}
