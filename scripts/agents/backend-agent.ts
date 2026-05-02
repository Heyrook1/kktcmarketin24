import { assertFileIncludes, assertPathExists, assertRequiredEnvironment, listRoutes, type AgentResult } from "./shared.ts"

const requiredApiEnvironment = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const

export async function apiSagligi(): Promise<AgentResult> {
  const apiRoutes = (await listRoutes("app/api")).filter((routePath) => routePath.endsWith("route.ts"))

  if (apiRoutes.length === 0) {
    throw new Error("API route bulunamadi.")
  }

  await assertFileIncludes("app/api/worker/outbox-flush/route.ts", "outbox_events")
  await assertFileIncludes("app/api/checkout/place-order/route.ts", "POST")

  return {
    summary: `${apiRoutes.length} API route dosyasi bulundu ve kritik endpointler kontrol edildi.`,
    details: apiRoutes.slice(0, 20),
  }
}

export async function supabaseKontrol(): Promise<AgentResult> {
  assertRequiredEnvironment(requiredApiEnvironment)

  await assertFileIncludes("lib/supabase/server.ts", "createServerClient")
  await assertFileIncludes("lib/supabase/client.ts", "createBrowserClient")
  await assertPathExists("scripts/001_auth_schema.sql")

  return {
    summary: "Supabase istemcileri, servis degiskenleri ve auth semasi kontrol edildi.",
    details: [...requiredApiEnvironment, "lib/supabase/server.ts", "lib/supabase/client.ts"],
  }
}
