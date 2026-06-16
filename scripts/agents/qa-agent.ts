import { assertFilesExist, type AgentContext, runPackageScript } from "./context"

const CRITICAL_ROUTES = [
  "app/page.tsx",
  "app/urunler/page.tsx",
  "app/cart/page.tsx",
  "app/checkout/page.tsx",
  "app/vendor-panel/page.tsx",
  "app/admin/vendors/page.tsx",
]

export async function tamTarama(context: AgentContext): Promise<void> {
  await assertFilesExist(context, CRITICAL_ROUTES)
  await runPackageScript(context, "test:qa")
}

export async function kaliteKontrol(context: AgentContext): Promise<void> {
  await runPackageScript(context, "lint", { timeoutMs: 180_000 })
}
