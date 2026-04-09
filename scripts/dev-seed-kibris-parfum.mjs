import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    process.env[key] = value;
  }
}

function toSlug(input) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  loadEnvLocal();

  const targetOwnerEmail = (process.argv[2] ?? "superadmin@marketin24.com").trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersData, error: usersErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (usersErr) throw new Error(`listUsers failed: ${usersErr.message}`);

  const exactUser = usersData.users.find((u) => (u.email ?? "").toLowerCase() === targetOwnerEmail);
  const owner = exactUser ?? usersData.users[0];
  if (!owner) throw new Error("No auth users found. Create at least one account first.");

  const store = {
    owner_id: owner.id,
    name: "Kibris Parfum",
    slug: "kibris-parfum",
    description: "Niche ve designer parfümler, kalıcı esanslar ve premium hediye setleri.",
    location: "Girne, KKTC",
    logo_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
    cover_url: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=1600&q=80",
    is_active: true,
    is_verified: true,
  };

  const { data: upsertedStore, error: storeErr } = await admin
    .from("vendor_stores")
    .upsert(store, { onConflict: "slug" })
    .select("id, name, slug, owner_id")
    .single();
  if (storeErr || !upsertedStore) throw new Error(`vendor_stores upsert failed: ${storeErr?.message ?? "unknown"}`);

  const products = [
    {
      name: "Amber Oud Intense 100ml",
      description: "Odunsu-amber karakterli, güçlü ve kalıcı unisex EDP. Akşam kullanımına uygundur.",
      image_url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1000&q=80",
    },
    {
      name: "Citrus Vetiver Signature 100ml",
      description: "Narenciye açılışı ve vetiver kalbiyle ferah, modern ve ofis dostu bir günlük parfüm.",
      image_url: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1000&q=80",
    },
    {
      name: "Rose Musk Velvet 100ml",
      description: "Gül ve misk uyumuyla zarif, yumuşak ve sofistike bir imza koku.",
      image_url: "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=1000&q=80",
    },
    {
      name: "Spice Noir Elixir 100ml",
      description: "Baharat, vanilya ve sıcak odunsu notalar; iddialı ve karizmatik koku profili.",
      image_url: "https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=1000&q=80",
    },
    {
      name: "White Floral Pure 100ml",
      description: "Beyaz çiçekler, yumuşak pudralı dokunuş ve temiz his veren zarif EDP.",
      image_url: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=1000&q=80",
    },
    {
      name: "Ocean Breeze Aqua 100ml",
      description: "Deniz esintisi ve aromatik notalarla canlı, sport ve ferah bir yaz kokusu.",
      image_url: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=1000&q=80",
    },
  ].map((p) => ({
    store_id: upsertedStore.id,
    name: p.name,
    description: p.description,
    price: 1800,
    compare_price: 2200,
    category: "beauty",
    image_url: p.image_url,
    images: [p.image_url],
    stock: 1,
    is_active: true,
    tags: ["parfum", "fragrance", "niche", "demo", toSlug(p.name)],
  }));

  const { data: existingProducts } = await admin
    .from("vendor_products")
    .select("name")
    .eq("store_id", upsertedStore.id);

  const existingNames = new Set((existingProducts ?? []).map((p) => p.name));
  const toInsert = products.filter((p) => !existingNames.has(p.name));

  if (toInsert.length > 0) {
    const { error: insertErr } = await admin.from("vendor_products").insert(toInsert);
    if (insertErr) throw new Error(`vendor_products insert failed: ${insertErr.message}`);
  }

  const { data: finalProducts } = await admin
    .from("vendor_products")
    .select("name, price, stock, is_active")
    .eq("store_id", upsertedStore.id)
    .order("created_at", { ascending: false });

  console.log("Seed completed.");
  console.log(`Store: ${upsertedStore.name} (${upsertedStore.slug})`);
  console.log(`Owner: ${targetOwnerEmail} ${exactUser ? "" : "(fallback first user used)"}`);
  console.log(`Products total: ${finalProducts?.length ?? 0}`);
  for (const p of finalProducts ?? []) {
    console.log(`- ${p.name} | ₺${p.price} | stock:${p.stock} | active:${p.is_active}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

