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

async function tamTarama(): Promise<void> {
  const requiredFiles = [
    "app/page.tsx",
    "app/api/search/route.ts",
    "app/api/checkout/place-order/route.ts",
    "proxy.ts",
    "docs/qa-cross-role-checklist.md",
    "scripts/qa-smoke.mjs",
  ]

  const checks = requiredFiles.map((relativePath) => ({
    label: relativePath,
    ok: fileExists(relativePath),
    detail: fileExists(relativePath) ? "Mevcut" : "Eksik",
  }))

  assertChecks("qa-agent", checks)
}

async function kaliteKontrol(): Promise<void> {
  const checks: Check[] = [
    {
      label: "QA smoke script",
      ok: fileExists("scripts/qa-smoke.mjs"),
      detail: "scripts/qa-smoke.mjs kontrol ediliyor",
    },
    {
      label: "Cross-role QA checklist",
      ok: fileIncludes("docs/qa-cross-role-checklist.md", "Cross-Role QA Checklist"),
      detail: "QA kontrol dokumani ana basligi aranıyor",
    },
    {
      label: "Super admin guard",
      ok: fileIncludes("proxy.ts", "'/super-admin'"),
      detail: "Super admin rota korumasi aranıyor",
    },
    {
      label: "Shared order notification pipeline",
      ok: fileIncludes("app/api/notifications/order-placed/route.ts", "sendOrderPlacedNotifications"),
      detail: "Siparis bildirimleri ortak pipeline uzerinden geciyor",
    },
  ]

  assertChecks("qa-agent", checks)
}

module.exports = {
  kaliteKontrol,
  tamTarama,
}
