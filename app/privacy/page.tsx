import type { Metadata } from "next"
import Link from "next/link"
import { Shield } from "lucide-react"

export const metadata: Metadata = {
  title: "Gizlilik Politikası | Marketin24",
  description:
    "Marketin24 olarak kişisel verilerinizi KVKK kapsamında nasıl işlediğimizi, sakladığımızı ve koruduğumuzu öğrenin.",
}

const LAST_UPDATED = "22 Mart 2026"

const SECTIONS = [
  {
    id: "toplanan-veriler",
    title: "1. Toplanan Veriler",
    items: [
      "Kimlik bilgileri: ad, soyad, e-posta adresi, telefon numarası.",
      "İşlem bilgileri: sipariş içeriği, teslimat adresi, ödeme yöntemi (kart numarası tarafımızca saklanmaz).",
      "Teknik veriler: IP adresi, tarayıcı bilgisi (user-agent), oturum kimliği.",
      "SMS OTP logları: sipariş doğrulamalarında gönderilen kodların gönderim zamanı, telefon numarası ve sonucu.",
      "Form gönderimleri: iletişim ve satıcı başvuru formlarındaki veriler, IP adresi ve gönderim zamanı.",
      "Redis geçici verileri: sepet içeriği, stok rezervasyonu ve OTP kodları maksimum 15 dakika veya oturum süresince tutulur; ardından otomatik silinir.",
    ],
  },
  {
    id: "kullanim-amaci",
    title: "2. Kullanım Amacı",
    items: [
      "Sipariş oluşturma, onaylama ve takip hizmetinin sunulması.",
      "SMS ile kimlik doğrulama (sipariş OTP).",
      "Kargo ve teslimat koordinasyonu.",
      "Yasal yükümlülüklerin yerine getirilmesi ve vergi belgelerinin düzenlenmesi.",
      "Müşteri desteği ve şikâyet yönetimi.",
      "Dolandırıcılık, bot saldırısı ve kötüye kullanımın önlenmesi.",
    ],
  },
  {
    id: "hukuki-dayanak",
    title: "3. Hukuki Dayanak (KVKK)",
    content: `Verileriniz; 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında sözleşmenin ifası (m. 5/2-c), meşru menfaat (m. 5/2-f) ve yasal yükümlülük (m. 5/2-ç) hukuki dayanakları çerçevesinde işlenmektedir. Pazarlama iletişimleri için ayrıca açık rıza alınmaktadır. Marketin24, KVKK kapsamında veri sorumlusudur.`,
  },
  {
    id: "veri-guvenligi",
    title: "4. Veri Güvenliği",
    items: [
      "Tüm veriler TLS 1.2+ ile şifreli bağlantı üzerinden iletilir.",
      "Parolalar bcrypt ile hash'lenerek saklanır; düz metin parola tarafımızca tutulmaz.",
      "Kart numaraları işlenmez; ödeme işlemleri PCI-DSS uyumlu altyapılar üzerinden yürütülür.",
      "Supabase veri tabanı Avrupa bölgesinde şifreli bağlantıyla barındırılmaktadır.",
      "Upstash Redis üzerindeki geçici veriler (sepet, OTP) TTL süresi dolunca otomatik silinir.",
      "Sisteme yetkisiz erişim girişimleri kayıt altına alınmaktadır.",
    ],
  },
  {
    id: "cerezler",
    title: "5. Çerezler",
    content: `Platform, oturum yönetimi ve güvenlik amacıyla yalnızca HTTP-only çerezler kullanmaktadır. Analitik veya reklam çerezleri yerleştirilmemektedir. Cloudflare Turnstile yalnızca bot tespiti amacıyla kullanılır; form içerikleri Cloudflare'e iletilmez. Tarayıcı ayarlarından çerezleri yönetebilirsiniz; ancak bazı işlevler çerezler devre dışıyken çalışmayabilir.`,
  },
  {
    id: "veri-paylasimi",
    title: "6. Veri Paylaşımı",
    items: [
      "Kargo şirketleri: ad, adres ve telefon bilgisi, yalnızca teslimat amacıyla.",
      "SMS sağlayıcıları (Netgsm / İletimerkezi): sipariş OTP iletimi için telefon numarası.",
      "Supabase ve Upstash: platform altyapısı — veri işleme sözleşmeleri mevcuttur.",
      "Yetkili kamu kurum ve kuruluşları: yasal talep halinde.",
    ],
  },
  {
    id: "saklama-sureleri",
    title: "7. Saklama Süreleri",
    items: [
      "Sipariş ve müşteri kayıtları: son işlemden itibaren 10 yıl (Vergi Usul Kanunu).",
      "OTP logları ve form gönderimleri: 1 yıl.",
      "IP adresi ve erişim logları: 2 yıl (5651 sayılı Kanun).",
      "Redis geçici veriler (sepet, OTP kodu, stok rezervasyonu): 15 dakika – 7 gün TTL, ardından otomatik silme.",
      "Pazarlama rızası geri alındığında ilgili veriler 30 gün içinde silinir.",
    ],
  },
  {
    id: "haklariniz",
    title: "8. Haklarınız",
    items: [
      "Kişisel verilerinizin işlenip işlenmediğini öğrenme.",
      "İşlenmişse buna ilişkin bilgi talep etme.",
      "Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme.",
      "KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme.",
      "Otomatik sistemler vasıtasıyla aleyhinize bir sonuç ortaya çıkmasına itiraz etme.",
      "Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.",
    ],
  },
  {
    id: "iletisim",
    title: "9. İletişim",
    content: `Haklarınızı kullanmak veya gizlilik politikamız hakkında soru sormak için info@marketin24.com adresine kimliğinizi doğrulayan bir e-posta gönderebilirsiniz. Talepleriniz en geç 30 gün içinde yanıtlanır. Hakkınızın ihlal edildiğini düşünüyorsanız Kişisel Verileri Koruma Kurumu'na (kvkk.gov.tr) başvurabilirsiniz.`,
  },
  {
    id: "degisiklikler",
    title: "10. Değişiklikler",
    content: `Bu politika önceden bildirim yapılarak güncellenebilir. Önemli değişikliklerde kayıtlı e-posta adresinize bildirim gönderilir. Güncel versiyona her zaman bu sayfadan ulaşabilirsiniz.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-primary text-primary-foreground px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium mb-4">
            <Shield className="h-3.5 w-3.5" />
            Yasal
          </div>
          <h1 className="text-3xl font-bold text-balance md:text-4xl">Gizlilik Politikası</h1>
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
              Bu politika, 6698 sayılı KVKK kapsamındaki aydınlatma yükümlülüğümüz çerçevesinde hazırlanmıştır. Platformumuzu kullanarak bu politikayı kabul etmiş sayılırsınız.
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
                href="/terms"
                className="text-xs text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Kullanım Şartları &rarr;
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  )
}
