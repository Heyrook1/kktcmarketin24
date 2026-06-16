import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import type { AgentContext } from "./context"
import { assertFilesExist } from "./context"

const requiredPages = [
  "app/page.tsx",
  "app/urunler/page.tsx",
  "app/categories/page.tsx",
  "app/cart/page.tsx",
  "app/checkout/page.tsx",
  "app/account/page.tsx",
  "app/vendor-panel/page.tsx",
  "app/vendor-panel/products/page.tsx",
  "app/vendor-panel/orders/page.tsx",
  "app/help/page.tsx",
  "app/contact/page.tsx",
  "app/privacy/page.tsx",
  "app/terms/page.tsx",
]

const requiredLayoutComponents = [
  "components/layout/site-header.tsx",
  "components/layout/mobile-nav.tsx",
  "components/layout/footer.tsx",
  "components/shared/search-bar.tsx",
  "components/cart/cart-drawer.tsx",
]

export async function uiKontrol(context: AgentContext): Promise<void> {
  await assertFilesExist(context, requiredLayoutComponents)

  const pageFiles = await collectPageFiles(path.join(context.projectDir, "app"))
  if (pageFiles.length === 0) {
    throw new Error("App Router sayfası bulunamadı.")
  }

  await context.log(`${pageFiles.length} App Router sayfası bulundu.`)
  await detectMisconfiguredClientComponents(context, pageFiles)
}

export async function eksikSayfalar(context: AgentContext): Promise<void> {
  await assertFilesExist(context, requiredPages)
}

async function collectPageFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name)

      if (entry.isDirectory()) {
        return collectPageFiles(fullPath)
      }

      return entry.isFile() && entry.name === "page.tsx" ? [fullPath] : []
    }),
  )

  return files.flat()
}

async function detectMisconfiguredClientComponents(context: AgentContext, pageFiles: string[]): Promise<void> {
  const problems: string[] = []

  for (const pageFile of pageFiles) {
    const content = await readFile(pageFile, "utf8")
    const isClientComponent = content.startsWith("\"use client\"") || content.startsWith("'use client'")
    const usesServerOnlyNavigation = content.includes("redirect(")

    if (isClientComponent && usesServerOnlyNavigation) {
      problems.push(path.relative(context.projectDir, pageFile))
    }
  }

  if (problems.length > 0) {
    throw new Error(`Client component içinde server redirect kullanımı: ${problems.join(", ")}`)
  }

  await context.log("UI sayfalarında temel client/server ayrımı doğrulandı.")
}
