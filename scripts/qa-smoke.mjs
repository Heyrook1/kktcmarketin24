import fs from "node:fs"
import path from "node:path"

const root = process.cwd()

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  return fs.readFileSync(fullPath, "utf8")
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function includes(relativePath, token) {
  return read(relativePath).includes(token)
}

try {
  assert(fs.existsSync(path.join(root, "proxy.ts")), "proxy.ts is missing")
  assert(includes("proxy.ts", "export async function proxy"), "proxy.ts does not export proxy function")
  assert(includes("proxy.ts", "'/super-admin'"), "proxy.ts does not protect super-admin routes")

  assert(
    includes("app/api/vendor/orders/[id]/status/route.ts", "updateVendorOrderStatus"),
    "Vendor status route is not using canonical update helper"
  )
  assert(
    includes("app/api/orders/[id]/status/route.ts", "updateVendorOrderStatus"),
    "Legacy status route is not aligned with canonical helper"
  )

  assert(
    includes("app/api/returns/route.ts", 'İade talebi sadece teslim edilen siparişler için açılabilir.'),
    "Returns route does not enforce delivered-state server validation"
  )
  assert(
    includes("app/api/notifications/order-placed/route.ts", "sendOrderPlacedNotifications"),
    "Order placed notification route is not using shared email pipeline"
  )
  assert(
    includes("app/api/orders/notify/route.ts", "sendOrderPlacedNotifications"),
    "Legacy notify route is not aligned with shared email pipeline"
  )

  assert(
    includes("docs/qa-cross-role-checklist.md", "Cross-Role QA Checklist"),
    "Cross-role QA checklist doc is missing"
  )
  assert(
    fs.existsSync(path.join(root, "scripts", "027_super_admin_role.sql")),
    "super admin role SQL script is missing"
  )

  process.stdout.write("QA smoke checks passed.\n")
  process.exit(0)
} catch (error) {
  process.stderr.write(`QA smoke checks failed: ${error.message}\n`)
  process.exit(1)
}
