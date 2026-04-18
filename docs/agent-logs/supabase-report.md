# Supabase Kullanım Kontrol Raporu

## Tarih
- 2026-04-18

## 1) Server component tarafı
- `lib/supabase/server.ts` içinde `createServerClient` doğru şekilde kullanılıyor.
- Server component ve server route çağrılarında `@/lib/supabase/server` import deseni korunuyor.
- Tarama sırasında client component içinde server client kullanımına rastlanmadı.

## 2) Client component tarafı
- `lib/supabase/client.ts` içinde `createBrowserClient` doğru şekilde kullanılıyor.
- Client tarafı örneklerde (`app/auth/sign-up/page.tsx`, `components/layout/site-header.tsx`, `components/messaging/vendor-admin-inbox.tsx` vb.) `@/lib/supabase/client` üzerinden erişim var.
- Client component içinde `createServerClient` kullanımı tespit edilmedi.

## 3) N+1 sorgu riski / optimizasyon
- Bu iterasyonda güvenlik ve sınır doğrulaması önceliklendirildi; N+1 açısından yeni regresyon eklenmedi.
- Bildirim akışında Redis key standardizasyonu yapıldı, polling endpoint ve worker aynı anahtar şemasına geçirildi.

## 4) Redis key convention kontrolü
- İstenen format: `entity:id:action`
- Uygulanan düzeltme:
  - Önce: `vendor:notify:${storeId}` / `vendor:notifications:${storeId}`
  - Sonra: `vendor:${storeId}:notifications`
- Güncellenen dosyalar:
  - `app/api/worker/outbox-flush/route.ts`
  - `app/api/vendor/notifications/route.ts`

## 5) Ek güvenlik ve doğrulama iyileştirmeleri
- Bildirim endpoint’lerinde (`/api/orders/notify`, `/api/notifications/order-placed`) zod body validation + order ownership/admin yetkisi eklendi.
- `returns/[id]` GET tarafında vendor ownership kontrolü eklendi.
- `search` ve `reliability/score` endpoint’lerinde zod giriş doğrulaması + top-level try/catch eklendi.
- OTP endpoint’lerinde (`send`, `verify`) zod + try/catch iyileştirmesi yapıldı.
- `worker/outbox-flush` endpoint’i fail-closed hale getirildi (`CRON_SECRET` yoksa 503).

## Sonuç
- Supabase client ayrımı (server/client) proje genelinde doğru.
- Redis key naming, istenen `entity:id:action` standardına uygun hale getirildi.
- İlgili backend güvenlik/doğrulama eksikleri önemli ölçüde azaltıldı.
