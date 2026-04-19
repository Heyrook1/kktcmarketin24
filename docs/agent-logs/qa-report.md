# QA Report

## Scope
- Uygulama taraması (page route, link, compare, footer, ana sayfa ürün akışı)

## Results
| Kontrol | Sonuç | Detay |
| --- | --- | --- |
| app/ altındaki sayfalarda broken link taraması | PASS | Kod tabanı seviyesinde statik href taraması yapıldı; eksik route tespit edilmedi. |
| /privacy /terms /help sayfaları mevcut mu | PASS | Tüm gerekli sayfalar mevcut. |
| Ana sayfada stok=0 ürünlerin filtrelenmesi | FIXED | components/home/featured-products.tsx içinde ana sayfa sorgularına .gt("stock", 0) filtresi eklendi. |
| Demo ürünlerin gizlenmesi | FIXED | Ana sayfa ürün sorgularına demo etiket/isim filtreleri eklendi (.not("tags", "cs", '{"demo"}') ve .not("name", "ilike", "%demo%")). |
| /compare sayfasında olmayan özellik işaretleri | FIXED | app/compare/page.tsx içinde doğrulanamayan mobileApp özelliği modelden ve karşılaştırma tablosundan kaldırıldı. |
| Footer telefon tutarlılığı (+90 533 873 43 17) | PASS | Footer, Help ve Terms sayfalarında telefon numarası tutarlı durumda; değişiklik gerekmedi. |

## Notes
- "GitHub Issue aç" adımı bu repodaki mevcut araç setiyle otomatik uygulanamaz durumda; bunun yerine bulgular bu rapora işlendi.
