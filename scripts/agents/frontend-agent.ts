import {
  appendAgentLog,
  projectPath,
  requireFileIncludes,
  requireProjectFiles,
} from "./agent-utils.ts"

export async function uiKontrol(projectDirectory?: string): Promise<void> {
  const requiredUiFiles = [
    "components/layout/site-header.tsx",
    "components/layout/footer.tsx",
    "components/product/product-card.tsx",
    "components/shared/search-bar.tsx",
  ]

  await requireProjectFiles(projectDirectory, requiredUiFiles)
  await requireFileIncludes(
    projectDirectory,
    "app/globals.css",
    "@import",
    "Global stil giris dosyasi Tailwind/CSS importlarini icermiyor.",
  )

  await appendAgentLog(
    projectDirectory,
    "frontend-agent.log",
    "UI kontrolu tamamlandi: temel layout, urun ve arama bilesenleri mevcut.",
  )
}

export async function eksikSayfalar(projectDirectory?: string): Promise<void> {
  const criticalRoutes = [
    "app/page.tsx",
    "app/categories/page.tsx",
    "app/category/[slug]/page.tsx",
    "app/urunler/page.tsx",
    "app/urunler/[id]/page.tsx",
    "app/cart/page.tsx",
    "app/checkout/page.tsx",
    "app/checkout/success/page.tsx",
    "app/contact/page.tsx",
    "app/help/page.tsx",
    "app/terms/page.tsx",
    "app/vendors/page.tsx",
    "app/vendor-login/page.tsx",
  ]

  for (const routePath of criticalRoutes) {
    await requireProjectFiles(projectDirectory, [routePath])
  }

  await requireProjectFiles(projectDirectory, ["app/auth", "app/vendor", "app/admin"])

  if (process.env.ORCHESTRATOR_STRICT_ENV === "true" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ortam degiskeni tanimli degil.")
  }

  await appendAgentLog(
    projectDirectory,
    "frontend-agent.log",
    `Eksik sayfa kontrolu tamamlandi: ${criticalRoutes.length} kritik rota dogrulandi. Proje: ${projectPath(".", projectDirectory)}`,
  )
}
