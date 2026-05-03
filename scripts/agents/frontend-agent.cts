type Check = {
  label: string
  ok: boolean
  detail: string
}

type AgentUtils = {
  assertChecks: (agentName: string, checks: Check[]) => void
  fileExists: (relativePath: string) => boolean
  fileIncludes: (relativePath: string, token: string) => boolean
}

const { assertChecks, fileExists, fileIncludes }: AgentUtils = require("./utils.cts")

async function uiKontrol(): Promise<void> {
  const checks: Check[] = [
    {
      label: "Site header",
      ok: fileExists("components/layout/site-header.tsx"),
      detail: "Ana navigasyon bileseni mevcut",
    },
    {
      label: "Mobile navigation",
      ok: fileExists("components/layout/mobile-nav.tsx"),
      detail: "Mobil navigasyon bileseni mevcut",
    },
    {
      label: "Homepage hero",
      ok: fileExists("components/home/cyprus-hero.tsx") || fileExists("components/home/hero-section.tsx"),
      detail: "Anasayfa hero bileseni aranıyor",
    },
    {
      label: "Global styles",
      ok: fileExists("app/globals.css") || fileExists("styles/globals.css"),
      detail: "Global stil dosyasi mevcut",
    },
  ]

  assertChecks("frontend-agent", checks)
}

async function eksikSayfalar(): Promise<void> {
  const requiredPages = [
    "app/page.tsx",
    "app/products/page.tsx",
    "app/categories/page.tsx",
    "app/vendors/page.tsx",
    "app/cart/page.tsx",
    "app/checkout/page.tsx",
    "app/contact/page.tsx",
    "app/help/page.tsx",
  ]

  const checks = requiredPages.map((relativePath) => ({
    label: relativePath,
    ok: fileExists(relativePath),
    detail: fileExists(relativePath) ? "Sayfa mevcut" : "Sayfa eksik",
  }))

  checks.push({
    label: "Search page client",
    ok: fileIncludes("app/search/search-client.tsx", "/api/search"),
    detail: "Arama sayfasi API entegrasyonu kontrol ediliyor",
  })

  assertChecks("frontend-agent", checks)
}

module.exports = {
  eksikSayfalar,
  uiKontrol,
}
