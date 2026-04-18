# Backend API Sağlık Raporu

Tarih: 2026-04-18
Dal: `cursor/api-health-and-supabase-control-077d`

## Uygulanan düzeltmeler

1. **Zod validation eklendi / güçlendirildi**
   - `app/api/search/route.ts`
     - Query paramları (`sort`, `min_price`, `max_price`, `page` vb.) Zod ile doğrulanıyor.
     - `min_price` ve `max_price` için `min(1)` + `max >= min` kontrolü eklendi.
   - `app/api/otp/send/route.ts`
     - `orderId` için UUID doğrulaması eklendi.
   - `app/api/otp/verify/route.ts`
     - `orderId` UUID ve `code` (6 hane, sayısal) doğrulaması eklendi.
   - `app/api/reliability/score/route.ts`
     - GET `customerId` ve POST `userId` için UUID doğrulaması eklendi.
   - `app/api/orders/notify/route.ts`
     - `order_id` için UUID doğrulaması eklendi.
   - `app/api/notifications/order-placed/route.ts`
     - `orderId` için UUID doğrulaması eklendi.
   - `app/api/returns/[id]/route.ts`
     - Path param `id` için UUID doğrulaması eklendi.

2. **Auth / yetkilendirme güçlendirildi**
   - `app/api/notifications/order-placed/route.ts`
   - `app/api/orders/notify/route.ts`
     - Endpoint artık kimlik doğrulaması istiyor.
     - Kullanıcının sipariş sahibi olduğu (`customer_id` veya `customer_email`) doğrulanıyor.
     - Sipariş sahibi değilse yalnızca admin/super_admin erişimi izinli.
   - `app/api/returns/[id]/route.ts` (GET)
     - İade kaydı döndürmeden önce `vendor_stores.owner_id === user.id` kontrolü eklendi.

3. **try/catch eksikleri giderildi**
   - `app/api/search/route.ts`
   - `app/api/otp/send/route.ts`
   - `app/api/otp/verify/route.ts`
   - `app/api/reliability/score/route.ts`
   - `app/api/vendor/notifications/route.ts`
   - `app/api/vendor/orders/[id]/route.ts`
   - `app/api/orders/notify/route.ts`
   - `app/api/notifications/order-placed/route.ts`
   - `app/api/worker/outbox-flush/route.ts`

4. **Price min:1 kontrolü**
   - `lib/validations/product.ts`
     - `compare_price` alanı da non-null durumda `min(1)` olacak şekilde güncellendi.
   - `app/api/search/route.ts`
     - Fiyat filtreleri için `min(1)` ve sayı geçerliliği zorunlu hale getirildi.

## Tespit edilen riskler ve güncel durum

- `app/api/worker/outbox-flush/route.ts`:
  - `CRON_SECRET` olmadan endpoint çağrısı artık **fail-closed** (`503`) davranıyor.
- `app/api/returns/[id]/route.ts`:
  - GET tarafındaki yatay yetki açığı kapatıldı.
- Açık bildirim endpoint’leri:
  - Sipariş sahibi/admin doğrulaması ile sınırlandı.

## `tsc --noEmit` sonucu

Komut: `pnpm typecheck` (`tsc --noEmit`)

Sonuç: **Başarısız (repo genelindeki mevcut tip hataları nedeniyle)**.

Notlar:
- Bu turda dokunulan endpoint kaynaklı ek tip hatalar giderildi.
- Kalan hatalar büyük ölçüde proje genelindeki mevcut tip uyuşmazlıklarıdır.

Öne çıkan mevcut hatalar:
- `app/actions/coupons.ts`
- `app/api/auth/check-email/route.ts`
- `app/api/orders/[id]/no-show/route.ts`
- `app/cart/cart-content.tsx`
- `app/products/[id]/product-detail.tsx`
- `app/urunler/[id]/page.tsx`
- `app/urunler/page.tsx`
- `app/vendor-panel/orders/page.tsx`
- `components/vendor/vendor-profile-sheet.tsx`
- `lib/smart-search.ts`
