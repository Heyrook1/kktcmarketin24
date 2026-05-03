# Frontend UI Kontrol Raporu

## Eksik sayfalar ve link kontrolu

- `/privacy`, `/terms` ve `/help` rotalari mevcut ve footer tarafindan erisilebilir durumda.
- Hesap kayit ekranindaki gecici `#` yasal belge linkleri `/terms` ve `/privacy` rotalarina baglandi.
- Arama sayfasi sayfalama kontrollerindeki gecici `#` linkleri mevcut filtreleri koruyan gercek URL'lere tasindi.
- Urun detayindaki `#reviews` linki sayfa ici yorum bolumune giden gecerlidir.

## Mobile responsive kontrol

- Ana yasal sayfalar, yardim merkezi, footer ve satici basvuru formu mobilde tek kolon ve `sm`/`md`/`lg` breakpoint yapilariyla calisiyor.
- `components/layout/mega-menu.tsx` yalnizca `lg+` ekranda aciliyor; 1024-1280px araliginda sabit genislikli sol/yan paneller ve cok kolonlu grid yapisi yogun gorunebilir. Daha sade bir `lg` yerlesimi veya `xl` icin genisletilmis panel ayrimi onerilir.
- `components/layout/site-header.tsx` masaustu ust barini `lg` altinda gizliyor. Mobilde dil/para birimi kontrolleri farkli yuzeylere dagitildigi icin bu kasitli gorunuyor, ancak kesif testlerinde tekrar dogrulanmali.

## Loading skeleton kontrolu

- Iyi durumda olan ornekler: `app/search/search-client.tsx`, `app/products/products-content.tsx`, `components/account/tabs/orders-tab.tsx` ve `components/vendor/vendor-returns-client.tsx` skeleton veya acik loading state kullaniyor.
- `components/shared/thread-chat-panel.tsx` ilk mesaj yuklemesinde liste alanini bos birakiyor; refresh butonunda spinner var ama mesaj listesi icin skeleton eklenebilir.
- `components/messaging/vendor-admin-inbox.tsx` thread listesi yuklenirken yalnizca yenile butonunu spinner'a ceviriyor; sol liste icin satir skeletonlari eklenebilir.
- `app/vendor-panel/dashboard-charts.tsx` kart icinde `Yukleniyor...` metni gosteriyor; standartlasma icin grafik karti skeleton'u kullanilabilir.

## Error state kontrolu

- Satici basvuru ve yardim merkezi iletisim formlari artik basarisiz HTTP yanitlarini veya ag hatalarini basari olarak gostermiyor; kullaniciya anlamli hata mesaji gosteriliyor.
- `app/search/search-client.tsx`, `components/account/tabs/orders-tab.tsx`, `components/vendor/vendor-orders-table.tsx` ve checkout akisi mevcut hata durumlarini gorunur sekilde ele aliyor.
- `app/vendor-panel/dashboard-charts.tsx` Supabase sorgu hatalarini kullaniciya gostermeden bos grafiklere dusebilir; grafik alani icin acik error state eklenmesi onerilir.

## 200+ satir bilesen/refactor adaylari

| Dosya | Yaklasik satir | Oneri |
| --- | ---: | --- |
| `components/account/tabs/orders-tab.tsx` | 905 | Siparis listesi, detay modali ve iade aksiyonlari ayri alt bilesenlere bolunebilir. |
| `components/vendor/vendor-orders-table.tsx` | 758 | Filtreler, tablo satiri ve detay dialog'u ayrilabilir. |
| `components/ui/sidebar.tsx` | 727 | UI primitive oldugu icin dokunmadan once shadcn guncelleme stratejisi belirlenmeli. |
| `components/layout/site-header.tsx` | 661 | Desktop header, mobile drawer ve arama/hesap aksiyonlari ayrilabilir. |
| `app/products/products-content.tsx` | 605 | Filtre state, urun grid'i ve skeleton parcalari modullestirilebilir. |
| `app/compare/page.tsx` | 588 | Karsilastirma veri modeli ve kart/section bilesenleri ayrilabilir. |
| `app/help/help-client.tsx` | 577 | FAQ, politika kartlari ve iletisim formu ayri bilesenlere bolunebilir. |
| `components/shared/reviews-section.tsx` | 535 | Yorum listesi, ozet ve form ayrilabilir. |
| `app/vendor-panel/products/new/page.tsx` | 532 | Form alan gruplari ve validasyon yardimcilari ayrilabilir. |
| `components/product/enhanced-product-card.tsx` | 488 | Kart aksiyonlari, fiyat/rozet ve medya alani ayrilabilir. |
| `app/products/[id]/product-detail.tsx` | 482 | Galeri, varyant secimi, sosyal kanit ve satin alma paneli ayrilabilir. |
| `app/search/search-client.tsx` | 451 | Arama formu, filtreler ve sayfalama ayri bilesenlere ayrilabilir. |
| `app/checkout/checkout-content.tsx` | 424 | Adres/odeme/ozet bloklari ayrilabilir. |
| `app/seller-application/page.tsx` | 395 | Basvuru formu ve tanitim/benefit paneli ayrilabilir. |
| `components/layout/mega-menu.tsx` | 387 | Kategori rail, featured alan ve promosyon bloklari ayrilabilir. |
