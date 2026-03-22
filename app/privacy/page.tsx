import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Shield, ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Marketin24",
  description:
    "Marketin24 KKTC pazaryeri gizlilik politikası — KVKK kapsamında kişisel veri toplama, kullanım, paylaşım, çerezler ve kullanıcı hakları.",
}

const LAST_UPDATED = "23 Mart 2026"

// Named top-level anchors: data-collected, usage, third-party, cookies, user-rights
const SECTIONS = [
  // ── 1. Veri Sorumlusu ───────────────────────────────────────────────────
  {
    id: "controller",
    label: "Veri Sorumlusu",
    title: "Veri Sorumlusu",
    subsections: [
      {
        id: "controller-info",
        heading: "1.1 Kim Olduğumuz",
        content:
          'Marketin24 ("Platform", "biz", "bizim"), 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusudur. Platformu kullanarak bu politikayı okuduğunuzu ve kabul ettiğinizi beyan edersiniz. İletişim: info@marketin24.com',
      },
    ],
  },
  // ── 2. Toplanan Veriler ─────────────────────────────────────────────────
  {
    id: "data-collected",
    label: "Toplanan Veriler",
    title: "Topladığımız Kişisel Veriler",
    subsections: [
      {
        id: "identity-data",
        heading: "2.1 Kimlik ve İletişim Bilgileri",
        items: [
          "Ad ve soyad.",
          "E-posta adresi.",
          "Telefon numarası (SMS OTP doğrulaması için).",
          "Teslimat ve fatura adresi.",
        ],
      },
      {
        id: "transaction-data",
        heading: "2.2 İşlem ve Sipariş Bilgileri",
        items: [
          "Sipariş içeriği, ürün ve miktar bilgisi.",
          "Ödeme yöntemi (kart numaraları tarafımızca saklanmaz; ödeme altyapısı PCI-DSS uyumludur).",
          "Teslimat durumu ve kargo takip verileri.",
          "İade ve şikâyet geçmişi.",
          "Sipariş geçmişi ve toplam harcama tutarı.",
        ],
      },
      {
        id: "browsing-data",
        heading: "2.3 Gezinme ve Davranış Verileri",
        items: [
          "Ziyaret edilen ürün sayfaları ve kategori geçmişi.",
          "Arama sorguları ve filtre kullanımı.",
          "Sayfada geçirilen süre ve tıklama eylemleri.",
          "Sepete eklenen ancak satın alınmayan ürünler (terk edilmiş sepet verisi).",
          "Favori listesine eklenen ürünler.",
          "Cihaz tipi, ekran çözünürlüğü ve tarayıcı dili.",
        ],
      },
      {
        id: "technical-data",
        heading: "2.4 Teknik Veriler",
        items: [
          "IP adresi.",
          "Tarayıcı türü ve sürümü (user-agent).",
          "Oturum kimliği (session ID).",
          "SMS OTP gönderim zamanı, telefon numarası ve doğrulama sonucu.",
          "Form gönderimleri için IP adresi, user-agent ve gönderim zamanı.",
          "Redis'te geçici tutulan sepet içeriği ve stok rezervasyonu (maks. 7 gün TTL, ardından otomatik silinir).",
        ],
      },
    ],
  },
  // ── 3. Kullanım Amaçları ────────────────────────────────────────────────
  {
    id: "usage",
    label: "Nasıl Kullanıyoruz",
    title: "Verilerinizi Nasıl Kullanıyoruz",
    subsections: [
      {
        id: "order-fulfillment",
        heading: "3.1 Sipariş Gerçekleştirme",
        items: [
          "Sipariş oluşturma, onaylama ve takip hizmetinin yürütülmesi.",
          "SMS ile kimlik doğrulama (sipariş OTP).",
          "Kargo ve teslimat koordinasyonu.",
          "Kapıda ödeme tahsilatı için kurye bilgilendirmesi.",
          "Fatura ve vergi belgelerinin düzenlenmesi.",
        ],
      },
      {
        id: "vendor-analytics",
        heading: "3.2 Satıcı Analitiği",
        items: [
          "Satıcı mağaza panelinde sipariş bazlı satış raporlarının sunulması.",
          "Ürün görüntülenme, sepete ekleme ve satış dönüşüm oranlarının hesaplanması.",
          "Stok düzeyi uyarıları ve düşük performanslı ürün bildirimleri.",
          "Kategori bazlı satış trendlerinin anonimleştirilmiş olarak paylaşılması.",
          "Güvenilirlik skoru hesaplaması (teslimat başarısı, müşteri memnuniyeti).",
        ],
      },
      {
        id: "platform-improvement",
        heading: "3.3 Platform Geliştirme",
        items: [
          "Gezinme ve davranış verilerinin analiz edilerek kullanıcı deneyiminin iyileştirilmesi.",
          "Arama algoritmalarının kişiselleştirilmesi ve ürün önerilerinin geliştirilmesi.",
          "A/B testleri ve yeni özellik doğrulaması.",
          "Hata tespiti, performans izleme ve altyapı optimizasyonu.",
        ],
      },
      {
        id: "security-fraud",
        heading: "3.4 Güvenlik ve Sahtekârlık Önleme",
        items: [
          "Bot saldırıları ve otomatize kötüye kullanımın tespit edilmesi (Cloudflare Turnstile).",
          "Anormal sipariş davranışlarının izlenmesi.",
          "Şüpheli hesapların askıya alınması ve incelenmesi.",
          "Yasal yükümlülüklerin yerine getirilmesi.",
        ],
      },
    ],
  },
  // ── 4. Üçüncü Taraf Paylaşımı ───────────────────────────────────────────
  {
    id: "third-party",
    label: "Üçüncü Taraf Paylaşımı",
    title: "Üçüncü Taraflarla Paylaşım",
    subsections: [
      {
        id: "no-sale",
        heading: "4.1 Temel İlke",
        content:
          "Kişisel verileriniz hiçbir koşulda ticari amaçla üçüncü taraflara satılmaz veya rızanız olmaksızın reklam amacıyla paylaşılmaz.",
      },
      {
        id: "service-providers",
        heading: "4.2 Altyapı ve Hizmet Sağlayıcılar",
        items: [
          "Kargo firmaları — yalnızca ad, adres ve telefon numarası, teslimat amacıyla.",
          "SMS sağlayıcıları (Netgsm / İletimerkezi) — sipariş OTP iletimi için telefon numarası.",
          "Supabase — şifreli bağlantı ile Avrupa bölgesindeki veri merkezinde barındırma.",
          "Upstash (Redis) — geçici sepet ve OTP verileri; TTL dolduğunda otomatik silme.",
          "Cloudflare Turnstile — yalnızca bot tespiti; form içerikleri Cloudflare'e iletilmez.",
        ],
      },
      {
        id: "legal-disclosure",
        heading: "4.3 Yasal Zorunluluk",
        content:
          "Mahkeme kararı, resmi makam talebi veya yasal zorunluluk bulunması hâlinde yetkili kamu kurum ve kuruluşlarıyla paylaşım yapılabilir. Bu durumda mümkün olduğu ölçüde önceden bilgilendirme yapılır.",
      },
    ],
  },
  // ── 5. Çerezler ─────────────────────────────────────────────────────────
  {
    id: "cookies",
    label: "Çerezler",
    title: "Çerez Politikası",
    subsections: [
      {
        id: "cookies-used",
        heading: "5.1 Kullandığımız Çerezler",
        items: [
          "Oturum çerezleri (HTTP-only, Secure) — kullanıcı girişinin sürdürülmesi.",
          "Sepet çerezi — oturum boyunca sepet içeriğinin saklanması.",
          "CSRF koruma çerezi — form güvenliği.",
          "Dil ve para birimi tercihi çerezi — kullanıcı tercihlerinin hatırlanması.",
        ],
      },
      {
        id: "no-tracking",
        heading: "5.2 Kullanmadığımız Çerezler",
        content:
          "Platform üçüncü taraf reklam, yeniden hedefleme (remarketing) veya sosyal medya izleme çerezleri kullanmamaktadır. Google Analytics ya da benzer analitik araçlardan kaynaklanan izleme çerezleri yerleştirilmemektedir.",
      },
      {
        id: "cookie-control",
        heading: "5.3 Çerez Yönetimi",
        content:
          "Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilir veya silebilirsiniz. Ancak oturum çerezlerinin devre dışı bırakılması durumunda platforma giriş yapamaz ve sipariş veremezsiniz.",
      },
    ],
  },
  // ── 6. Kullanıcı Hakları ────────────────────────────────────────────────
  {
    id: "user-rights",
    label: "Kullanıcı Hakları",
    title: "Haklarınız (KVKK m. 11)",
    subsections: [
      {
        id: "rights-list",
        heading: "6.1 Sahip Olduğunuz Haklar",
        items: [
          "Erişim hakkı: kişisel verilerinizin işlenip işlenmediğini ve hangi verilerin tutulduğunu öğrenme.",
          "Düzeltme hakkı: eksik veya yanlış verilerin güncellenmesini talep etme.",
          "Silme hakkı: yasal saklama süreleri saklı kalmak kaydıyla verilerinizin silinmesini isteme.",
          "İşlemeyi kısıtlama hakkı: belirli amaçlarla veri işlenmesini durdurmasını talep etme.",
          "İtiraz hakkı: otomatik işleme sonuçlarına ve meşru menfaat gerekçesine dayalı işlemelere itiraz etme.",
          "Veri taşınabilirliği: verilerinizi yapılandırılmış ve makine tarafından okunabilir biçimde talep etme.",
          "Tazminat hakkı: kanuna aykırı veri işleme nedeniyle uğranılan zararın giderilmesini isteme.",
        ],
      },
      {
        id: "how-to-exercise",
        heading: "6.2 Hakları Nasıl Kullanırsınız",
        content:
          "Haklarınızı kullanmak için info@marketin24.com adresine kimliğinizi doğrulayan bir e-posta gönderin. Talepler en geç 30 gün içinde yanıtlanır. Yanıttan memnun kalmamanız hâlinde Kişisel Verileri Koruma Kurumu'na (kvkk.gov.tr) başvurabilirsiniz.",
      },
      {
        id: "retention",
        heading: "6.3 Saklama Süreleri",
        items: [
          "Sipariş ve müşteri kayıtları: son işlemden itibaren 10 yıl (Vergi Usul Kanunu).",
          "OTP logları ve form gönderimleri: 1 yıl.",
          "IP adresi ve erişim logları: 2 yıl (5651 sayılı Kanun).",
          "Redis geçici verileri (sepet, OTP, stok rezervasyonu): 15 dakika – 7 gün TTL.",
          "Pazarlama rızası geri alındığında ilgili veriler 30 gün içinde silinir.",
        ],
      },
    ],
  },
  // ── 7. Güvenlik ─────────────────────────────────────────────────────────
  {
    id: "security",
    label: "Güvenlik",
    title: "Veri Güvenliği",
    subsections: [
      {
        id: "security-measures",
        heading: "7.1 Teknik Önlemler",
        items: [
          "Tüm bağlantılar TLS 1.2+ ile şifrelenmektedir.",
          "Parolalar bcrypt ile hash'lenerek saklanır; düz metin parola tutulmaz.",
          "Kart numaraları tarafımızca işlenmez; ödemeler PCI-DSS uyumlu altyapıdan geçer.",
          "Veritabanı erişimi satır düzeyi güvenlik (Row-Level Security) ile kısıtlanmıştır.",
          "Sisteme yetkisiz erişim girişimleri kayıt altına alınmakta ve uyarı tetiklenmektedir.",
        ],
      },
    ],
  },
  // ── 8. Değişiklikler ────────────────────────────────────────────────────
  {
    id: "changes",
    label: "Politika Değişiklikleri",
    title: "Politika Değişiklikleri",
    subsections: [
      {
        id: "changes-notice",
        heading: "8.1 Güncelleme Bildirimi",
        content:
          "Bu politika önceden bildirim yapılarak güncellenebilir. Önemli değişikliklerde kayıtlı e-posta adresinize bildirim gönderilir. Güncel versiyona her zaman bu sayfadan ulaşabilirsiniz. Değişiklik sonrası platformu kullanmaya devam etmeniz güncel politikayı kabul ettiğiniz anlamına gelir.",
      },
    ],
  },
]

// Quick-jump anchor pills matching the 5 requested anchors
const QUICK_LINKS = [
  { id: "data-collected", label: "Toplanan Veriler" },
  { id: "usage",          label: "Kullanım Amaçları" },
  { id: "third-party",    label: "Üçüncü Taraf Paylaşımı" },
  { id: "cookies",        label: "Çerezler" },
  { id: "user-rights",    label: "Kullanıcı Hakları" },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Dark navy header — matches /terms design */}
      <section
        className="border-b px-4 py-12 md:py-16"
        style={{ background: "oklch(0.22 0.06 255)", color: "white" }}
      >
        <div className="container mx-auto max-w-5xl">

          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Önceki Sayfaya Dön
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-4">
            <Shield className="h-3.5 w-3.5" />
            Gizlilik
          </div>

          <h1 className="text-3xl font-bold text-balance md:text-4xl">
            Gizlilik Politikası
          </h1>
          <p className="mt-2 text-white/65 text-sm">
            Son güncelleme: {LAST_UPDATED} &nbsp;·&nbsp; KVKK Uyumlu
          </p>

          {/* Quick-jump anchor pills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {QUICK_LINKS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-4">

          {/* Sticky ToC sidebar */}
          <nav aria-label="İçindekiler" className="hidden lg:block">
            <div className="sticky top-20 rounded-xl border bg-card p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                İçindekiler
              </p>
              {SECTIONS.map((section) => (
                <div key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block text-xs font-medium text-foreground hover:text-primary transition-colors py-0.5"
                  >
                    {section.label}
                  </a>
                  {section.subsections.map((sub) => (
                    <a
                      key={sub.id}
                      href={`#${sub.id}`}
                      className="block text-xs text-muted-foreground hover:text-primary transition-colors py-0.5 pl-3 leading-relaxed"
                    >
                      {sub.heading}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </nav>

          {/* Main content */}
          <article className="lg:col-span-3 space-y-12">

            {/* KVKK notice banner */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary leading-relaxed">
              Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamındaki
              aydınlatma yükümlülüğümüz çerçevesinde hazırlanmıştır. Platformumuzu kullanarak
              bu politikayı okuduğunuzu ve kabul ettiğinizi beyan edersiniz.
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
                  <div className="h-6 w-1 rounded-full bg-primary shrink-0" aria-hidden="true" />
                  <h2
                    id={`${section.id}-heading`}
                    className="text-xl font-bold"
                  >
                    {section.title}
                  </h2>
                </div>

                {section.subsections.map((sub) => (
                  <div
                    key={sub.id}
                    id={sub.id}
                    className="scroll-mt-20 rounded-xl border bg-card p-5 space-y-3"
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
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            ))}

            {/* Footer contact + cross-link */}
            <div className="border-t pt-8 space-y-4">
              <div className="rounded-xl border bg-secondary/40 p-5 space-y-2">
                <p className="text-sm font-semibold">Gizlilikle İlgili Sorularınız için</p>
                <a
                  href="mailto:info@marketin24.com"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  info@marketin24.com
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <p className="text-xs text-muted-foreground">
                  Talepleriniz en geç 30 gün içinde yanıtlanır.
                  Yanıttan memnun kalmamanız hâlinde{" "}
                  <a
                    href="https://www.kvkk.gov.tr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    kvkk.gov.tr
                  </a>{" "}
                  adresinden Kişisel Verileri Koruma Kurumu&apos;na başvurabilirsiniz.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between text-xs text-muted-foreground">
                <span>Marketin24 &copy; {new Date().getFullYear()} — Tüm hakları saklıdır.</span>
                <Link
                  href="/terms"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  Kullanım Koşulları &rarr;
                </Link>
              </div>
            </div>

          </article>
        </div>
      </div>
    </div>
  )
}
