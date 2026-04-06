-- 026_seed_category_vendors_and_products.sql
-- Demo data: one vendor user owns 10 category-focused stores + ~3 realistic products each.
--
-- Requirements:
--   • Run in Supabase SQL Editor (or postgres superuser). Bypasses RLS.
--   • At least one row in auth.users (sign up once, or create a test user).
--
-- Idempotent: safe to re-run. Stores use fixed slugs kktc-seed-*; products skip if same name exists on that store.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE EXCEPTION '026_seed: auth.users is empty. Create a user (sign up) then run this script again.';
  END IF;
END $$;

-- ── Vendor stores (one per canonical category) ─────────────────────────────
INSERT INTO public.vendor_stores (owner_id, name, slug, description, location, is_active, is_verified)
SELECT u.id, v.store_name, v.slug, v.blurb, v.city, true, true
FROM (SELECT id FROM auth.users ORDER BY created_at LIMIT 1) AS u
CROSS JOIN (
  VALUES
    ('kktc-seed-electronics', 'TechNova Elektronik', 'Telefon, laptop, ses ve akıllı ev ürünleri.', 'Lefkoşa'),
    ('kktc-seed-fashion', 'ModaVista', 'Günlük, ofis ve şık giyim; ayakkabı ve çanta.', 'Girne'),
    ('kktc-seed-home-garden', 'EvBahçe Atölyesi', 'Mobilya, mutfak gereçleri, bahçe ve aydınlatma.', 'Mağusa'),
    ('kktc-seed-beauty', 'GlowBox Kozmetik', 'Cilt bakımı, makyaj, parfüm ve saç ürünleri.', 'Lefkoşa'),
    ('kktc-seed-sports', 'PeakLine Spor', 'Fitness, koşu, outdoor ve yüzme ekipmanı.', 'Girne'),
    ('kktc-seed-kids-baby', 'Minik Dünya', 'Oyuncak, bebek bakımı ve çocuk giyim.', 'İskele'),
    ('kktc-seed-groceries', 'TazePazar Market', 'Zeytinyağı, kahve, atıştırmalık ve temel gıda.', 'Lefkoşa'),
    ('kktc-seed-health', 'VitaPlus Sağlık', 'Vitamin, mineral, bitkisel destek ve wellness.', 'Girne'),
    ('kktc-seed-books', 'Sahil Kitabevi', 'Roman, çocuk kitabı, iş ve kırtasiye.', 'Lefkoşa'),
    ('kktc-seed-jewelry', 'Aurum Takı', 'Gümüş, altın kaplama ve günlük aksesuar.', 'Mağusa')
) AS v(slug, store_name, blurb, city)
ON CONFLICT (slug) DO NOTHING;

-- ── Products (realistic TR names; Unsplash images; TRY-style prices) ─────────
INSERT INTO public.vendor_products (
  store_id,
  name,
  description,
  price,
  compare_price,
  category,
  image_url,
  images,
  stock,
  is_active,
  tags
)
SELECT
  s.id,
  p.name,
  p.description,
  p.price,
  p.compare_price,
  p.category,
  p.image_url,
  ARRAY[p.image_url]::text[],
  p.stock,
  true,
  p.tags
FROM public.vendor_stores AS s
INNER JOIN (
  VALUES
    -- electronics
    ('kktc-seed-electronics', 'Kablosuz Kulaklık ANC Pro', 'Aktif gürültü engelleme, 30 saate kadar pil, USB-C şarj.', 1899.90, 2299.00, 'electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', 48, ARRAY['kulaklık','bluetooth','ses','yeni']::text[]),
    ('kktc-seed-electronics', 'Akıllı Saat Sport X', 'GPS, nabız, suya dayanıklı gövde; uyku ve aktivite takibi.', 3499.00, 3999.00, 'electronics', 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=800&q=80', 32, ARRAY['saat','fitness','wearable']::text[]),
    ('kktc-seed-electronics', 'Taşınabilir Bluetooth Hoparlör', '360° ses, IPX7, 12 saat çalma süresi.', 1249.50, NULL, 'electronics', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80', 60, ARRAY['hoparlör','outdoor','müzik']::text[]),
    -- fashion
    ('kktc-seed-fashion', 'Organik Pamuk Basic Tişört', 'Rahat kesim, nefes alır kumaş; siyah ve beyaz uyumu.', 349.90, 429.90, 'fashion', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80', 120, ARRAY['tişört','basic','unisex']::text[]),
    ('kktc-seed-fashion', 'Deri Kemer İtalyan Kesim', 'Hakiki deri, mat toka, 95–115 cm ayarlanabilir.', 459.00, NULL, 'fashion', 'https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=800&q=80', 85, ARRAY['kemer','deri','aksesuar']::text[]),
    ('kktc-seed-fashion', 'Kadın Keten Gömlek', 'Yazlık keten karışım, düğmeli yaka, oversize seçenek.', 599.00, 749.00, 'fashion', 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80', 55, ARRAY['gömlek','keten','yaz']::text[]),
    -- home-garden
    ('kktc-seed-home-garden', 'Seramik Kahve Fincanı Seti 4''lü', 'El yapımı görünümlü glaze, 200 ml, bulaşık makinesi uyumlu.', 289.00, 349.00, 'home-garden', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&q=80', 70, ARRAY['mutfak','kahve','set']::text[]),
    ('kktc-seed-home-garden', 'LED Masa Lambası Dim Edilebilir', 'Sıcak/soğuk beyaz, dokunmatik kontrol, USB şarj çıkışı.', 649.90, NULL, 'home-garden', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80', 40, ARRAY['aydınlatma','ofis','led']::text[]),
    ('kktc-seed-home-garden', 'Bahçe Sulama Hortum Seti 20 m', 'Esnek, UV dayanımlı, tabancalı başlık dahil.', 419.00, 499.00, 'home-garden', 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80', 28, ARRAY['bahçe','sulama','hortum']::text[]),
    -- beauty
    ('kktc-seed-beauty', 'Hyaluronik Asit Nem Serum 30 ml', 'Hafif doku, paraben içermez; sabah-akşam kullanım.', 399.00, 479.00, 'beauty', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80', 90, ARRAY['cilt','serum','nem']::text[]),
    ('kktc-seed-beauty', 'Mat Ruj Seti 3''lü', 'Uzun süre kalıcı, kurutmaz formül; nude tonlar.', 279.50, NULL, 'beauty', 'https://images.unsplash.com/photo-1586495777744-4413b210ac9c?w=800&q=80', 75, ARRAY['makyaj','ruj','set']::text[]),
    ('kktc-seed-beauty', 'Argan Yağlı Saç Maskesi 250 ml', 'Onarıcı bakım, kuru ve boyalı saçlar için.', 224.90, 269.00, 'beauty', 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&q=80', 62, ARRAY['saç','bakım','argan']::text[]),
    -- sports
    ('kktc-seed-sports', 'Yoga Matı 6 mm Kaymaz', 'TPE malzeme, taşıma askısı ile birlikte.', 449.00, 549.00, 'sports', 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&q=80', 45, ARRAY['yoga','fitness','mat']::text[]),
    ('kktc-seed-sports', 'Hafif Koşu Ayakkabısı', 'Nefes alır üst, amortisörlü taban; günlük koşu için.', 1899.00, 2199.00, 'sports', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', 36, ARRAY['koşu','ayakkabı','spor']::text[]),
    ('kktc-seed-sports', 'Dambıl Seti 2x5 kg', 'Vinil kaplı, kaymaz tutamak, ev antrenmanı.', 799.00, NULL, 'sports', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80', 22, ARRAY['dambıl','ağırlık','ev']::text[]),
    -- kids-baby
    ('kktc-seed-kids-baby', 'Ahşap Yapboz 24 Parça Orman', '3+ yaş, güvenli boya, motor becerisi geliştirir.', 159.90, 199.00, 'kids-baby', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80', 100, ARRAY['oyuncak','yapboz','çocuk']::text[]),
    ('kktc-seed-kids-baby', 'Organik Pamuklu Body 3''lü Paket', '0–6 ay, çıtçıtlı, yumuşak dikiş.', 329.00, NULL, 'kids-baby', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80', 80, ARRAY['bebek','body','organik']::text[]),
    ('kktc-seed-kids-baby', 'Plastik BPA''sız Suluk 350 ml', 'Akıtmaz kapak, çocuk desenli.', 119.50, 149.00, 'kids-baby', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80', 110, ARRAY['biberon','suluk','okul']::text[]),
    -- groceries
    ('kktc-seed-groceries', 'Soğuk Sıkım Zeytinyağı 500 ml', 'Yerel üretim, cam şişe, asitlik ≤0.8.', 389.00, 449.00, 'groceries', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&q=80', 65, ARRAY['zeytinyağı','gıda','yerel']::text[]),
    ('kktc-seed-groceries', 'Filtre Kahve Çekirdek 250 g', 'Orta kavrum, çikolata notaları.', 224.00, NULL, 'groceries', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80', 95, ARRAY['kahve','çekirdek','filtre']::text[]),
    ('kktc-seed-groceries', 'Granola & Kuruyemiş Karışımı 400 g', 'Yulaf, badem, kuru üzüm; kahvaltılık.', 179.90, 219.00, 'groceries', 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&q=80', 72, ARRAY['granola','sağlıklı','atıştırmalık']::text[]),
    -- health
    ('kktc-seed-health', 'D3 Vitamini Damla 20 ml', 'Günlük 400 IU önerisi; damlalıklı kullanım.', 129.00, 159.00, 'health', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80', 150, ARRAY['vitamin','d3','damla']::text[]),
    ('kktc-seed-health', 'Probiyotik 30 Kapsül', '10 milyar CFU, soğuk zincir gerektirmez.', 349.00, NULL, 'health', 'https://images.unsplash.com/photo-1550572017-edd951aa9f35?w=800&q=80', 88, ARRAY['probiyotik','bağırsak','sağlık']::text[]),
    ('kktc-seed-health', 'Doğal Balmumu Dudak Bakımı', 'Portakal aromalı, koruyucu film.', 79.90, 99.00, 'health', 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800&q=80', 200, ARRAY['dudak','bakım','doğal']::text[]),
    -- books
    ('kktc-seed-books', 'Roman: Sahilde Son Yaz', 'Yerli yazar, 320 sayfa, yumuşak kapak.', 189.00, 229.00, 'books', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80', 45, ARRAY['roman','edebiyat','yerli']::text[]),
    ('kktc-seed-books', 'Çocuklar İçin Resimli Ansiklopedi', '6–10 yaş, renkli baskı, hayvanlar bölümü.', 265.00, NULL, 'books', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80', 38, ARRAY['çocuk','ansiklopedi','eğitim']::text[]),
    ('kktc-seed-books', 'Not Defteri Çizgili A5 3''lü', '80 yaprak, arkadaş köşe dükkanı kalitesi.', 89.90, 109.00, 'books', 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800&q=80', 200, ARRAY['kırtasiye','defter','ofis']::text[]),
    -- jewelry
    ('kktc-seed-jewelry', '925 Ayar Gümüş Minimal Kolye', '45 cm zincir, hediye kutusu dahil.', 899.00, 1099.00, 'jewelry', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80', 30, ARRAY['gümüş','kolye','hediye']::text[]),
    ('kktc-seed-jewelry', 'Rose Gold Kaplama Halka Küpe', 'Hipoalerjenik çelik gövde, hafif.', 349.50, NULL, 'jewelry', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80', 52, ARRAY['küpe','rose','minimal']::text[]),
    ('kktc-seed-jewelry', 'Deri Bileklik Erkek', 'El yapımı düğüm, manyetik klips.', 279.00, 329.00, 'jewelry', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', 44, ARRAY['bileklik','deri','erkek']::text[])
) AS p(
  store_slug,
  name,
  description,
  price,
  compare_price,
  category,
  image_url,
  stock,
  tags
)
  ON s.slug = p.store_slug
WHERE s.slug LIKE 'kktc-seed-%'
  AND NOT EXISTS (
    SELECT 1
    FROM public.vendor_products AS vp
    WHERE vp.store_id = s.id
      AND vp.name = p.name
  );
