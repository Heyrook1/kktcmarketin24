type Check = {
  label: string
  ok: boolean
  detail: string
}

type AgentUtils = {
  assertChecks: (agentName: string, checks: Check[]) => void
  fileExists: (relativePath: string) => boolean
  fileIncludes: (relativePath: string, token: string) => boolean
  hasEnvironmentValue: (name: string) => boolean
}

const {
  assertChecks,
  fileExists,
  fileIncludes,
  hasEnvironmentValue,
}: AgentUtils = require("./utils.cts")

async function apiSagligi(): Promise<void> {
  const checks: Check[] = [
    {
      label: "Search API",
      ok: fileExists("app/api/search/route.ts"),
      detail: "Urun arama API rotasi mevcut",
    },
    {
      label: "Checkout API",
      ok: fileExists("app/api/checkout/place-order/route.ts"),
      detail: "Siparis olusturma API rotasi mevcut",
    },
    {
      label: "Returns API validation",
      ok: fileIncludes("app/api/returns/route.ts", "delivered"),
      detail: "Iade akisi teslim durumunu dogruluyor",
    },
    {
      label: "Worker outbox",
      ok: fileExists("app/api/worker/outbox-flush/route.ts"),
      detail: "Outbox worker rotasi mevcut",
    },
  ]

  assertChecks("backend-agent", checks)
}

async function supabaseKontrol(): Promise<void> {
  const checks: Check[] = [
    {
      label: "Supabase URL",
      ok: hasEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL"),
      detail: hasEnvironmentValue("NEXT_PUBLIC_SUPABASE_URL") ? "Ortam degiskeni mevcut" : "Ortam degiskeni eksik",
    },
    {
      label: "Supabase anon key",
      ok: hasEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      detail: hasEnvironmentValue("NEXT_PUBLIC_SUPABASE_ANON_KEY") ? "Ortam degiskeni mevcut" : "Ortam degiskeni eksik",
    },
    {
      label: "Server Supabase helper",
      ok: fileExists("lib/supabase/server.ts"),
      detail: "Sunucu Supabase yardimcisi mevcut",
    },
    {
      label: "Middleware Supabase helper",
      ok: fileExists("lib/supabase/middleware.ts"),
      detail: "Middleware Supabase yardimcisi mevcut",
    },
  ]

  assertChecks("backend-agent", checks)
}

module.exports = {
  apiSagligi,
  supabaseKontrol,
}
