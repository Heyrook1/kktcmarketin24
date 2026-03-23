import { execSync } from "child_process"
import { existsSync, unlinkSync } from "fs"
import { join } from "path"

const root = "/vercel/share/v0-project"

// Remove stale lockfile if it exists
const lockfile = join(root, "pnpm-lock.yaml")
if (existsSync(lockfile)) {
  unlinkSync(lockfile)
  console.log("Removed stale pnpm-lock.yaml")
}

// Regenerate lockfile with no frozen flag
console.log("Running pnpm install --no-frozen-lockfile ...")
try {
  execSync("pnpm install --no-frozen-lockfile", {
    cwd: root,
    stdio: "inherit",
    timeout: 120_000,
  })
  console.log("pnpm install completed successfully")
} catch (err) {
  console.error("pnpm install failed:", err.message)
  process.exit(1)
}
