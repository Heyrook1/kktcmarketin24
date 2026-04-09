# Faz-2: Supabase Realtime P2P Inbox Tasarimi

Bu dokuman, Faz-1 tesliminden ayri olarak musteri-satici mesajlasmasini `vendor_order_id` bazli bir thread uzerinden gercekleştirmek icin uygulanacak teknik tasarimi icerir.

## 1) Veri modeli

Yeni tablo: `public.order_thread_messages`

- `id uuid primary key default gen_random_uuid()`
- `vendor_order_id uuid not null references public.vendor_orders(id) on delete cascade`
- `order_id uuid null references public.orders(id) on delete set null`
- `sender_user_id uuid not null references auth.users(id)`
- `sender_role text not null check (sender_role in ('customer','vendor','admin','super_admin'))`
- `message text not null check (char_length(trim(message)) between 1 and 2000)`
- `created_at timestamptz not null default now()`
- `edited_at timestamptz null`
- `meta jsonb not null default '{}'::jsonb`

Indeksler:

- `idx_order_thread_messages_vendor_order_created_at (vendor_order_id, created_at desc)`
- `idx_order_thread_messages_order_id_created_at (order_id, created_at desc)`

## 2) RLS kurallari

RLS acik olacak.

- **customer-read/write:** Sadece ilgili siparisin musterisi, kendi `order_id` / `vendor_order_id` thread kayitlarini okuyup yazabilir.
- **vendor-read/write:** Sadece `vendor_orders.store_id` kendi magaza sahipligine bagli vendor kullanicisi okuyup yazabilir.
- **admin-read/write:** `admin` ve `super_admin` tum thread'leri gorebilir/yazabilir.

## 3) API sozlesmesi

Yeni endpoint: `app/api/order-threads/[vendorOrderId]/messages/route.ts`

- `GET`: son mesajlari getirir (`limit`, `before` pagination).
- `POST`: yeni mesaj ekler.
  - body: `{ message: string }`
  - server tarafi role + sahiplik kontrolu zorunlu.
  - insert sonrasi normalize edilmis payload dondurur.

Ek endpoint (opsiyonel): `GET /api/order-threads/unread-count`

- kullaniciya ait thread'lerde okunmamis mesaj sayisi.

## 4) Realtime akisi

Supabase channel:

- `postgres_changes` on `public.order_thread_messages`
- filter: istemcinin ulasabilecegi `vendor_order_id` seti

Akis:

1. UI ilk acilista son mesajlari REST ile ceker.
2. Ayni anda Realtime subscribe olur.
3. Yeni mesaj event'inde:
   - thread aciksa listeye append eder
   - kapaliysa inbox badge sayisini artirir
4. Offline/online gecisinde REST ile son senkron farki alinip birlestirilir.

## 5) UI entegrasyonu

- Vendor: `components/vendor/vendor-orders-table.tsx` detay modalina "Mesajlasma" sekmesi.
- Customer: `components/account/tabs/orders-tab.tsx` siparis karti detayina "Saticiya Mesaj" paneli.
- Ortak component:
  - `components/shared/order-thread-panel.tsx`
  - props: `vendorOrderId`, `orderId`, `viewerRole`

## 6) Faz gecis stratejisi

1. Migration + RLS
2. API endpointleri
3. UI (read-only liste)
4. UI (mesaj gonderme)
5. Realtime subscribe + unread badge
6. E2E smoke: customer->vendor ve vendor->customer mesaj roundtrip

## 7) Kabul kriterleri

- Vendor ve musteri ayni siparis thread'inde canli mesaj gorebilmeli.
- Yetkisiz kullanici thread'e erisememeli (RLS + API kontrolu).
- Sayfa yenilemeden yeni mesajlar gorunmeli.
- Mesajlar kronolojik ve idempotent gorunmeli.
