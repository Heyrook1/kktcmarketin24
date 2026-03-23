// Regenerate pnpm-lock.yaml by deleting it and running pnpm install
import { execSync } from "child_process"
import { existsSync, unlinkSync } from "fs"
import { join } from "path"

const root = "/vercel/share/v0-project"
const lockfile = join(root, "pnpm-lock.yaml")

console.log("[v0] Checking for broken lockfile...")

if (existsSync(lockfile)) {
  unlinkSync(lockfile)
  console.log("[v0] Deleted corrupted pnpm-lock.yaml")
} else {
  console.log("[v0] No lockfile found, will create fresh one")
}

console.log("[v0] Running pnpm install --no-frozen-lockfile to regenerate lockfile...")

try {
  execSync("pnpm install --no-frozen-lockfile", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
  })
  console.log("[v0] pnpm-lock.yaml successfully regenerated!")
} catch (err) {
  console.error("[v0] pnpm install failed:", err)
  process.exit(1)
}
