# Supabase Kontrol Raporu

Tarih: 2026-05-04

## Kapsam

- Supabase server/client kullanimi
- Servis rolu kullanan API handlerlari
- N+1 sorgu riski
- Redis key convention uyumu

## Bulgular ve duzeltmeler

### Server ve client Supabase client kullanimi

- `lib/supabase/server.ts`, `@supabase/ssr` `createServerClient` wrapper'i kullaniyor.
- `lib/supabase/client.ts`, `@supabase/ssr` `createBrowserClient` wrapper'i kullaniyor.
- API route'larda browser client kullanimi tespit edilmedi.
- Client component aramalarinda `createBrowserClient` wrapper'i client tarafinda kullaniliyor.

### Auth ve service-role kullanimi

- Service-role client kullanan public notification endpointleri artik ek kontrol yapiyor:
  - `app/api/notifications/order-placed/route.ts`
  - `app/api/orders/notify/route.ts`
- Bu endpointler cron secret ile veya oturumdaki kullanicinin siparise sahip olmasi ile calisiyor.
- Worker endpointleri `CRON_SECRET` yokken artik fail-closed davraniyor:
  - `app/api/worker/outbox-flush/route.ts`
  - `app/api/worker/otp-expire/route.ts`

### N+1 sorgu riski

- Incelenen API handlerlarinda satir basina await edilen Supabase sorgusu ile belirgin N+1 paterni tespit edilmedi.
- Messaging ve checkout kodlari toplu sorgular (`.in(...)`) ve map tabanli eslestirme kullaniyor.
- `app/api/worker/outbox-flush/route.ts` hata durumunda event basina status guncellemesi yapiyor; bu batch boyutu 20 ile sinirli oldugu ve yalnizca hata akisi oldugu icin mevcut risk dusuk kabul edildi.

### Redis key convention

`entity:id:action` formatina yaklastirilan keyler:

- `seller-application:{ip}:rate-limit`
- `contact:{ip}:rate-limit`
- `vendor:{storeId}:notify`

Not: `contact` ve `seller-application` formlari daha once ayni `rl:contact:{ip}` bucket'ini paylasiyordu. Bu ayrildi.

## Kalan notlar

- Bazi route handlerlarda mevcut `console.error`/`console.warn` kullanimi devam ediyor. Bu calismada yalnizca dokunulan worker/search/notification akislarinda yeni console kullanimi eklenmedi ve search endpointindeki hata mesaji kullanici dostu hale getirildi.
- Service-role client kullanimi server-only route handlerlarla sinirli tutulmali; yeni endpointlerde cookie-scoped `createServerClient` varsayilan tercih olmali.
