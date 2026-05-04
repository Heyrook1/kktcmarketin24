import path from "node:path"

import {
  type AgentContext,
  createAgentLog,
  getFileInventory,
  pathExists,
  readProjectFile,
  runPnpmScript,
} from "./shared"

export async function uiKontrol(context: AgentContext): Promise<void> {
  const log = createAgentLog(context, "FRONTEND")
  const inventory = await getFileInventory(context.projectDir)

  if (inventory.components.length === 0) {
    throw new Error("No React components were found under components/")
  }

  const requiredUiFiles = [
    "components/layout/site-header.tsx",
    "components/layout/footer.tsx",
    "components/home/hero-section.tsx",
    "components/product/product-card.tsx",
    "app/page.tsx",
  ]

  const missingFiles = (
    await Promise.all(
      requiredUiFiles.map(async (relativePath) => ({
        exists: await pathExists(path.join(context.projectDir, relativePath)),
        relativePath,
      })),
    )
  )
    .filter((file) => !file.exists)
    .map((file) => file.relativePath)

  if (missingFiles.length > 0) {
    throw new Error(`Missing frontend files: ${missingFiles.join(", ")}`)
  }

  const result = await runPnpmScript(context.projectDir, "lint")
  await log(`${result.command} completed. Checked ${inventory.components.length} components.`)
}

export async function eksikSayfalar(context: AgentContext): Promise<void> {
  const log = createAgentLog(context, "FRONTEND")
  const inventory = await getFileInventory(context.projectDir)
  const requiredPages = [
    "app/page.tsx",
    "app/urunler/page.tsx",
    "app/categories/page.tsx",
    "app/vendors/page.tsx",
    "app/cart/page.tsx",
    "app/checkout/page.tsx",
    "app/account/page.tsx",
    "app/contact/page.tsx",
    "app/help/page.tsx",
  ]

  const missingPages = requiredPages.filter((page) => !inventory.pages.includes(page))
  if (missingPages.length > 0) {
    throw new Error(`Missing required pages: ${missingPages.join(", ")}`)
  }

  const manifest = await readProjectFile(context.projectDir, "public/manifest.json")
  if (!manifest.includes("Marketin24")) {
    throw new Error("PWA manifest does not include Marketin24 branding")
  }

  await log(`${inventory.pages.length} pages discovered; required customer pages are present.`)
}
