import path from "node:path"

import {
  appendAgentLog,
  assertNonEmptyFile,
  listFilesByExtension,
  pathExists,
  projectPath,
  readProjectFile,
  requireProjectFiles,
} from "./agent-utils.ts"

const requiredRouteFiles = [
  "app/page.tsx",
  "app/categories/page.tsx",
  "app/checkout/page.tsx",
  "app/contact/page.tsx",
  "app/api/contact/route.ts",
  "app/api/vendor/products/route.ts",
  "app/api/vendor/orders/[id]/status/route.ts",
]

const requiredQualityFiles = [
  "proxy.ts",
  "docs/qa-cross-role-checklist.md",
  "scripts/027_super_admin_role.sql",
]

export async function tamTarama(projectDirectory?: string): Promise<void> {
  const rootDirectory = projectDirectory ?? process.cwd()

  await requireProjectFiles(rootDirectory, requiredRouteFiles)

  const appFiles = await listFilesByExtension(projectPath(rootDirectory, "app"), [".ts", ".tsx"])
  const routeCount = appFiles.filter((filePath) => path.basename(filePath) === "route.ts").length
  const pageCount = appFiles.filter((filePath) => path.basename(filePath) === "page.tsx").length

  if (pageCount === 0) {
    throw new Error("App Router icinde sayfa bulunamadi.")
  }

  await appendAgentLog(
    rootDirectory,
    "qa-agent.log",
    `Site taramasi tamamlandi: ${pageCount} sayfa, ${routeCount} API route kontrol edildi.`,
  )
}

export async function kaliteKontrol(projectDirectory?: string): Promise<void> {
  const rootDirectory = projectDirectory ?? process.cwd()

  await requireProjectFiles(rootDirectory, requiredQualityFiles)

  const proxySource = await readProjectFile(rootDirectory, "proxy.ts")
  await assertNonEmptyFile(rootDirectory, "docs/qa-cross-role-checklist.md")

  if (!proxySource.includes("export async function proxy")) {
    throw new Error("proxy.ts beklenen proxy fonksiyonunu disa aktarmiyor.")
  }

  if (!proxySource.includes("'/super-admin'")) {
    throw new Error("Super admin rotalari proxy korumasinda gorunmuyor.")
  }

  const packageLockExists = await pathExists(projectPath(rootDirectory, "pnpm-lock.yaml"))
  await appendAgentLog(
    rootDirectory,
    "qa-agent.log",
    `Kalite kontrol tamamlandi: proxy, QA dokumani ve kilit dosyasi (${packageLockExists ? "var" : "yok"}) incelendi.`,
  )
}
