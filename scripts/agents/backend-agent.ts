import path from "node:path"

import { appendAgentLog, listFilesByExtension, projectPath, readProjectFile, requireProjectFiles } from "./agent-utils.ts"

const requiredApiFiles = [
  "app/api/worker/outbox-flush/route.ts",
  "app/api/worker/otp-expire/route.ts",
  "app/api/vendor/orders/[id]/status/route.ts",
  "app/api/orders/[id]/status/route.ts",
  "app/api/contact/route.ts",
  "app/api/seller-application/route.ts",
  "app/api/vendor/products/route.ts",
]

const requiredSupabaseScripts = [
  "scripts/001_auth_schema.sql",
  "scripts/024_vendor_order_status_workflow.sql",
  "scripts/028_vendor_order_5_state_model.sql",
  "scripts/029_support_threads_and_messages.sql",
]

export async function apiSagligi(projectDirectory?: string): Promise<void> {
  const rootDirectory = projectPath(projectDirectory)
  await requireProjectFiles(projectDirectory, requiredApiFiles)

  const vendorStatusRoute = await readProjectFile(projectDirectory, "app/api/vendor/orders/[id]/status/route.ts")
  const legacyStatusRoute = await readProjectFile(projectDirectory, "app/api/orders/[id]/status/route.ts")
  const routeFiles = await listFilesByExtension(path.join(rootDirectory, "app", "api"), [".ts"])

  if (!vendorStatusRoute.includes("updateVendorOrderStatus")) {
    throw new Error("Vendor siparis durum rotasi kanonik yardimciyi kullanmiyor.")
  }

  if (!legacyStatusRoute.includes("updateVendorOrderStatus")) {
    throw new Error("Legacy siparis durum rotasi kanonik yardimciyi kullanmiyor.")
  }

  await appendAgentLog(
    projectDirectory,
    "backend-agent.log",
    `API sagligi tamamlandi: ${routeFiles.length} route dosyasi ve siparis durum is akisi kontrol edildi.`,
  )
}

export async function supabaseKontrol(projectDirectory?: string): Promise<void> {
  await requireProjectFiles(projectDirectory, requiredSupabaseScripts)

  const checkoutSaga = await readProjectFile(projectDirectory, "lib/checkout/saga.ts")
  const vendorAuth = await readProjectFile(projectDirectory, "lib/vendor-auth.ts")
  const requiredEnvNames = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]
  const missingEnvNames = requiredEnvNames.filter((envName) => !process.env[envName])

  if (!checkoutSaga.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("Checkout saga servis rolu anahtariyla yapilandirilmamis.")
  }

  if (!vendorAuth.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("Vendor auth servis rolu anahtariyla yapilandirilmamis.")
  }

  await appendAgentLog(
    projectDirectory,
    "backend-agent.log",
    `Supabase kontrolu tamamlandi: migration dosyalari ve servis istemcileri kontrol edildi. Eksik env: ${missingEnvNames.join(", ") || "yok"}.`,
  )
}
