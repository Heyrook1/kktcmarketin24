import path from "node:path"

import {
  type AgentContext,
  createAgentLog,
  getFileInventory,
  pathExists,
  readProjectFile,
  runPnpmScript,
} from "./shared"

const criticalApiRoutes = [
  "app/api/checkout/place-order/route.ts",
  "app/api/orders/my/route.ts",
  "app/api/vendor/orders/[id]/status/route.ts",
  "app/api/worker/outbox-flush/route.ts",
]

const criticalSqlScripts = [
  "scripts/001_auth_schema.sql",
  "scripts/005_saga_orders.sql",
  "scripts/027_super_admin_role.sql",
  "scripts/029_support_threads_and_messages.sql",
]

export async function apiSagligi(context: AgentContext): Promise<void> {
  const log = createAgentLog(context, "BACKEND")
  const inventory = await getFileInventory(context.projectDir)

  if (inventory.apiRoutes.length === 0) {
    throw new Error("No API route handlers were found under app/api.")
  }

  await assertRequiredFiles(context.projectDir, [...criticalApiRoutes, "lib/checkout/saga.ts"])
  const missingHandlers = await findRoutesWithoutHandlers(context.projectDir, inventory.apiRoutes)

  if (missingHandlers.length > 0) {
    throw new Error(`API route handlers are missing HTTP exports: ${missingHandlers.join(", ")}`)
  }

  const result = await runPnpmScript(context.projectDir, "typecheck")
  await log(`${result.command} completed. ${inventory.apiRoutes.length} API routes checked.`)
}

export async function supabaseKontrol(context: AgentContext): Promise<void> {
  const log = createAgentLog(context, "BACKEND")
  await assertRequiredFiles(context.projectDir, criticalSqlScripts)

  const packageJson = JSON.parse(await readProjectFile(context.projectDir, "package.json")) as {
    dependencies?: Record<string, string>
  }

  if (!packageJson.dependencies?.["@supabase/supabase-js"] || !packageJson.dependencies["@supabase/ssr"]) {
    throw new Error("Supabase dependencies are missing from package.json.")
  }

  const sagaContent = await readProjectFile(context.projectDir, "lib/checkout/saga.ts")
  if (!sagaContent.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("Checkout saga is not configured to use the Supabase service role key.")
  }

  await log(`${criticalSqlScripts.length} SQL scripts and Supabase dependencies verified.`)
}

async function assertRequiredFiles(projectDir: string, relativePaths: readonly string[]): Promise<void> {
  const missingPaths: string[] = []

  await Promise.all(
    relativePaths.map(async (relativePath) => {
      if (!(await pathExists(path.join(projectDir, relativePath)))) {
        missingPaths.push(relativePath)
      }
    }),
  )

  if (missingPaths.length > 0) {
    throw new Error(`Missing backend files: ${missingPaths.sort().join(", ")}`)
  }
}

async function findRoutesWithoutHandlers(projectDir: string, routePaths: readonly string[]): Promise<string[]> {
  const handlerExportPattern = /export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)|export\s+const\s+(GET|POST|PUT|PATCH|DELETE)\b/
  const missingHandlers: string[] = []

  await Promise.all(
    routePaths.map(async (routePath) => {
      const content = await readProjectFile(projectDir, routePath)
      if (!handlerExportPattern.test(content)) {
        missingHandlers.push(routePath)
      }
    }),
  )

  return missingHandlers.sort()
}
