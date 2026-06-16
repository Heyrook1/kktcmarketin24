# Supabase Kontrol Raporu

Tarih: 2026-05-06

## Kapsam

- Server/client Supabase helper kullanimi
- Supabase sorgularinda N+1 riski
- Redis client ve key convention kontrolu

## Bulgular ve duzeltmeler

### Server component Supabase kullanimi

- Server tarafinda `@/lib/supabase/server` helper'i `createServerClient` kullanarak cookie-aware Supabase client olusturuyor.
- Incelenen server component ve route handler kullanimi bu helper uzerinden ilerliyor.

### Client component Supabase kullanimi

- Client tarafinda `@/lib/supabase/client` helper'i `createBrowserClient` kullaniyor.
- Incelenen client componentler Supabase icin bu helper'i import ediyor.

### N+1 riski

- `lib/otp.ts` icindeki `expireStaleOrders()` fonksiyonunda stale order basina sub-order ve item sorgulari yapiliyordu.
- Bu akista Supabase sorgulari batch hale getirildi:
  - stale order id'leri tek listede toplaniyor,
  - sub-order id'leri tek `.in(...)` sorgusu ile cekiliyor,
  - order item satirlari tek `.in(...)` sorgusu ile cekiliyor,
  - sub-order/order durum guncellemeleri bulk `.in(...)` update ile yapiliyor,
  - stock restore RPC cagrilari urun bazinda aggregate edilerek calistiriliyor.

Not: Redis rezervasyon temizligi ve no-show kaydi order bazinda kaldi; bunlar farkli yan etkiler ve mevcut helper davranisini koruyor.

### Redis client ve key convention

- `app/api/contact/route.ts` artik ortak `@/lib/redis` singleton client'ini kullaniyor.
- `app/api/seller-application/route.ts` artik ortak `@/lib/redis` singleton client'ini kullaniyor.
- Seller application rate limit key'i contact bucket'i ile cakismayacak sekilde ayrildi.
- Dokunulan rate-limit key'leri `entity:id:action` formatina uyarlandi:
  - `contact:{ip}:rate-limit`
  - `seller-application:{ip}:rate-limit`

## Kalan notlar

- Mevcut kod tabaninda eski Redis key aileleri de var (`cart:session:{userId}`, `cart:reserve:{cartId}:{productId}`, `vendor:notify:{storeId}`, `otp:{orderId}`). Bunlar urun davranisini etkileyen persisted/TTL key'ler oldugu icin bu calismada migration veya geriye donuk silme eklenmedi.
- `pnpm typecheck` ve dogrudan `node/npm` komutlari ortamda ilgili binary'ler olmadigi icin calistirilamadi.
