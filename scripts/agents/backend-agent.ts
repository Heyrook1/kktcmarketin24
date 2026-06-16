import { createClient } from "@supabase/supabase-js"
import {
  type AgentContext,
  assertFilesExist,
  fetchWithTimeout,
  runPackageScript,
} from "./context"

function getSiteUrl(context: AgentContext): string | null {
  return (
    context.env.MARKETIN24_SITE_URL ??
    context.env.NEXT_PUBLIC_SITE_URL ??
    context.env.VERCEL_URL ??
    null
  )
}

async function checkEndpoint(context: AgentContext, label: string, pathname: string): Promise<void> {
  const siteUrl = getSiteUrl(context)

  if (!siteUrl) {
    await context.log(`${label}: canlı URL tanımlı değil, endpoint ping atlandı.`)
    return
  }

  const baseUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`
  const response = await fetchWithTimeout(`${baseUrl}${pathname}`)

  if (!response.ok) {
    throw new Error(`${label} HTTP ${response.status} döndü.`)
  }

  await context.log(`${label}: HTTP ${response.status}`)
}

export async function apiSagligi(context: AgentContext): Promise<void> {
  await assertFilesExist(context, [
    "app/api/currency/route.ts",
    "app/api/search/route.ts",
    "app/api/worker/outbox-flush/route.ts",
  ])
  await runPackageScript(context, "typecheck", { timeoutMs: 180_000 })
  await checkEndpoint(context, "Kur API", "/api/currency")
}

export async function supabaseKontrol(context: AgentContext): Promise<void> {
  const supabaseUrl = context.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = context.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = context.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const apiKey = serviceRoleKey ?? anonKey

  if (!supabaseUrl || !apiKey) {
    await context.log("Supabase env eksik; statik bağlantı kontrolleri çalıştırılıyor.")
    await assertFilesExist(context, [
      "lib/supabase/server.ts",
      "lib/supabase/client.ts",
      "scripts/check-connections.mjs",
    ])
    return
  }

  const supabase = createClient(supabaseUrl, apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  const { error } = await supabase.from("vendor_products").select("id", { count: "exact", head: true }).limit(1)

  if (error) {
    throw new Error(`Supabase sorgusu başarısız: ${error.message}`)
  }

  await context.log("Supabase bağlantısı doğrulandı.")
}
