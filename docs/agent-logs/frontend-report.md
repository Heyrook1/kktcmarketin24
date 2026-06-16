# Frontend UI Kontrol Raporu

## Özet
- Eksik yasal/destek sayfaları kontrol edildi: `/privacy`, `/terms` ve `/help` mevcut.
- Footer yasal/destek linkleri gerçek sayfalara gidiyor. Hesap kayıt alanındaki `#` yasal linkleri düzeltildi.
- `seller-application` ve `help` formlarında API/bağlantı hatası kullanıcıya gösteriliyor.
- `help` SSS alanı erişilebilir Radix Accordion bileşenine geçirildi.
- Arama sayfasındaki pagination linkleri `#` yerine gerçek `/search?...` URL'leri üretiyor.

## Mobile responsive kontrolü
- Ana düzen `RootLayout` içinde mobil alt navigasyon için `pb-16 md:pb-0` kullanıyor.
- İncelenen yeni/yasal sayfalarda grid yapıları küçük ekranda tek kolona düşüyor.
- `seller-application` formu ve yardım iletişim alanı `sm`/`md` breakpointlerinde tek kolondan çok kolona geçiyor.
- Belirgin yeni mobil kırılım hatası tespit edilmedi.

## Loading skeleton kontrolü
- Arama sayfasında `SearchSkeleton` ve sonuç grid skeleton mevcut.
- Ürün listeleme/öne çıkan ürün bileşenlerinde skeleton kullanımı mevcut görünüyor.
- Statik içerik sayfaları (`privacy`, `terms`, `help`) server/static içerik ağırlıklı olduğu için skeleton gerektirmiyor.

## Error state kontrolü
- `seller-application` formuna başarısız istek/hata mesajı eklendi.
- `help` destek formuna başarısız istek/hata mesajı eklendi.
- Arama sayfasında hata ve tekrar dene state'i mevcut.
- Kritik API'lerde sınırda generic OK modeli kullanıldığı için bot/rate-limit ayrıntıları kullanıcıya sızdırılmıyor.

## 200+ satır bileşenler ve refactor önerileri

| Satır | Dosya | Öneri |
|---:|---|---|
| 904 | `components/account/tabs/orders-tab.tsx` | Filtreler, tablo satırları ve durum aksiyonları ayrı bileşen/hook yapılabilir. |
| 758 | `components/vendor/vendor-orders-table.tsx` | Filtreler, tablo satırları ve durum aksiyonları ayrı bileşen/hook yapılabilir. |
| 726 | `components/ui/sidebar.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 694 | `app/vendor-panel/smart-links/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 661 | `components/layout/site-header.tsx` | Link veri yapıları ve alt bölümler ayrı presentational bileşenlere çıkarılabilir. |
| 604 | `app/products/products-content.tsx` | Filtre, kart/listing ve veri hazırlama mantığı ayrıştırılabilir. |
| 587 | `app/compare/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 568 | `app/help/help-client.tsx` | FAQ verisi, iletişim formu ve sayfa layoutu ayrı dosyalara bölünebilir. |
| 534 | `components/shared/reviews-section.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 532 | `app/vendor-panel/products/new/page.tsx` | Filtre, kart/listing ve veri hazırlama mantığı ayrıştırılabilir. |
| 488 | `components/product/enhanced-product-card.tsx` | Filtre, kart/listing ve veri hazırlama mantığı ayrıştırılabilir. |
| 481 | `app/products/[id]/product-detail.tsx` | Filtre, kart/listing ve veri hazırlama mantığı ayrıştırılabilir. |
| 465 | `app/vendor-panel/products/[id]/page.tsx` | Filtre, kart/listing ve veri hazırlama mantığı ayrıştırılabilir. |
| 456 | `components/vendor/vendor-returns-client.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 450 | `app/search/search-client.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 423 | `app/checkout/checkout-content.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 408 | `app/vendor/[slug]/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 396 | `app/seller-application/page.tsx` | Form alanları, başarı ekranı ve fayda listesi küçük bileşenlere ayrılabilir. |
| 388 | `app/order-confirmation/[id]/order-confirmation-client.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 387 | `components/layout/mega-menu.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 362 | `components/checkout/coupon-picker.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 353 | `components/ui/chart.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 314 | `components/account/tabs/coupons-tab.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 277 | `components/vendor/vendor-profile-sheet.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 276 | `components/ui/menubar.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 275 | `components/account/tabs/support-tab.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 273 | `components/layout/footer.tsx` | Link veri yapıları ve alt bölümler ayrı presentational bileşenlere çıkarılabilir. |
| 264 | `components/cart/cart-drawer.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 257 | `components/ui/dropdown-menu.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 253 | `app/privacy/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 252 | `components/ui/context-menu.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 251 | `components/account/auth-gate.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 248 | `components/cart/cart-discount-picker.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 244 | `components/ui/field.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 242 | `app/cart/cart-content.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 241 | `components/ui/carousel.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 237 | `app/vendor-panel/orders/page.tsx` | Filtreler, tablo satırları ve durum aksiyonları ayrı bileşen/hook yapılabilir. |
| 236 | `app/terms/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 229 | `components/social-proof.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 227 | `components/vendor/smart-tag-editor.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 226 | `components/auth/login-screen.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 226 | `app/vendor-login/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 222 | `app/vendor-panel/analytics/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 220 | `app/admin/vendors/new/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 219 | `components/home/featured-products.tsx` | Filtre, kart/listing ve veri hazırlama mantığı ayrıştırılabilir. |
| 213 | `components/ui/calendar.tsx` | Shadcn/Radix temel bileşeni; sadece yerel ihtiyaç varsa dokunulmalı. |
| 212 | `components/messaging/vendor-admin-inbox.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 211 | `app/vendor-panel/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 210 | `app/auth/reset-password/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |
| 201 | `app/order-confirmation/[id]/page.tsx` | Stateful mantık ve tekrar eden UI blokları küçük bileşenlere bölünebilir. |

## Notlar
- Bu çalışma odaklı UI/link/error-state düzeltmeleri içerir; büyük bileşen refactorları blast radius nedeniyle rapor önerisi olarak bırakıldı.
