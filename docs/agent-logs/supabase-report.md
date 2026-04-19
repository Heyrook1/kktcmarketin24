# Supabase ve Redis Kontrol Raporu

Tarih: 2026-04-19

## 1) Server component tarafında createServerClient kullanımı

- `@/lib/supabase/server` içindeki helper, `createServerClient` (`@supabase/ssr`) kullanıyor.
- API route ve server tarafı dosyalarda Supabase session erişimi `await createClient()` / `createServerClient` üzerinden yapılıyor.
- Yanlış yönde kullanım tespit edilmedi (client dosyada server helper import'u yok).

## 2) Client component tarafında createBrowserClient kullanımı

- `@/lib/supabase/client` helper, `createBrowserClient` (`@supabase/ssr`) ile tanımlı.
- `@/lib/supabase/client` import eden dosyalar `use client` dosyaları (ör. `components/layout/site-header.tsx`, `components/auth/login-screen.tsx`) olarak görünüyor.
- Server dosyasında browser client import'u tespit edilmedi.

## 3) N+1 sorgu riski

### Mevcut iyi örnekler
- `app/api/messages/vendor-admin/[threadId]/messages/route.ts`: mesajlar için tek sorgu + profil isimlerini `in("id", userIds)` ile toplu çekiyor.

### İyileştirme alanları
- `app/api/worker/outbox-flush/route.ts`: failed event güncellemesi için döngü içinde ayrı `update` çağrıları var.
- `app/api/orders/[id]/cancel/route.ts`: bazı akışlarda döngü içinde tekil `update` çağrıları var.
- `app/api/vendor/orders/[id]/delivery-event/route.ts`: select fallback yaklaşımı mevcut; bu doğrudan N+1 değil ama tip güvenliği geliştirme ihtiyacı var.

Bu görev kapsamında odak, doğrulama/auth/try-catch olduğu için N+1 noktaları not edildi; davranış değişikliği yaratacak toplu sorgu refactor'u yapılmadı.

## 4) Redis key convention (entity:id:action)

### Uyumlu anahtar örnekleri
- `vendor:notify:{storeId}` (`entity:id:action` biçimine yakın)
- `cart:session:{userId}`
- `otp:rate:{phone}`
- `cart:reserve:{cartId}:{productId}`

### Gözlem
- Projede halihazırda kullanılan key şablonları çoğunlukla okunabilir ve tutarlı.
- Bazı yerlerde 3 segment, bazı yerlerde 4 segment kullanılıyor (`cart:reserve:{cartId}:{productId}`).
- Bu görevde mevcut davranışı bozmamak için key adları değiştirilmedi.

## Sonuç

- Supabase client ayrımı (server/browser) genel olarak doğru uygulanmış.
- Belirgin bir yanlış import/yürütme context problemi bulunmadı.
- N+1 açısından birkaç backend noktası iyileştirme adayı olarak işaretlendi.
- Redis anahtar formatı çoğunlukla tutarlı; proje genelinde tek bir canonical convention belgesi eklenmesi faydalı olur.
