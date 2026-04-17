# QA Raporu

Tarih: 2026-04-17  
Kapsam: `tamTarama` kontrol listesindeki maddeler

## 1) `app/` altındaki sayfalar ve broken link kontrolü

- `app/**/page.tsx` yolları ve kod içindeki dahili `href="/..."` kullanımları gözden geçirildi.
- `/privacy`, `/terms`, `/help`, `/compare`, `/urunler`, `/contact`, `/about`, `/vendor-login`, `/seller-application` gibi ana link hedefleri mevcut.
- İncelenen bağlantılarda bu görev kapsamındaki kırık rota bulgusu tespit edilmedi.

## 2) `/privacy` `/terms` `/help` sayfaları

- Üç sayfa da mevcut:
  - `app/privacy/page.tsx`
  - `app/terms/page.tsx`
  - `app/help/page.tsx`
- Ek sayfa oluşturma gerekmedi.

## 3) Ana sayfada `stock=0` ürün kontrolü

Sorun: Ana sayfadaki ürün akışlarında stok filtresi tutarlı değildi.  
Düzeltme: `stock > 0` filtresi ve ortak görünürlük filtresi uygulandı.

## 4) Demo ürün görünürlüğü

Sorun: Demo/test etiketli ürünler bazı listelerde dışlanmıyordu.  
Düzeltme: Ortak filtreye demo belirteç kontrolü eklendi (`demo`, `sample`, `test`, `dummy`, `ornek`, `örnek`).

## 5) `/compare` sayfasında olmayan özellik işareti

Sorun: Marketin24 için native mobil uygulama varmış gibi işaretlenmişti.  
Düzeltme:
- `mobileApp: true` -> `false` (Marketin24 kartı)
- Özellik etiketi netleştirildi: `Native Mobil Uygulama`

## 6) Footer telefon tutarlılığı

- Footer numarası hedef değerle uyumluydu: `+90 533 873 43 17`.
- Tutarlılık için iletişim sayfası da aynı numaraya çekildi:
  - `app/contact/page.tsx`

## 7) Uygulanan kod değişiklikleri

- `lib/public-product-filter.ts` (yeni)
- `components/home/featured-products.tsx`
- `app/urunler/page.tsx`
- `app/category/[slug]/page.tsx`
- `app/categories/page.tsx`
- `app/api/search/route.ts`
- `app/compare/page.tsx`
- `app/contact/page.tsx`

## GitHub Issue (label: bug)

Bu ortamda issue açma için yazma yetkili araç bulunmadığından otomatik issue oluşturulamadı.  
Önerilen issue başlığı:

`[BUG] Public catalog should hide out-of-stock/demo products and fix compare mobile-app claim`

