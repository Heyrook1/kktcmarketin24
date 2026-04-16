import fs from "node:fs"
import path from "node:path"
import process from "node:process"
import { createClient } from "@supabase/supabase-js"

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const text = fs.readFileSync(filePath, "utf8")
  const env = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const key = match[1]
    let value = match[2] ?? ""
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  return env
}

function getSupabaseConfig() {
  const fromFile = loadEnvFile(path.join(process.cwd(), ".env.local"))
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || fromFile.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || fromFile.SUPABASE_SERVICE_ROLE_KEY
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fromFile.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return { url, serviceKey, anonKey }
}

async function main() {
  const { url, serviceKey, anonKey } = getSupabaseConfig()
  const key = serviceKey || anonKey

  if (!url || !key) {
    throw new Error(
      "Missing Supabase config. Need NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY (preferred) or NEXT_PUBLIC_SUPABASE_ANON_KEY in env or .env.local."
    )
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: list, error: listError } = await supabase
    .from("vendor_products")
    .select("id,name,price")
    .ilike("name", "%samsung%")
    .order("name", { ascending: true })
    .limit(200)

  if (listError) throw new Error(`List error: ${listError.message}`)

  console.log("LIST")
  console.log(JSON.stringify(list ?? [], null, 2))

  const { data: price45, error: findError } = await supabase
    .from("vendor_products")
    .select("id,name,price")
    .eq("price", 45)
    .ilike("name", "%samsung%")
    .limit(10)

  if (findError) throw new Error(`Find error: ${findError.message}`)

  if (!price45 || price45.length === 0) {
    console.log("NO_MATCH_PRICE_45")
    return
  }

  if (price45.length > 1) {
    console.log("MULTIPLE_MATCH_PRICE_45")
    console.log(JSON.stringify(price45, null, 2))
    process.exitCode = 3
    return
  }

  if (!serviceKey) {
    throw new Error(
      "Update requires SUPABASE_SERVICE_ROLE_KEY (RLS-safe). It was not found in env or .env.local."
    )
  }

  const row = price45[0]

  const { error: updateError } = await supabase
    .from("vendor_products")
    .update({ price: 45000 })
    .eq("id", row.id)

  if (updateError) throw new Error(`Update error: ${updateError.message}`)

  const { data: after, error: verifyError } = await supabase
    .from("vendor_products")
    .select("id,name,price")
    .eq("id", row.id)
    .single()

  if (verifyError) throw new Error(`Verify error: ${verifyError.message}`)

  console.log("UPDATED")
  console.log(
    JSON.stringify(
      { id: row.id, name: row.name, oldPrice: row.price, newPrice: after.price },
      null,
      2
    )
  )
}

main().catch((err) => {
  console.error(String(err?.message ?? err))
  process.exit(1)
})

