# Supabase/Redis Kontrol Raporu

Tarih: 2026-05-02

## Supabase kullanimi

- `lib/supabase/server.ts`, `proxy.ts`, `app/auth/callback/route.ts` server-side `createServerClient` kullaniyor.
- `lib/supabase/client.ts` client-side `createBrowserClient` kullaniyor.
- Degisiklik yapilan API route'lari kullanici oturumu icin `@/lib/supabase/server` helper'i ile server client olusturuyor.
- Service role Supabase client kullanilan route'larda veri erisimi mevcut auth/ownership kontrollerinden sonra yapiliyor:
  - OTP send route'u siparisin oturumdaki kullaniciya ait oldugunu dogruluyor.
  - Vendor notification route'u store ownership kontrolu yapiyor.
  - No-show route'u admin/super_admin ya da vendor ownership kontrolu yapiyor.

## N+1 sorgu riski

- Incelenen degisikliklerde yeni N+1 sorgu eklenmedi.
- Mevcut vendor order detail route'u iliskili order, item ve history verilerini ayrik sorgularla yukluyor; bu tek siparis detay ekrani icin sinirli kapsamda kabul edilebilir.
- Search route'u vendor store bilgisini urun sorgusuna join ile aliyor; vendor slug filtresi icin tek ek lookup kullaniyor.

## Redis key convention

Hedef format: `entity:id:action`

Yapilan duzeltme:

- `app/api/worker/outbox-flush/route.ts`
  - Eski: `vendor:notify:{storeId}`
  - Yeni: `vendor:{storeId}:notify`
- `app/api/vendor/notifications/route.ts`
  - Yeni anahtari okuyor.
  - Gecis donemi icin eski `vendor:notify:{storeId}` anahtarini da okuyor.

Kalan mevcut farkliliklar:

- `cart:{userId}` sepet cache anahtari `cart:userId` seklinde iki segmentli.
- `cart:reserve:{cartId}:{productId}` stock reservation anahtari compound id kullaniyor.
- `otp:{orderId}` ve `otp:rate:{phone}` OTP akisinda kullaniliyor.
- `rl:contact:{ip}` contact/seller application rate-limit icin kullaniliyor.

Bu kalan anahtarlar davranissal ve veri gecisi gerektirebilecegi icin bu turda raporlandi; bildirim kuyrugu anahtari ise producer/consumer birlikte guncellenerek duzeltildi.
