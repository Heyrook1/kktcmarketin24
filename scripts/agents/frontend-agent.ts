import fs from "node:fs/promises"

import {
  assertFileContains,
  assertPathExists,
  getProjectPath,
  listFiles,
  type AgentResult,
} from "./shared.ts"

export async function uiKontrol(): Promise<AgentResult> {
  const checkedItems: string[] = []

  await assertPathExists("app/layout.tsx")
  checkedItems.push("app/layout.tsx")

  await assertPathExists("components/layout/site-header.tsx")
  checkedItems.push("components/layout/site-header.tsx")

  await assertPathExists("components/layout/footer.tsx")
  checkedItems.push("components/layout/footer.tsx")

  await assertFileContains("app/globals.css", ["@import", "tailwind"])
  checkedItems.push("app/globals.css")

  return {
    summary: "Temel layout, header, footer ve global stil dosyalari bulundu.",
    details: checkedItems,
  }
}

export async function eksikSayfalar(): Promise<AgentResult> {
  const requiredPages = [
    "app/page.tsx",
    "app/about/page.tsx",
    "app/contact/page.tsx",
    "app/products/page.tsx",
    "app/cart/page.tsx",
    "app/checkout/page.tsx",
    "app/account/page.tsx",
    "app/help/page.tsx",
    "app/privacy/page.tsx",
    "app/terms/page.tsx",
  ]

  await Promise.all(requiredPages.map((pagePath) => assertPathExists(pagePath)))

  const appDirectory = getProjectPath("app")
  const appEntries = await fs.readdir(appDirectory, { withFileTypes: true })
  const topLevelRoutes = appEntries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_") && entry.name !== "api")
    .map((entry) => entry.name)
    .sort()

  return {
    summary: "Zorunlu sayfalar bulundu ve ust seviye route listesi olusturuldu.",
    details: [
      ...requiredPages,
      `top-level-routes: ${topLevelRoutes.join(", ")}`,
    ],
  }
}

export async function componentEnvanteri(): Promise<AgentResult> {
  const componentFiles = await listFiles("components", ".tsx")

  if (componentFiles.length === 0) {
    throw new Error("components altinda TSX bileseni bulunamadi.")
  }

  return {
    summary: `${componentFiles.length} frontend bileseni bulundu.`,
    details: componentFiles.slice(0, 20),
  }
}
